const validator = require('validator');
const { ApiError } = require('./errorHandler');
const CONSTANTS = require('../config/constants');

/**
 * Sanitize string input
 */
const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return validator.escape(validator.trim(str));
};

/**
 * Validate and sanitize email
 */
const validateEmail = (email) => {
    if (!email || !validator.isEmail(email)) {
        throw new ApiError(400, 'Invalid email address');
    }
    return validator.normalizeEmail(email);
};

/**
 * Validate password strength
 */
const validatePassword = (password) => {
    if (!password || password.length < CONSTANTS.PASSWORD_MIN_LENGTH) {
        throw new ApiError(400, `Password must be at least ${CONSTANTS.PASSWORD_MIN_LENGTH} characters long`);
    }

    // Check for at least one number and one letter
    if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(password)) {
        throw new ApiError(400, 'Password must contain at least one letter and one number');
    }

    return password;
};

/**
 * Validate coordinates
 */
const validateCoordinates = (latitude, longitude) => {
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
        throw new ApiError(400, 'Invalid coordinates: must be valid numbers');
    }

    if (lat < CONSTANTS.LATITUDE_MIN || lat > CONSTANTS.LATITUDE_MAX) {
        throw new ApiError(400, `Latitude must be between ${CONSTANTS.LATITUDE_MIN} and ${CONSTANTS.LATITUDE_MAX}`);
    }

    if (lon < CONSTANTS.LONGITUDE_MIN || lon > CONSTANTS.LONGITUDE_MAX) {
        throw new ApiError(400, `Longitude must be between ${CONSTANTS.LONGITUDE_MIN} and ${CONSTANTS.LONGITUDE_MAX}`);
    }

    return { latitude: lat, longitude: lon };
};

/**
 * Validate username
 */
const validateUsername = (username) => {
    if (!username || username.length < 3 || username.length > 50) {
        throw new ApiError(400, 'Username must be between 3 and 50 characters');
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        throw new ApiError(400, 'Username can only contain letters, numbers, hyphens, and underscores');
    }

    return sanitizeString(username);
};

/**
 * Middleware to validate registration input
 */
const validateRegistration = (req, res, next) => {
    try {
        const { username, email, password, full_name, phone_number } = req.body;

        // Validate required fields
        if (!username || !email || !password) {
            throw new ApiError(400, 'Username, email, and password are required');
        }

        // Validate and sanitize
        req.body.username = validateUsername(username);
        req.body.email = validateEmail(email);
        req.body.password = validatePassword(password);

        // Sanitize optional fields
        if (full_name) {
            req.body.full_name = sanitizeString(full_name);
        }
        if (phone_number) {
            req.body.phone_number = sanitizeString(phone_number);
        }

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Middleware to validate login input
 */
const validateLogin = (req, res, next) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            throw new ApiError(400, 'Username and password are required');
        }

        req.body.username = sanitizeString(username);

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Middleware to validate location input
 */
const validateLocation = (req, res, next) => {
    try {
        const { latitude, longitude } = req.body;

        if (latitude === undefined || longitude === undefined) {
            throw new ApiError(400, 'Latitude and longitude are required');
        }

        const coords = validateCoordinates(latitude, longitude);
        req.body.latitude = coords.latitude;
        req.body.longitude = coords.longitude;

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Middleware to validate geofence input
 */
const validateGeofence = (req, res, next) => {
    try {
        const { name, center_latitude, center_longitude, radius_meters } = req.body;

        if (!name) {
            throw new ApiError(400, 'Geofence name is required');
        }

        if (center_latitude === undefined || center_longitude === undefined) {
            throw new ApiError(400, 'Center coordinates are required');
        }

        if (!radius_meters) {
            throw new ApiError(400, 'Radius is required');
        }

        // Validate coordinates
        const coords = validateCoordinates(center_latitude, center_longitude);
        req.body.center_latitude = coords.latitude;
        req.body.center_longitude = coords.longitude;

        // Validate radius
        const radius = parseFloat(radius_meters);
        if (isNaN(radius) || radius < CONSTANTS.GEOFENCE_MIN_RADIUS_METERS || radius > CONSTANTS.GEOFENCE_MAX_RADIUS_METERS) {
            throw new ApiError(400, `Radius must be between ${CONSTANTS.GEOFENCE_MIN_RADIUS_METERS} and ${CONSTANTS.GEOFENCE_MAX_RADIUS_METERS} meters`);
        }
        req.body.radius_meters = radius;

        // Sanitize name and description
        req.body.name = sanitizeString(name);
        if (req.body.description) {
            req.body.description = sanitizeString(req.body.description);
        }

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    sanitizeString,
    validateEmail,
    validatePassword,
    validateCoordinates,
    validateUsername,
    validateRegistration,
    validateLogin,
    validateLocation,
    validateGeofence
};
