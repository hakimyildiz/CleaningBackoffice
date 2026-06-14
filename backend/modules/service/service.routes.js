const express = require('express');
const router = express.Router();
const ServiceController = require('./service.controller');
const verifyToken = require('../../middleware/auth');
const requireRole = require('../../middleware/role');

// Get all services list (admin, manager, cleaner_manager)
router.get('/', verifyToken, requireRole('admin', 'manager', 'cleaner_manager'), ServiceController.getServices);

// Get single service detail (admin, manager, cleaner_manager)
router.get('/:id', verifyToken, requireRole('admin', 'manager', 'cleaner_manager'), ServiceController.getServiceById);

// Get service history (admin, manager, cleaner_manager)
router.get('/:id/history', verifyToken, requireRole('admin', 'manager', 'cleaner_manager'), ServiceController.getServiceHistory);

// Create new service (admin, manager)
router.post('/', verifyToken, requireRole('admin', 'manager'), ServiceController.createService);

// Update service (admin, manager)
router.put('/:id', verifyToken, requireRole('admin', 'manager'), ServiceController.updateService);

// Toggle service status (admin, manager)
router.patch('/:id/status', verifyToken, requireRole('admin', 'manager'), ServiceController.toggleServiceStatus);

// Soft delete service (admin only)
router.delete('/:id', verifyToken, requireRole('admin'), ServiceController.deleteService);

module.exports = router;
