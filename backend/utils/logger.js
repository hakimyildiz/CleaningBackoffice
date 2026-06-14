const formatTimestamp = () => {
  const now = new Date();
  return now.toISOString().replace('T', ' ').substring(0, 19);
};

const logger = {
  info: (message) => {
    console.log(`[${formatTimestamp()}] [INFO] ${message}`);
  },
  error: (message) => {
    console.error(`[${formatTimestamp()}] [ERROR] ${message}`);
  },
  warn: (message) => {
    console.warn(`[${formatTimestamp()}] [WARN] ${message}`);
  }
};

module.exports = logger;
