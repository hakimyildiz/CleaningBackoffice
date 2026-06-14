const express = require('express');
const router = express.Router();
const AgencyController = require('./agency.controller');
const verifyToken = require('../../middleware/auth');
const requireRole = require('../../middleware/role');

// Dropdown lookup helper (returns active agencies ID + Name only)
router.get('/lookup', verifyToken, requireRole('admin', 'manager'), async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT AgencyID, Name FROM Agency WHERE IsActive = 1 ORDER BY Name ASC');
    return res.status(200).json({
      success: true,
      data: rows
    });
  } catch (err) {
    next(err);
  }
});

// Get all agencies
router.get('/', verifyToken, requireRole('admin', 'manager'), AgencyController.getAgencies);

// Get single agency detail
router.get('/:id', verifyToken, requireRole('admin', 'manager'), AgencyController.getAgencyById);

// Get staff list for an agency (populated for dropdowns)
router.get('/:id/staff', verifyToken, requireRole('admin', 'manager'), AgencyController.getAgencyStaff);

// Create agency
router.post('/', verifyToken, requireRole('admin', 'manager'), AgencyController.createAgency);

// Update agency
router.put('/:id', verifyToken, requireRole('admin', 'manager'), AgencyController.updateAgency);

// Toggle active status
router.patch('/:id/status', verifyToken, requireRole('admin', 'manager'), AgencyController.toggleAgencyStatus);

// Soft delete agency (admin only)
router.delete('/:id', verifyToken, requireRole('admin'), AgencyController.deleteAgency);

module.exports = router;
