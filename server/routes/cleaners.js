import express from 'express';
import { query, queryOne, insert, update, remove, generateUUID } from '../lib/db.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all cleaners
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { isActive, search } = req.query;
    let sql = 'SELECT * FROM Cleaner WHERE 1=1';
    const params = [];

    if (isActive !== undefined) {
      sql += ' AND IsActive = ?';
      params.push(isActive === 'true');
    }

    if (search) {
      sql += ' AND (FirstName LIKE ? OR SureName LIKE ? OR Email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY FirstName ASC';

    const cleaners = await query(sql, params);
    res.json(cleaners);
  } catch (error) {
    console.error('Get cleaners error:', error);
    res.status(500).json({ error: 'Failed to get cleaners' });
  }
});

// Get cleaner by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const cleaner = await queryOne('SELECT * FROM Cleaner WHERE CleanerID = ?', [req.params.id]);

    if (!cleaner) {
      return res.status(404).json({ error: 'Cleaner not found' });
    }

    res.json(cleaner);
  } catch (error) {
    console.error('Get cleaner error:', error);
    res.status(500).json({ error: 'Failed to get cleaner' });
  }
});

// Create cleaner
router.post('/', authMiddleware, roleMiddleware('admin', 'manager'), async (req, res) => {
  try {
    const data = req.body;
    const result = await insert(
      `INSERT INTO Cleaner (
        Title, FirstName, SureName, Occupation, Email,
        HomePhone, WorkPhone, MobilePhone, BrithDate, Gender,
        RegisterDate, BankType, BankName, SortCode, AccountNo,
        IBAN, AddressLine, City, PostCode, NINo,
        IsActive, Rate, Note, UserID
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.Title, data.FirstName, data.SureName, data.Occupation, data.Email,
        data.HomePhone, data.WorkPhone, data.MobilePhone, data.BrithDate, data.Gender,
        data.RegisterDate || new Date(), data.BankType, data.BankName, data.SortCode, data.AccountNo,
        data.IBAN, data.AddressLine, data.City, data.PostCode, data.NINo,
        data.IsActive ?? true, data.Rate, data.Note, data.UserID || null
      ]
    );

    const cleaner = await queryOne('SELECT * FROM Cleaner WHERE CleanerID = ?', [result]);
    res.status(201).json(cleaner);
  } catch (error) {
    console.error('Create cleaner error:', error);
    res.status(500).json({ error: 'Failed to create cleaner' });
  }
});

// Update cleaner
router.put('/:id', authMiddleware, roleMiddleware('admin', 'manager', 'cleaner_manager'), async (req, res) => {
  try {
    const data = req.body;
    await update(
      `UPDATE Cleaner SET
        Title = ?, FirstName = ?, SureName = ?, Occupation = ?, Email = ?,
        HomePhone = ?, WorkPhone = ?, MobilePhone = ?, BrithDate = ?, Gender = ?,
        BankType = ?, BankName = ?, SortCode = ?, AccountNo = ?, IBAN = ?,
        AddressLine = ?, City = ?, PostCode = ?, NINo = ?,
        IsActive = ?, Rate = ?, Note = ?
      WHERE CleanerID = ?`,
      [
        data.Title, data.FirstName, data.SureName, data.Occupation, data.Email,
        data.HomePhone, data.WorkPhone, data.MobilePhone, data.BrithDate, data.Gender,
        data.BankType, data.BankName, data.SortCode, data.AccountNo, data.IBAN,
        data.AddressLine, data.City, data.PostCode, data.NINo,
        data.IsActive, data.Rate, data.Note, req.params.id
      ]
    );

    const cleaner = await queryOne('SELECT * FROM Cleaner WHERE CleanerID = ?', [req.params.id]);
    res.json(cleaner);
  } catch (error) {
    console.error('Update cleaner error:', error);
    res.status(500).json({ error: 'Failed to update cleaner' });
  }
});

// Delete cleaner
router.delete('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    await remove('DELETE FROM Cleaner WHERE CleanerID = ?', [req.params.id]);
    res.json({ message: 'Cleaner deleted successfully' });
  } catch (error) {
    console.error('Delete cleaner error:', error);
    res.status(500).json({ error: 'Failed to delete cleaner' });
  }
});

// Toggle active status
router.patch('/:id/toggle-active', authMiddleware, roleMiddleware('admin', 'manager', 'cleaner_manager'), async (req, res) => {
  try {
    const cleaner = await queryOne('SELECT IsActive FROM Cleaner WHERE CleanerID = ?', [req.params.id]);

    if (!cleaner) {
      return res.status(404).json({ error: 'Cleaner not found' });
    }

    await update('UPDATE Cleaner SET IsActive = ? WHERE CleanerID = ?', [!cleaner.IsActive, req.params.id]);

    const updated = await queryOne('SELECT * FROM Cleaner WHERE CleanerID = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    console.error('Toggle cleaner status error:', error);
    res.status(500).json({ error: 'Failed to toggle cleaner status' });
  }
});

export default router;
