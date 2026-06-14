const fs = require('fs');
const path = require('path');
const app = require('./app');
const env = require('./config/env');
const logger = require('./utils/logger');

// Ensure the local uploads directory exists
fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });

app.listen(env.PORT, () => {
  logger.info(`Server is running in ${env.NODE_ENV} mode on port ${env.PORT}`);
});
