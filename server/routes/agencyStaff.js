import express from 'express';
import { query, queryOne, insert, update, remove } from '../lib/db.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { agencyId, search } = req.query;
    let sql = 'SELECT * FROM AgencyStaff WHERE 1=1';
    const params = [];

    if (agencyId) {
      sql += ' AND AgencyID = ?';
      params.push(agencyId);
    }

    if (search) {
      sql += ' AND (FirstName LIKE ? OR SureName LIKE ? OR Email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY FirstName ASC';

    const staff = await query(sql, params);
    res.json(staff);
  } catch (error) {
    console.error('Get agency staff error:', error);
    res.status(500).json({ error: 'Failed to get agency staff' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const staff = await queryOne('SELECT * FROM AgencyStaff WHERE AgencyStaffID = ?', [req.params.id]);

    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    res.json(staff);
  } catch (error) {
    console.error('Get agency staff error:', error);
    res.status(500).json({ error: 'Failed to get agency staff' });
  }
});

router.post('/', authMiddleware, roleMiddleware('admin', 'manager', 'agency_manager'), async (req, res) => {
  try {
    const data = req.body;
    const result = await insert(
      `INSERT INTO AgencyStaff (
        AgencyID, Title, FirstName, SureName, Occupation, Email,
        HomePhone, WorkPhone, MobilePhone, BrithDate, Gender, RegisterDate,
        AgancyCode, IsActive, Note, UserID
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.agencyId, data.title, data.firstName, data.sureName, data.occupation, data.email,
        data.homePhone, data.workPhone, data.mobilePhone, data.birthDate, data.gender, data.registerDate || new Date(),
        data.agencyCode, data.isActive ?? true, data.note, data.userId
      ]
    );

    const staff = await queryOne('SELECT * FROM AgencyStaff WHERE AgencyStaffID = ?', [result]);
    res.status(201).json(staff);
  } catch (error) {
    console.error('Create agency staff error:', error);
    res.status(500).json({ error: 'Failed to create agency staff' });
  }
});

router.put('/:id', authMiddleware, roleMiddleware('admin', 'manager', 'agency_manager'), async (req, res) => {
  try {
    const data = req.body;
    await update(
      `UPDATE AgencyStaff SET
        AgencyID = ?, Title = ?, FirstName = ?, SureName = ?, Occupation = ?, Email = ?,
        HomePhone = ?, WorkPhone = ?, MobilePhone = ?, BrithDate = ?, Gender = ?,
        AgancyCode = ?, IsActive = ?, Note = ?
      WHERE AgencyStaffID = ?`,
      [
        data.agencyId, data.title, data.firstName, data.sureName, data.occupation, data.email,
        data.homePhone, data.workPhone, data.mobilePhone, data.birthDate, data.gender,
        data.agencyCode, data.isActive, data.note, req.params.id
      ]
    );

    const staff = await queryOne('SELECT * FROM AgencyStaff WHERE AgencyStaffID = ?', [req.params.id]);
    res.json(staff);
  } catch (error) {
    console.error('Update agency staff error:', error);
    res.status(500).json({ error: 'Failed to update agency staff' });
  }
});

router.delete('/:id', authMiddleware, roleMiddleware('admin', 'agency_manager'), async (req, res) => {
  try {
    await remove('DELETE FROM AgencyStaff WHERE AgencyStaffID = ?', [req.params.id]);
    res.json({ message: 'Staff member deleted successfully' });
  } catch (error) {
    console.error('Delete agency staff error:', error);
    res.status(500).json({ error: 'Failed to delete agency staff' });
  }
});

export default router;
