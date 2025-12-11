const pool = require('../config/database');
const { sendNotification } = require('./notifications');
const logger = require('../config/logger');

// Store io instance
let socketIo = null;

/**
 * Set the Socket.IO instance for real-time notifications
 */
function setSocketIo(io) {
  socketIo = io;
  logger.info('Socket.IO instance set for geofencing');
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Check if a point is inside a geofence
 */
function isInsideGeofence(latitude, longitude, geofence) {
  const distance = calculateDistance(
    latitude,
    longitude,
    geofence.center_latitude,
    geofence.center_longitude
  );
  return distance <= geofence.radius_meters;
}

/**
 * Check geofences for a user's location and create alerts if needed
 * @param {number} userId - User ID
 * @param {number} latitude - Current latitude
 * @param {number} longitude - Current longitude
 * @param {number} currentLocationId - ID of the current location record (to avoid race condition)
 */
async function checkGeofences(userId, latitude, longitude, currentLocationId) {
  try {
    // Get all active geofences that this user is assigned to
    const [userGeofences] = await pool.execute(
      `SELECT g.*, ug.alert_on_entry, ug.alert_on_exit
       FROM geofences g
       INNER JOIN user_geofences ug ON g.id = ug.geofence_id
       WHERE ug.user_id = $1 AND g.is_active = TRUE`,
      [userId]
    );

    if (userGeofences.length === 0) {
      return { isOutOfZone: false };
    }

    // Get user's previous location (excluding the current one we just inserted)
    const [lastLocations] = await pool.execute(
      `SELECT latitude, longitude FROM locations 
       WHERE user_id = $1 AND id < $2
       ORDER BY timestamp DESC LIMIT 1`,
      [userId, currentLocationId]
    );

    // Check each geofence
    for (const geofence of userGeofences) {
      const wasInThisGeofence = lastLocations.length > 0
        ? isInsideGeofence(lastLocations[0].latitude, lastLocations[0].longitude, geofence)
        : false;
      const isInThisGeofence = isInsideGeofence(latitude, longitude, geofence);

      // Entry detection
      if (!wasInThisGeofence && isInThisGeofence && geofence.alert_on_entry) {
        logger.info('Geofence entry detected', {
          userId,
          geofenceId: geofence.id,
          geofenceName: geofence.name
        });
        await createAlert(
          userId,
          geofence.id,
          'geofence_entry',
          `Entered geofence: ${geofence.name}`
        );
      }

      // Exit detection
      if (wasInThisGeofence && !isInThisGeofence && geofence.alert_on_exit) {
        logger.info('Geofence exit detected', {
          userId,
          geofenceId: geofence.id,
          geofenceName: geofence.name
        });
        await createAlert(
          userId,
          geofence.id,
          'geofence_exit',
          `Exited geofence: ${geofence.name}`
        );
      }
    }

    // Calculate overall "Out of Zone" status
    // Logic: If user has assigned geofences with alert_on_exit=true (Safe Zones),
    // they are "Out of Zone" if they are NOT inside ANY of them.
    let isOutOfZone = false;
    const safeZones = userGeofences.filter(g => g.alert_on_exit);

    if (safeZones.length > 0) {
      const insideAnySafeZone = safeZones.some(g => isInsideGeofence(latitude, longitude, g));
      isOutOfZone = !insideAnySafeZone;
    }

    return { isOutOfZone };
  } catch (error) {
    logger.error('Geofence check error', { error: error.message, userId });
    return { isOutOfZone: false };
  }
}

/**
 * Create an alert in the database and send notifications
 */
async function createAlert(userId, geofenceId, alertType, message) {
  try {
    // Insert alert
    const [result] = await pool.execute(
      `INSERT INTO alerts (user_id, geofence_id, alert_type, message) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [userId, geofenceId, alertType, message]
    );

    const alertId = result[0].id;

    // Get user and geofence info for notifications
    const [users] = await pool.execute(
      'SELECT username, email, phone_number, full_name FROM users WHERE id = $1',
      [userId]
    );

    const [geofences] = await pool.execute(
      'SELECT name FROM geofences WHERE id = $1',
      [geofenceId]
    );

    if (users.length > 0) {
      const user = users[0];
      const geofence = geofences[0];

      // Create alert object for Socket.IO
      const alertData = {
        id: alertId,
        user_id: userId,
        geofence_id: geofenceId,
        alert_type: alertType,
        message,
        is_read: false,
        notification_sent: true,
        created_at: new Date().toISOString(),
        username: user.username,
        full_name: user.full_name,
        geofence_name: geofence?.name || null
      };

      // Emit real-time alert via Socket.IO
      if (socketIo) {
        socketIo.emit('new_alert', alertData);
        logger.debug('Emitted new_alert event', { alertId, alertType });
      }

      // Send notifications (email, SMS, etc.)
      await sendNotification({
        userId,
        email: user.email,
        phone: user.phone_number,
        message,
        alertType
      });

      // Mark notification as sent
      await pool.execute(
        'UPDATE alerts SET notification_sent = TRUE WHERE id = $1',
        [alertId]
      );
    }

    return alertId;
  } catch (error) {
    console.error('Create alert error:', error);
    throw error;
  }
}

module.exports = {
  calculateDistance,
  isInsideGeofence,
  checkGeofences,
  createAlert,
  setSocketIo
};
