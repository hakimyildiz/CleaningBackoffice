const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(`${req.method} ${req.originalUrl} - Error: ${err.message}`);
  
  if (err.stack) {
    logger.error(err.stack);
  }

  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
};

module.exports = errorHandler;
