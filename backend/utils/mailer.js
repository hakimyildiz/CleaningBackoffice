const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
  host: env.MAIL.host,
  port: env.MAIL.port,
  secure: env.MAIL.secure,
  auth: {
    user: env.MAIL.user,
    pass: env.MAIL.pass
  }
});

// Verify connection configuration
transporter.verify((error, success) => {
  if (error) {
    logger.warn(`Mailer SMTP transporter configuration failed: ${error.message}. Note that emails will fail to send until SMTP settings are configured in .env.`);
  } else {
    logger.info('Mailer SMTP transporter is active and verified.');
  }
});

/**
 * Helper to dispatch HTML emails.
 * If mail fails to send, this throws an error that the caller can catch.
 */
const sendMail = async ({ to, subject, html, attachments }) => {
  try {
    const info = await transporter.sendMail({
      from: env.MAIL.from,
      to,
      subject,
      html,
      attachments
    });
    logger.info(`Email successfully dispatched to <${to}>. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error(`Mailer failed to send email to <${to}>: ${error.message}`);
    throw error;
  }
};

module.exports = {
  sendMail
};
