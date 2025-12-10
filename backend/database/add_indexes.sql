-- Database Performance Indexes
-- Run this script to add indexes for improved query performance

-- Index for location queries by user and timestamp
CREATE INDEX IF NOT EXISTS idx_locations_user_timestamp 
ON locations(user_id, timestamp DESC);

-- Index for session token lookups
CREATE INDEX IF NOT EXISTS idx_sessions_token 
ON sessions(token);

-- Index for alerts by user and read status
CREATE INDEX IF NOT EXISTS idx_alerts_user_read 
ON alerts(user_id, is_read);

-- Index for user geofence assignments
CREATE INDEX IF NOT EXISTS idx_user_geofences_user 
ON user_geofences(user_id);

-- Index for user geofence by geofence_id
CREATE INDEX IF NOT EXISTS idx_user_geofences_geofence 
ON user_geofences(geofence_id);

-- Index for active geofences
CREATE INDEX IF NOT EXISTS idx_geofences_active 
ON geofences(is_active);

-- Index for user email (for login lookups)
CREATE INDEX IF NOT EXISTS idx_users_email 
ON users(email);

-- Index for user username (for login lookups)
CREATE INDEX IF NOT EXISTS idx_users_username 
ON users(username);
