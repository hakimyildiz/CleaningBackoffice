const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

const requiredEnv = [
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET'
];

// Verify required env variables are present
for (const envVar of requiredEnv) {
  if (!process.env[envVar]) {
    console.error(`Error: Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3001', 10),
  DB: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  },
  JWT: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  MAIL: {
    host: process.env.MAIL_HOST || 'smtp.example.com',
    port: parseInt(process.env.MAIL_PORT || '587', 10),
    secure: process.env.MAIL_SECURE === 'true',
    user: process.env.MAIL_USER || 'noreply@mopsy.app',
    pass: process.env.MAIL_PASS || 'changeme_mail_password',
    from: process.env.MAIL_FROM || '"Mopsy" <noreply@mopsy.app>'
  },
  APP_URL: process.env.APP_URL || 'https://test.bellaclean.co.uk',
  SCHEDULE_LOOKAHEAD_MONTHS: parseInt(process.env.SCHEDULE_LOOKAHEAD_MONTHS, 10) || 6,
  PAUSE_BUFFER_HOURS: parseInt(process.env.PAUSE_BUFFER_HOURS, 10) || 24,
  UPLOAD_BASE_PATH: process.env.UPLOAD_BASE_PATH || 'uploads',
  MAX_PHOTO_SIZE_MB: parseInt(process.env.MAX_PHOTO_SIZE_MB, 10) || 10,
  CHROMIUM_PATH: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
  GOOGLE_SERVICE_ACCOUNT_KEY_PATH: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH || null,
  GOOGLE_DRIVE_ROOT_FOLDER_ID: process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || null,
  INVOICE_DUE_DAYS: parseInt(process.env.INVOICE_DUE_DAYS, 10) || 14,
  DEFAULT_REQUEST_BUFFER_HOURS: parseInt(process.env.DEFAULT_REQUEST_BUFFER_HOURS, 10) || 24
};
