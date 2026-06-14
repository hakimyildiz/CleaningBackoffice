import express from 'express';
import { query, queryOne, insert, update } from '../lib/db.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const settings = await query('SELECT * FROM SystemSettings');

    // Convert to key-value object
    const result = {};
    settings.forEach(s => {
      result[s.SettingKey] = s.SettingValue;
    });

    res.json(result);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

router.put('/:key', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { value } = req.body;
    const key = req.params.key;

    await update(
      'UPDATE SystemSettings SET SettingValue = ? WHERE SettingKey = ?',
      [value, key]
    );

    const setting = await queryOne('SELECT * FROM SystemSettings WHERE SettingKey = ?', [key]);
    res.json(setting);
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

router.post('/', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { key, value } = req.body;

    await insert(
      'INSERT INTO SystemSettings (SettingKey, SettingValue) VALUES (?, ?)',
      [key, value]
    );

    const setting = await queryOne('SELECT * FROM SystemSettings WHERE SettingKey = ?', [key]);
    res.status(201).json(setting);
  } catch (error) {
    console.error('Create setting error:', error);
    res.status(500).json({ error: 'Failed to create setting' });
  }
});

export default router;
