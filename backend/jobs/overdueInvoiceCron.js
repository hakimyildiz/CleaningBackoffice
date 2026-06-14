const cron = require('node-cron');
const db = require('../config/db');
const logger = require('../utils/logger');

// Run at 01:00 every night
cron.schedule('0 1 * * *', async () => {
  logger.info('Overdue invoices cron job started.');
  try {
    const query = `
      UPDATE Invoice
      SET Status = 'overdue'
      WHERE Status IN ('sent', 'partially_paid')
        AND DueDate < CURDATE()
        AND DueDate IS NOT NULL
    `;
    const [result] = await db.query(query);
    
    logger.info(`Overdue invoices cron ran successfully. ${result.affectedRows} invoices marked overdue.`);
  } catch (error) {
    logger.error(`Overdue invoices cron job failed: ${error.message}`);
  }
});

logger.info('Overdue invoices cron initialized (Scheduled for 01:00 daily).');
