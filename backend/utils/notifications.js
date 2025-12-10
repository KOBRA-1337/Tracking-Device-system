const nodemailer = require('nodemailer');
const pool = require('../config/database');
const logger = require('../config/logger');

// Email transporter (configure in .env)
let emailTransporter = null;

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  emailTransporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  logger.info('Email transporter configured');
} else {
  logger.warn('Email credentials not configured - email notifications will not be sent');
}

/**
 * Send notification via email, SMS, and in-app
 */
async function sendNotification({ userId, email, phone, message, alertType }) {
  const results = {
    email: false,
    sms: false,
    inApp: true // Always true as we store in database
  };

  // Send email notification
  if (email && emailTransporter) {
    try {
      await emailTransporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Tracking Alert: ${alertType}`,
        html: `
          <h2>Location Tracking Alert</h2>
          <p><strong>Type:</strong> ${alertType}</p>
          <p><strong>Message:</strong> ${message}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        `
      });
      results.email = true;
      logger.info('Email notification sent', { userId, email, alertType });
    } catch (error) {
      logger.error('Email notification error', { userId, error: error.message });
    }
  }

  // Send SMS notification (requires SMS service like Twilio)
  if (phone && process.env.SMS_API_KEY) {
    try {
      // TODO: Implement SMS sending using Twilio or similar service
      // Example with Twilio:
      // const twilio = require('twilio');
      // const client = twilio(process.env.SMS_API_KEY, process.env.SMS_API_SECRET);
      // await client.messages.create({
      //   body: `Alert: ${message}`,
      //   to: phone,
      //   from: process.env.SMS_FROM_NUMBER
      // });
      results.sms = false; // Set to true when implemented
    } catch (error) {
      logger.error('SMS notification error', { userId, error: error.message });
    }
  }

  return results;
}

module.exports = {
  sendNotification
};


