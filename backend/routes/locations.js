const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validateLocation } = require('../middleware/validation');
const { ApiError } = require('../middleware/errorHandler');
const { checkGeofences } = require('../utils/geofencing');
const logger = require('../config/logger');
const CONSTANTS = require('../config/constants');

const router = express.Router();

// Submit location data (from mobile app)
router.post('/', authenticateToken, validateLocation, async (req, res, next) => {
  try {
    const { latitude, longitude, accuracy, speed, heading, altitude } = req.body;
    const userId = req.user.id;

    // Insert location
    const [result] = await pool.execute(
      `INSERT INTO locations (user_id, latitude, longitude, accuracy, speed, heading, altitude) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [userId, latitude, longitude, accuracy || null, speed || null, heading || null, altitude || null]
    );

    const locationId = result[0].id;

    logger.debug('Location saved', { userId, locationId, latitude, longitude });

    // Check geofences and create alerts if needed (pass location ID to avoid race condition)
    const { isOutOfZone } = await checkGeofences(userId, latitude, longitude, locationId);

    // Get user info for the update
    const [users] = await pool.execute(
      'SELECT username, full_name, email FROM users WHERE id = $1',
      [userId]
    );

    // Emit real-time update via Socket.IO
    req.app.get('io').emit('location_update', {
      userId,
      location: {
        id: locationId,
        latitude,
        longitude,
        accuracy,
        speed,
        heading,
        altitude,
        timestamp: new Date(),
        username: users[0]?.username || null,
        full_name: users[0]?.full_name || null,
        email: users[0]?.email || null,
        isOutOfZone // Add this flag
      }
    });

    res.status(201).json({
      success: true,
      message: 'Location saved successfully',
      location_id: locationId
    });
  } catch (error) {
    next(error);
  }
});

// Get current location for a user
router.get('/current/:userId', authenticateToken, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    // Users can only see their own location, admins can see all
    if (parseInt(userId) !== currentUserId && req.user.role !== 'admin') {
      throw new ApiError(403, 'Access denied');
    }

    const [locations] = await pool.execute(
      `SELECT id, latitude, longitude, accuracy, speed, heading, altitude, timestamp 
       FROM locations 
       WHERE user_id = $1 
       ORDER BY timestamp DESC 
       LIMIT 1`,
      [userId]
    );

    if (locations.length === 0) {
      throw new ApiError(404, 'No location data found');
    }

    res.json({ success: true, location: locations[0] });
  } catch (error) {
    next(error);
  }
});

// Get location history for a user
router.get('/history/:userId', authenticateToken, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    const { startDate, endDate, limit = CONSTANTS.LOCATION_HISTORY_DEFAULT_LIMIT } = req.query;

    // Users can only see their own history, admins can see all
    if (parseInt(userId) !== currentUserId && req.user.role !== 'admin') {
      throw new ApiError(403, 'Access denied');
    }

    // Validate and sanitize limit
    const queryLimit = Math.min(Math.max(1, parseInt(limit) || 1000), CONSTANTS.LOCATION_HISTORY_MAX_LIMIT);

    let query = `SELECT id, latitude, longitude, accuracy, speed, heading, altitude, timestamp 
                 FROM locations 
                 WHERE user_id = $1`;
    const params = [parseInt(userId)];

    // Handle datetime-local format (YYYY-MM-DDTHH:mm) and convert to MySQL format
    if (startDate) {
      // Convert datetime-local format to PostgreSQL datetime format (timestamp)
      const formattedStart = startDate.includes('T') ? startDate.replace('T', ' ') + ':00' : startDate;
      query += ` AND timestamp >= $${params.length + 1}`;
      params.push(formattedStart);
    }

    if (endDate) {
      // Convert datetime-local format to PostgreSQL datetime format (timestamp)
      const formattedEnd = endDate.includes('T') ? endDate.replace('T', ' ') + ':59' : endDate;
      query += ` AND timestamp <= $${params.length + 1}`;
      params.push(formattedEnd);
    }

    // Embed LIMIT directly in query (MySQL2 execute doesn't handle LIMIT as placeholder well)
    query += ` ORDER BY timestamp DESC LIMIT ${queryLimit}`;

    logger.debug('History query', { userId, startDate, endDate, queryLimit });

    const [locations] = await pool.execute(query, params);

    res.json({ success: true, locations, count: locations.length });
  } catch (error) {
    logger.error('History error', { error: error.message, userId: req.params.userId });
    next(error);
  }
});

// Get all users' current locations (admin only)
router.get('/all', authenticateToken, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      throw new ApiError(403, 'Admin access required');
    }

    const [locations] = await pool.execute(
      `SELECT l.id, l.user_id, l.latitude, l.longitude, l.accuracy, l.speed, l.heading, 
              l.altitude, l.timestamp, u.username, u.full_name, u.email
       FROM locations l
       INNER JOIN (
         SELECT user_id, MAX(timestamp) as max_timestamp
         FROM locations
         GROUP BY user_id
       ) latest ON l.user_id = latest.user_id AND l.timestamp = latest.max_timestamp
       INNER JOIN users u ON l.user_id = u.id
       WHERE u.is_active = TRUE
       ORDER BY l.timestamp DESC`
    );

    // Get all active geofences and user assignments to calculate "Out of Zone" status
    const [allGeofences] = await pool.execute('SELECT * FROM geofences WHERE is_active = TRUE');
    const [userGeofenceAssignments] = await pool.execute('SELECT * FROM user_geofences');
    const { isInsideGeofence } = require('../utils/geofencing');

    // Calculate status for each location
    const locationsWithStatus = locations.map(loc => {
      // Find assigned "Safe Zones" (alert_on_exit=true) for this user
      const userAssignments = userGeofenceAssignments.filter(ug => ug.user_id === loc.user_id && ug.alert_on_exit);

      let isOutOfZone = false;
      if (userAssignments.length > 0) {
        // Get the actual geofence objects
        const assignedGeofences = userAssignments
          .map(ug => allGeofences.find(g => g.id === ug.geofence_id))
          .filter(g => g); // Filter out undefined if geofence was deleted/inactive (though query filtered active)

        if (assignedGeofences.length > 0) {
          // User is Out of Zone if they are NOT inside ANY of their Safe Zones
          const insideAnySafeZone = assignedGeofences.some(g => isInsideGeofence(loc.latitude, loc.longitude, g));
          isOutOfZone = !insideAnySafeZone;
        }
      }

      return {
        ...loc,
        isOutOfZone
      };
    });

    logger.debug('Admin fetched all locations', { adminId: req.user.id, count: locations.length });

    res.json({ success: true, locations: locationsWithStatus, count: locationsWithStatus.length });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

