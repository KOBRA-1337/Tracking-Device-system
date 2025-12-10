const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const logger = require('../config/logger');

// Validate JWT_SECRET at module load time
if (!process.env.JWT_SECRET) {
  throw new Error('CRITICAL: JWT_SECRET environment variable is required but not set');
}

if (!process.env.JWT_REFRESH_SECRET) {
  logger.warn('JWT_REFRESH_SECRET not set - refresh token functionality will not work');
}

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ success: false, error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify user still exists and is active
    const [users] = await pool.execute(
      'SELECT id, username, email, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (users.length === 0 || !users[0].is_active) {
      return res.status(401).json({ success: false, error: 'Invalid or inactive user' });
    }

    req.user = users[0];
    next();
  } catch (error) {
    logger.warn('Authentication failed:', { error: error.message, name: error.name });

    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ success: false, error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ success: false, error: 'Token expired' });
    }
    return res.status(500).json({ success: false, error: 'Authentication error' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  next();
};

module.exports = { authenticateToken, requireAdmin };

