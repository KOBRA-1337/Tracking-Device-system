const logger = require('../config/logger');

/**
 * Standardized error response format
 */
class ApiError extends Error {
    constructor(statusCode, message, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Express error handling middleware
 */
const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal server error';
    let details = err.details || null;

    // Log error
    if (statusCode >= 500) {
        logger.error('Server error:', {
            error: message,
            stack: err.stack,
            url: req.url,
            method: req.method,
            ip: req.ip,
            details
        });
    } else {
        logger.warn('Client error:', {
            error: message,
            url: req.url,
            method: req.method,
            statusCode,
            details
        });
    }

    // Don't leak error details in production
    if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
        message = 'Internal server error';
        details = null;
    }

    // Send standardized error response
    const response = {
        success: false,
        error: message
    };

    if (details) {
        response.details = details;
    }

    // Include stack trace in development
    if (process.env.NODE_ENV !== 'production' && err.stack) {
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
};

/**
 * 404 handler
 */
const notFoundHandler = (req, res) => {
    logger.warn('Route not found:', {
        url: req.url,
        method: req.method,
        ip: req.ip
    });

    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
};

module.exports = {
    ApiError,
    errorHandler,
    notFoundHandler
};
