import express from 'express';
import { query, queryOne, insert, update, remove } from '../lib/db.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all customers
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { search } = req.query;
    let sql = 'SELECT * FROM Customer WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (FirstName LIKE ? OR SureName LIKE ? OR Email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY FirstName ASC';

    const customers = await query(sql, params);
    res.json(customers);
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Failed to get customers' });
  }
});

// Get customer by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const customer = await queryOne('SELECT * FROM Customer WHERE CustomerID = ?', [req.params.id]);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Failed to get customer' });
  }
});

// Create customer
router.post('/', authMiddleware, roleMiddleware('admin', 'manager'), async (req, res) => {
  try {
    const data = req.body;
    const result = await insert(
      `INSERT INTO Customer (
        Title, FirstName, SureName, Occupation, Email,
        HomePhone, WorkPhone, MobilePhone, BrithDate, Gender,
        RegisterDate, BankType, BankName, SortCode, AccountNo,
        IBAN, AddressLine, City, PostCode, Rate, Note, UserID
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.title, data.firstName, data.sureName, data.occupation, data.email,
        data.homePhone, data.workPhone, data.mobilePhone, data.birthDate, data.gender,
        data.registerDate || new Date(), data.bankType, data.bankName, data.sortCode, data.accountNo,
        data.iban, data.addressLine, data.city, data.postCode, data.rate, data.note, data.userId
      ]
    );

    const customer = await queryOne('SELECT * FROM Customer WHERE CustomerID = ?', [result]);
    res.status(201).json(customer);
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Update customer
router.put('/:id', authMiddleware, roleMiddleware('admin', 'manager'), async (req, res) => {
  try {
    const data = req.body;
    await update(
      `UPDATE Customer SET
        Title = ?, FirstName = ?, SureName = ?, Occupation = ?, Email = ?,
        HomePhone = ?, WorkPhone = ?, MobilePhone = ?, BrithDate = ?, Gender = ?,
        BankType = ?, BankName = ?, SortCode = ?, AccountNo = ?, IBAN = ?,
        AddressLine = ?, City = ?, PostCode = ?, Rate = ?, Note = ?
      WHERE CustomerID = ?`,
      [
        data.title, data.firstName, data.sureName, data.occupation, data.email,
        data.homePhone, data.workPhone, data.mobilePhone, data.birthDate, data.gender,
        data.bankType, data.bankName, data.sortCode, data.accountNo, data.iban,
        data.addressLine, data.city, data.postCode, data.rate, data.note, req.params.id
      ]
    );

    const customer = await queryOne('SELECT * FROM Customer WHERE CustomerID = ?', [req.params.id]);
    res.json(customer);
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Delete customer
router.delete('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    await remove('DELETE FROM Customer WHERE CustomerID = ?', [req.params.id]);
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

export default router;
