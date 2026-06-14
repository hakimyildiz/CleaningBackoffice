import express from 'express';
import { query, queryOne, insert, update, remove, generateUUID } from '../lib/db.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { date, status, cleanerId } = req.query;
    let sql = 'SELECT * FROM ServiceRecord WHERE 1=1';
    const params = [];

    if (date) {
      sql += ' AND RecordDate = ?';
      params.push(date);
    }

    if (status) {
      sql += ' AND Status = ?';
      params.push(status);
    }

    sql += ' ORDER BY RecordDate ASC, CreatedAt ASC';

    const records = await query(sql, params);
    res.json(records);
  } catch (error) {
    console.error('Get service records error:', error);
    res.status(500).json({ error: 'Failed to get service records' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const record = await queryOne('SELECT * FROM ServiceRecord WHERE ServiceRecordID = ?', [req.params.id]);

    if (!record) {
      return res.status(404).json({ error: 'Service record not found' });
    }

    // Get assigned cleaners
    const cleaners = await query(
      `SELECT src.*, c.FirstName, c.SureName
       FROM ServiceRecordCleaner src
       JOIN Cleaner c ON src.CleanerID = c.CleanerID
       WHERE src.ServiceRecordID = ?`,
      [req.params.id]
    );

    // Get details (extra options)
    const details = await query('SELECT * FROM ServiceRecordDetail WHERE ServiceRecordID = ?', [req.params.id]);

    res.json({ ...record, cleaners, details });
  } catch (error) {
    console.error('Get service record error:', error);
    res.status(500).json({ error: 'Failed to get service record' });
  }
});

router.post('/', authMiddleware, roleMiddleware('admin', 'manager', 'cleaner_manager'), async (req, res) => {
  try {
    const data = req.body;
    const recordId = generateUUID();

    await insert(
      `INSERT INTO ServiceRecord (
        ServiceRecordID, ServiceID, CustomerID, AgencyID, AgencyStaffID, RefNo,
        Rate, AddressLine, City, PostCode, Beds, Kitchen, Bathroom, Pet,
        RecordDate, WorkingTime, Note, Status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        recordId, data.serviceId, data.customerId, data.agencyId, data.agencyStaffId, data.refNo,
        data.rate, data.addressLine, data.city, data.postCode, data.beds, data.kitchen, data.bathroom, data.pet,
        data.recordDate, data.workingTime, data.note, data.status || 'Created'
      ]
    );

    const record = await queryOne('SELECT * FROM ServiceRecord WHERE ServiceRecordID = ?', [recordId]);
    res.status(201).json(record);
  } catch (error) {
    console.error('Create service record error:', error);
    res.status(500).json({ error: 'Failed to create service record' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const data = req.body;
    await update(
      `UPDATE ServiceRecord SET
        ServiceID = ?, CustomerID = ?, AgencyID = ?, AgencyStaffID = ?, RefNo = ?,
        Rate = ?, AddressLine = ?, City = ?, PostCode = ?, Beds = ?, Kitchen = ?, Bathroom = ?, Pet = ?,
        RecordDate = ?, WorkingTime = ?, Note = ?, Status = ?
      WHERE ServiceRecordID = ?`,
      [
        data.serviceId, data.customerId, data.agencyId, data.agencyStaffId, data.refNo,
        data.rate, data.addressLine, data.city, data.postCode, data.beds, data.kitchen, data.bathroom, data.pet,
        data.recordDate, data.workingTime, data.note, data.status, req.params.id
      ]
    );

    const record = await queryOne('SELECT * FROM ServiceRecord WHERE ServiceRecordID = ?', [req.params.id]);
    res.json(record);
  } catch (error) {
    console.error('Update service record error:', error);
    res.status(500).json({ error: 'Failed to update service record' });
  }
});

router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    await update('UPDATE ServiceRecord SET Status = ? WHERE ServiceRecordID = ?', [status, req.params.id]);

    const record = await queryOne('SELECT * FROM ServiceRecord WHERE ServiceRecordID = ?', [req.params.id]);
    res.json(record);
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

router.delete('/:id', authMiddleware, roleMiddleware('admin', 'manager'), async (req, res) => {
  try {
    await remove('DELETE FROM ServiceRecord WHERE ServiceRecordID = ?', [req.params.id]);
    res.json({ message: 'Service record deleted successfully' });
  } catch (error) {
    console.error('Delete service record error:', error);
    res.status(500).json({ error: 'Failed to delete service record' });
  }
});

// Clock in/out for cleaners
router.post('/:id/clock-in', authMiddleware, roleMiddleware('cleaner', 'admin', 'manager'), async (req, res) => {
  try {
    const { cleanerId } = req.body;
    const recordId = req.params.id;

    // Check if already clocked in
    const existing = await queryOne(
      'SELECT * FROM ServiceRecordCleaner WHERE ServiceRecordID = ? AND CleanerID = ? AND ClockOutTime IS NULL',
      [recordId, cleanerId]
    );

    if (existing) {
      return res.status(400).json({ error: 'Already clocked in' });
    }

    const srcId = generateUUID();
    await insert(
      'INSERT INTO ServiceRecordCleaner (ServiceRecordCleanerID, ServiceRecordID, CleanerID, ClockInTime) VALUES (?, ?, ?, NOW())',
      [srcId, recordId, cleanerId]
    );

    // Update status to "In Cleaning"
    await update("UPDATE ServiceRecord SET Status = 'In Cleaning' WHERE ServiceRecordID = ? AND Status = 'Created'", [recordId]);

    const record = await queryOne('SELECT * FROM ServiceRecord WHERE ServiceRecordID = ?', [recordId]);
    res.json(record);
  } catch (error) {
    console.error('Clock in error:', error);
    res.status(500).json({ error: 'Failed to clock in' });
  }
});

router.post('/:id/clock-out', authMiddleware, roleMiddleware('cleaner', 'admin', 'manager'), async (req, res) => {
  try {
    const { cleanerId, workingTime, photos } = req.body;
    const recordId = req.params.id;

    await update(
      'UPDATE ServiceRecordCleaner SET ClockOutTime = NOW(), WorkingTime = ?, Photos = ? WHERE ServiceRecordID = ? AND CleanerID = ? AND ClockOutTime IS NULL',
      [workingTime, JSON.stringify(photos || []), recordId, cleanerId]
    );

    // Update status to "Cleaned"
    await update("UPDATE ServiceRecord SET Status = 'Cleaned', WorkingTime = ? WHERE ServiceRecordID = ?", [workingTime, recordId]);

    const record = await queryOne('SELECT * FROM ServiceRecord WHERE ServiceRecordID = ?', [recordId]);
    res.json(record);
  } catch (error) {
    console.error('Clock out error:', error);
    res.status(500).json({ error: 'Failed to clock out' });
  }
});

export default router;
