const express = require('express');
const router = express.Router();
const AgencyStaffController = require('./agencyStaff.controller');
const verifyToken = require('../../middleware/auth');
const requireRole = require('../../middleware/role');

router.get('/', verifyToken, requireRole('admin', 'manager'), AgencyStaffController.getAgencyStaff);
router.get('/:id', verifyToken, requireRole('admin', 'manager'), AgencyStaffController.getAgencyStaffById);
router.post('/', verifyToken, requireRole('admin', 'manager'), AgencyStaffController.createAgencyStaff);
router.put('/:id', verifyToken, requireRole('admin', 'manager'), AgencyStaffController.updateAgencyStaff);
router.patch('/:id/status', verifyToken, requireRole('admin', 'manager'), AgencyStaffController.toggleAgencyStaffStatus);
router.delete('/:id', verifyToken, requireRole('admin'), AgencyStaffController.deleteAgencyStaff);

module.exports = router;
