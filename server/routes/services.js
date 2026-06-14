import express from 'express';
import { query, queryOne, insert, update, remove, generateUUID } from '../lib/db.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { isActive, search } = req.query;
    let sql = 'SELECT * FROM Service WHERE 1=1';
    const params = [];

    if (isActive !== undefined) {
      sql += ' AND IsActive = ?';
      params.push(isActive === 'true');
    }

    if (search) {
      sql += ' AND (RefNo LIKE ? OR AddressLine LIKE ? OR City LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY CreatedAt DESC';

    const services = await query(sql, params);
    res.json(services);
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ error: 'Failed to get services' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const service = await queryOne('SELECT * FROM Service WHERE ServiceID = ?', [req.params.id]);

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Get periods for this service
    const periods = await query('SELECT * FROM ServicePeriod WHERE ServiceID = ?', [req.params.id]);
    res.json({ ...service, periods });
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({ error: 'Failed to get service' });
  }
});

router.post('/', authMiddleware, roleMiddleware('admin', 'manager', 'agency_manager'), async (req, res) => {
  try {
    const data = req.body;
    const serviceId = generateUUID();

    await insert(
      `INSERT INTO Service (
        ServiceID, CustomerID, AgencyID, AgencyStaffID, RefNo,
        Rate, AddressLine, City, PostCode, Beds, Kitchen, Bathroom, Pet, IsActive, Note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        serviceId, data.customerId || null, data.agencyId || null, data.agencyStaffId || null, data.refNo,
        data.rate, data.addressLine, data.city, data.postCode, data.beds || 0, data.kitchen || 1, data.bathroom || 1, data.pet || false, data.isActive ?? true, data.note
      ]
    );

    // Create default period if provided
    if (data.period) {
      const periodId = generateUUID();
      await insert(
        `INSERT INTO ServicePeriod (ServicePeriodID, ServiceID, Period, WeekOfDay, MonthOfWeek, MonthOfDay, PreferredTime, WorkingHours, IsActive)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [periodId, serviceId, data.period, data.weekOfDay, data.monthOfWeek, data.monthOfDay, data.preferredTime, data.workingHours, true]
      );
    }

    const service = await queryOne('SELECT * FROM Service WHERE ServiceID = ?', [serviceId]);
    res.status(201).json(service);
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ error: 'Failed to create service' });
  }
});

router.put('/:id', authMiddleware, roleMiddleware('admin', 'manager', 'agency_manager'), async (req, res) => {
  try {
    const data = req.body;
    await update(
      `UPDATE Service SET
        CustomerID = ?, AgencyID = ?, AgencyStaffID = ?, RefNo = ?,
        Rate = ?, AddressLine = ?, City = ?, PostCode = ?, Beds = ?, Kitchen = ?, Bathroom = ?, Pet = ?, IsActive = ?, Note = ?
      WHERE ServiceID = ?`,
      [
        data.customerId, data.agencyId, data.agencyStaffId, data.refNo,
        data.rate, data.addressLine, data.city, data.postCode, data.beds, data.kitchen, data.bathroom, data.pet, data.isActive, data.note, req.params.id
      ]
    );

    const service = await queryOne('SELECT * FROM Service WHERE ServiceID = ?', [req.params.id]);
    res.json(service);
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

router.delete('/:id', authMiddleware, roleMiddleware('admin', 'manager'), async (req, res) => {
  try {
    await remove('DELETE FROM Service WHERE ServiceID = ?', [req.params.id]);
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

router.patch('/:id/toggle-active', authMiddleware, roleMiddleware('admin', 'manager'), async (req, res) => {
  try {
    const service = await queryOne('SELECT IsActive FROM Service WHERE ServiceID = ?', [req.params.id]);

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    await update('UPDATE Service SET IsActive = ? WHERE ServiceID = ?', [!service.IsActive, req.params.id]);

    const updated = await queryOne('SELECT * FROM Service WHERE ServiceID = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    console.error('Toggle service status error:', error);
    res.status(500).json({ error: 'Failed to toggle service status' });
  }
});

// Service options
router.get('/options/all', authMiddleware, async (req, res) => {
  try {
    const options = await query('SELECT * FROM ServiceOption WHERE IsActive = TRUE ORDER BY Name');
    res.json(options);
  } catch (error) {
    console.error('Get service options error:', error);
    res.status(500).json({ error: 'Failed to get service options' });
  }
});

export default router;
