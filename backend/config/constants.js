// Application Constants
// Centralized configuration values to avoid magic numbers

module.exports = {
  // Authentication
  ACCESS_TOKEN_EXPIRY: '30m', // 30 minutes
  REFRESH_TOKEN_EXPIRY: '30d', // 30 days
  PASSWORD_MIN_LENGTH: 8,
  BCRYPT_SALT_ROUNDS: 10,
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100, // per window
  LOGIN_RATE_LIMIT_MAX: 5, // stricter for login endpoint
  
  // Location Tracking
  LOCATION_HISTORY_DEFAULT_LIMIT: 1000,
  LOCATION_HISTORY_MAX_LIMIT: 5000,
  LOCATION_UPDATE_MIN_DISTANCE_METERS: 10,
  
  // Geofencing
  GEOFENCE_MIN_RADIUS_METERS: 10,
  GEOFENCE_MAX_RADIUS_METERS: 50000, // 50km
  
  // Alerts
  ALERTS_DEFAULT_LIMIT: 50,
  ALERTS_MAX_LIMIT: 200,
  
  // Session Management
  SESSION_CLEANUP_INTERVAL_MS: 3600000, // 1 hour
  
  // Database
  DB_CONNECTION_TIMEOUT_MS: 10000,
  DB_MAX_RETRIES: 3,
  DB_RETRY_DELAY_MS: 2000,
  
  // Coordinate Validation
  LATITUDE_MIN: -90,
  LATITUDE_MAX: 90,
  LONGITUDE_MIN: -180,
  LONGITUDE_MAX: 180,
  
  // API
  API_VERSION: 'v1',
};
