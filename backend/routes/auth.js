const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validateRegistration, validateLogin } = require('../middleware/validation');
const { ApiError } = require('../middleware/errorHandler');
const logger = require('../config/logger');
const CONSTANTS = require('../config/constants');

const router = express.Router();

/**
 * Generate access and refresh tokens
 */
function generateTokens(user) {
  const payload = { userId: user.id, username: user.username, email: user.email };

  const accessToken = jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: CONSTANTS.ACCESS_TOKEN_EXPIRY }
  );

  let refreshToken = null;
  if (process.env.JWT_REFRESH_SECRET) {
    refreshToken = jwt.sign(
      payload,
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: CONSTANTS.REFRESH_TOKEN_EXPIRY }
    );
  }

  return { accessToken, refreshToken };
}

// Register new user
router.post('/register', validateRegistration, async (req, res, next) => {
  try {
    const { username, email, password, full_name, phone_number } = req.body;

    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUsers.length > 0) {
      throw new ApiError(400, 'Username or email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, CONSTANTS.BCRYPT_SALT_ROUNDS);

    // Insert new user
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password_hash, full_name, phone_number) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [username, email, passwordHash, full_name || null, phone_number || null]
    );

    const userId = result[0].id; // Postgres ID from RETURNING

    logger.info('User registered', { userId, username, email });

    // Generate tokens
    const user = { id: userId, username, email };
    const { accessToken, refreshToken } = generateTokens(user);

    // Store refresh token if available
    if (refreshToken) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

      await pool.execute(
        'INSERT INTO sessions (user_id, token, expires_at, device_info) VALUES ($1, $2, $3, $4)',
        [user.id, refreshToken, expiresAt, JSON.stringify({ type: 'refresh_token', userAgent: req.headers['user-agent'] })]
      );
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      accessToken,
      refreshToken,
      user: {
        id: userId,
        username,
        email,
        full_name,
        role: 'user'
      }
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', validateLogin, async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Find user by username or email
    const [users] = await pool.execute(
      'SELECT id, username, email, password_hash, full_name, role, is_active FROM users WHERE username = $1 OR email = $2',
      [username, username]
    );

    if (users.length === 0) {
      throw new ApiError(401, 'Invalid credentials');
    }

    const user = users[0];

    if (!user.is_active) {
      throw new ApiError(401, 'Account is inactive');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      logger.warn('Failed login attempt', { username, ip: req.ip });
      throw new ApiError(401, 'Invalid credentials');
    }

    logger.info('User logged in', { userId: user.id, username: user.username });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Store refresh token session
    if (refreshToken) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      await pool.execute(
        'INSERT INTO sessions (user_id, token, expires_at, device_info) VALUES ($1, $2, $3, $4)',
        [user.id, refreshToken, expiresAt, JSON.stringify({ type: 'refresh_token', userAgent: req.headers['user-agent'] })]
      );
    }

    res.json({
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
});

// Refresh access token
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ApiError(400, 'Refresh token required');
    }

    if (!process.env.JWT_REFRESH_SECRET) {
      throw new ApiError(500, 'Refresh token functionality not configured');
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Check if refresh token exists in database
    const [sessions] = await pool.execute(
      'SELECT user_id, expires_at FROM sessions WHERE token = $1',
      [refreshToken]
    );

    if (sessions.length === 0) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    const session = sessions[0];

    // Check if session expired
    if (new Date(session.expires_at) < new Date()) {
      await pool.execute('DELETE FROM sessions WHERE token = $1', [refreshToken]);
      throw new ApiError(401, 'Refresh token expired');
    }

    // Get user info
    const [users] = await pool.execute(
      'SELECT id, username, email, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (users.length === 0 || !users[0].is_active) {
      throw new ApiError(401, 'Invalid user');
    }

    const user = users[0];

    // Generate new access token
    const accessToken = jwt.sign(
      { userId: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: CONSTANTS.ACCESS_TOKEN_EXPIRY }
    );

    logger.debug('Access token refreshed', { userId: user.id });

    res.json({
      success: true,
      accessToken
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(new ApiError(401, 'Invalid or expired refresh token'));
    } else {
      next(error);
    }
  }
});

// Get current user info
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, username, email, full_name, phone_number, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (users.length === 0) {
      throw new ApiError(404, 'User not found');
    }

    res.json({
      success: true,
      user: users[0]
    });
  } catch (error) {
    next(error);
  }
});

// Logout
router.post('/logout', authenticateToken, async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    // Delete refresh token session if provided
    if (refreshToken) {
      await pool.execute('DELETE FROM sessions WHERE token = $1', [refreshToken]);
    }

    logger.info('User logged out', { userId: req.user.id });

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
});

// Get all users (admin only) - for geofence assignment
router.get('/users', authenticateToken, async (req, res, next) => {
  try {
    logger.info('Fetching users list', { userId: req.user.id, role: req.user.role });
    // Check if user is admin
    if (req.user.role !== 'admin') {
      throw new ApiError(403, 'Admin access required');
    }

    const [users] = await pool.execute(
      `SELECT id, username, email, full_name, phone_number, role, is_active, created_at 
       FROM users 
       WHERE is_active = TRUE
       ORDER BY username`
    );

    res.json({
      success: true,
      users
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;



