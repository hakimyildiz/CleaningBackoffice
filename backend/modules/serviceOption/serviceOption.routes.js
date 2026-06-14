const express = require('express');
const router = express.Router();
const ServiceOptionController = require('./serviceOption.controller');
const verifyToken = require('../../middleware/auth');
const requireRole = require('../../middleware/role');

// Get all active options (for dropdowns, accessible by any authenticated user)
router.get('/', verifyToken, ServiceOptionController.getActiveOptions);

// Settings page list (accessible to admin and manager only)
router.get('/all', verifyToken, requireRole('admin', 'manager'), ServiceOptionController.getAllOptions);

// Create service option
router.post('/', verifyToken, requireRole('admin', 'manager'), ServiceOptionController.createOption);

// Update service option
router.put('/:id', verifyToken, requireRole('admin', 'manager'), ServiceOptionController.updateOption);

// Toggle active status
router.patch('/:id/status', verifyToken, requireRole('admin', 'manager'), ServiceOptionController.toggleStatus);

module.exports = router;
