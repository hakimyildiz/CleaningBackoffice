const express = require('express');
const router = express.Router();
const ServiceScheduleController = require('./serviceSchedule.controller');
const verifyToken = require('../../middleware/auth');
const requireRole = require('../../middleware/role');

// Get global schedule rows (admin, manager, cleaner_manager)
router.get('/schedule', verifyToken, requireRole('admin', 'manager', 'cleaner_manager'), ServiceScheduleController.getGlobalSchedule);

// Get schedule rows for a specific service (admin, manager, cleaner_manager)
router.get('/services/:serviceId/schedule', verifyToken, requireRole('admin', 'manager', 'cleaner_manager'), ServiceScheduleController.getScheduleByServiceId);

// Update a single occurrence date/time/hours (admin, manager)
router.put('/schedule/:id', verifyToken, requireRole('admin', 'manager'), ServiceScheduleController.updateOccurrence);

// Cancel a single occurrence (admin, manager)
router.delete('/schedule/:id', verifyToken, requireRole('admin', 'manager'), ServiceScheduleController.cancelOccurrence);

// Manually set schedule row to missed or cancelled (admin, manager)
router.patch('/schedule/:id/status', verifyToken, requireRole('admin', 'manager'), ServiceScheduleController.updateStatus);

module.exports = router;
