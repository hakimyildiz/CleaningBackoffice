const mysql = require('mysql2/promise');
const env = require('./env');
const logger = require('../utils/logger');

const pool = mysql.createPool({
  host: env.DB.host,
  port: env.DB.port,
  database: env.DB.database,
  user: env.DB.user,
  password: env.DB.password,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test connection on startup
(async () => {
  try {
    const connection = await pool.getConnection();
    logger.info(`Successfully connected to MariaDB database: ${env.DB.database} on ${env.DB.host}:${env.DB.port}`);
    connection.release();
  } catch (err) {
    logger.error(`Database connection failed: ${err.message}`);
    // Do not crash, wait for DB to start up if inside Docker
  }
})();

module.exports = pool;
