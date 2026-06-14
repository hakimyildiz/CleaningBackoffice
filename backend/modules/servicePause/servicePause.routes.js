const express = require('express');
const router = express.Router();
const ServicePauseController = require('./servicePause.controller');
const verifyToken = require('../../middleware/auth');
const requireRole = require('../../middleware/role');

// Get all pauses list (admin, manager)
router.get('/pauses', verifyToken, requireRole('admin', 'manager'), ServicePauseController.getPauses);

// Request or apply a pause for a service (admin, manager, customer)
router.post('/services/:serviceId/pause', verifyToken, requireRole('admin', 'manager', 'customer'), ServicePauseController.createPause);

// Approve a customer pause request (admin, manager)
router.patch('/pauses/:id/approve', verifyToken, requireRole('admin', 'manager'), ServicePauseController.approvePause);

// Reject a customer pause request (admin, manager)
router.patch('/pauses/:id/reject', verifyToken, requireRole('admin', 'manager'), ServicePauseController.rejectPause);

module.exports = router;
