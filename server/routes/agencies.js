import express from 'express';
import { query, queryOne, insert, update, remove } from '../lib/db.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { search } = req.query;
    let sql = 'SELECT * FROM Agency WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (Name LIKE ? OR Email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY Name ASC';

    const agencies = await query(sql, params);
    res.json(agencies);
  } catch (error) {
    console.error('Get agencies error:', error);
    res.status(500).json({ error: 'Failed to get agencies' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const agency = await queryOne('SELECT * FROM Agency WHERE AgencyID = ?', [req.params.id]);

    if (!agency) {
      return res.status(404).json({ error: 'Agency not found' });
    }

    res.json(agency);
  } catch (error) {
    console.error('Get agency error:', error);
    res.status(500).json({ error: 'Failed to get agency' });
  }
});

router.post('/', authMiddleware, roleMiddleware('admin', 'manager'), async (req, res) => {
  try {
    const data = req.body;
    const result = await insert(
      `INSERT INTO Agency (
        Name, AddressNo, Street, City, PostCode, Email,
        HomePhone, WorkPhone, MobilePhone, CompanyNo,
        BankType, BankName, SortCode, AccountNo, IBAN, AddressLine, Rate, Note, UserID
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.name, data.addressNo, data.street, data.city, data.postCode, data.email,
        data.homePhone, data.workPhone, data.mobilePhone, data.companyNo,
        data.bankType, data.bankName, data.sortCode, data.accountNo, data.iban, data.addressLine, data.rate, data.note, data.userId
      ]
    );

    const agency = await queryOne('SELECT * FROM Agency WHERE AgencyID = ?', [result]);
    res.status(201).json(agency);
  } catch (error) {
    console.error('Create agency error:', error);
    res.status(500).json({ error: 'Failed to create agency' });
  }
});

router.put('/:id', authMiddleware, roleMiddleware('admin', 'manager'), async (req, res) => {
  try {
    const data = req.body;
    await update(
      `UPDATE Agency SET
        Name = ?, AddressNo = ?, Street = ?, City = ?, PostCode = ?, Email = ?,
        HomePhone = ?, WorkPhone = ?, MobilePhone = ?, CompanyNo = ?,
        BankType = ?, BankName = ?, SortCode = ?, AccountNo = ?, IBAN = ?, AddressLine = ?, Rate = ?, Note = ?
      WHERE AgencyID = ?`,
      [
        data.name, data.addressNo, data.street, data.city, data.postCode, data.email,
        data.homePhone, data.workPhone, data.mobilePhone, data.companyNo,
        data.bankType, data.bankName, data.sortCode, data.accountNo, data.iban, data.addressLine, data.rate, data.note, req.params.id
      ]
    );

    const agency = await queryOne('SELECT * FROM Agency WHERE AgencyID = ?', [req.params.id]);
    res.json(agency);
  } catch (error) {
    console.error('Update agency error:', error);
    res.status(500).json({ error: 'Failed to update agency' });
  }
});

router.delete('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    await remove('DELETE FROM Agency WHERE AgencyID = ?', [req.params.id]);
    res.json({ message: 'Agency deleted successfully' });
  } catch (error) {
    console.error('Delete agency error:', error);
    res.status(500).json({ error: 'Failed to delete agency' });
  }
});

export default router;
