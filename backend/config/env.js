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
  }
};
