const cron = require('node-cron');
const db = require('../config/db');
const logger = require('../utils/logger');

// Run at 00:05 every night
cron.schedule('5 0 * * *', async () => {
  const timestamp = new Date().toISOString();
  try {
    const query = `
      UPDATE ServiceRecord
      SET Status = 'missed'
      WHERE Status = 'scheduled'
        AND ScheduledDate < CURRENT_DATE()
    `;
    const [result] = await db.query(query);
    logger.info(`[CRON] Missed job cron ran at ${timestamp}. ${result.affectedRows} schedule occurrences marked as missed.`);
  } catch (err) {
    logger.error(`[CRON] Missed job cron failed at ${timestamp}: ${err.message}`);
  }
});

logger.info('[CRON] Missed job cron initialized to run daily at 00:05.');
