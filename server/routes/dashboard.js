import express from 'express';
import { query, queryOne } from '../lib/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get various counts in parallel
    const [
      customerCount,
      activeCleaners,
      todayJobs,
      completedToday,
      pendingInvoices,
      totalRevenue
    ] = await Promise.all([
      queryOne('SELECT COUNT(*) as count FROM Customer'),
      queryOne('SELECT COUNT(*) as count FROM Cleaner WHERE IsActive = TRUE'),
      queryOne('SELECT COUNT(*) as count FROM ServiceRecord WHERE RecordDate = ?', [today]),
      queryOne("SELECT COUNT(*) as count FROM ServiceRecord WHERE RecordDate = ? AND Status IN ('Cleaned', 'Invoice Sent', 'Paid')", [today]),
      queryOne("SELECT COUNT(*) as count FROM Invoice WHERE Status = 'Sent'"),
      queryOne("SELECT SUM(Total) as total FROM Invoice WHERE Status = 'Paid'")
    ]);

    // Get upcoming jobs (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingJobs = await query(
      `SELECT * FROM ServiceRecord
       WHERE RecordDate >= ? AND RecordDate <= ? AND Status IN ('Created', 'In Cleaning')
       ORDER BY RecordDate ASC
       LIMIT 10`,
      [today, nextWeek.toISOString().split('T')[0]]
    );

    res.json({
      totalCustomers: Number(customerCount.count),
      activeCleaners: Number(activeCleaners.count),
      todayJobs: Number(todayJobs.count),
      completedToday: Number(completedToday.count),
      pendingInvoices: Number(pendingInvoices.count),
      totalRevenue: Number(totalRevenue.total || 0),
      upcomingJobs
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to get dashboard stats' });
  }
});

router.get('/calendar', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const records = await query(
      'SELECT * FROM ServiceRecord WHERE RecordDate >= ? AND RecordDate <= ? ORDER BY RecordDate ASC',
      [startDate, endDate]
    );

    // Get cleaner assignments
    const recordIds = records.map(r => r.ServiceRecordID);
    let cleaners = [];

    if (recordIds.length > 0) {
      const placeholders = recordIds.map(() => '?').join(',');
      cleaners = await query(
        `SELECT src.*, c.FirstName, c.SureName
         FROM ServiceRecordCleaner src
         JOIN Cleaner c ON src.CleanerID = c.CleanerID
         WHERE src.ServiceRecordID IN (${placeholders})`,
        recordIds
      );
    }

    res.json({ records, cleaners });
  } catch (error) {
    console.error('Get calendar data error:', error);
    res.status(500).json({ error: 'Failed to get calendar data' });
  }
});

router.get('/cleaner-schedule/:id', authMiddleware, async (req, res) => {
  try {
    const cleanerId = req.params.id;
    const today = new Date().toISOString().split('T')[0];

    const jobs = await query(
      `SELECT sr.* FROM ServiceRecord sr
       JOIN ServiceRecordCleaner src ON sr.ServiceRecordID = src.ServiceRecordID
       WHERE src.CleanerID = ? AND sr.RecordDate >= ?
       ORDER BY sr.RecordDate ASC`,
      [cleanerId, today]
    );

    res.json(jobs);
  } catch (error) {
    console.error('Get cleaner schedule error:', error);
    res.status(500).json({ error: 'Failed to get cleaner schedule' });
  }
});

export default router;
