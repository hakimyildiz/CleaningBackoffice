const express = require('express');
const router = express.Router();
const ServiceRecordController = require('./serviceRecord.controller');
const verifyToken = require('../../middleware/auth');
const requireRole = require('../../middleware/role');
const { uploadPhotos } = require('../../middleware/upload');

// Cleaner and Staff: Check-in/out
router.post('/checkin', verifyToken, ServiceRecordController.checkIn);
router.post('/:id/checkout', verifyToken, uploadPhotos, ServiceRecordController.checkOut);

// Listings and details (admin, manager, cleaner_manager)
router.get('/', verifyToken, requireRole('admin', 'manager', 'cleaner_manager'), ServiceRecordController.getServiceRecords);
router.get('/:id', verifyToken, requireRole('admin', 'manager', 'cleaner_manager'), ServiceRecordController.getServiceRecordById);

// Cancel Service Record (admin, manager)
router.patch('/:id/cancel', verifyToken, requireRole('admin', 'manager'), ServiceRecordController.cancelServiceRecord);

// Cleaner Schedule Rule Assignments (admin, manager)
router.post('/schedule/:scheduleId/assign', verifyToken, requireRole('admin', 'manager'), ServiceRecordController.assignCleanersToSchedule);
router.delete('/schedule/:scheduleId/assign/:employeeId', verifyToken, requireRole('admin', 'manager'), ServiceRecordController.removeCleanerFromSchedule);
router.get('/schedule/:scheduleId/cleaners', verifyToken, ServiceRecordController.getScheduleCleaners);

// Active ServiceRecord Cleaners Assignments (admin, manager)
router.post('/:id/assign', verifyToken, requireRole('admin', 'manager'), ServiceRecordController.addCleanerToRecord);
router.delete('/:id/assign/:employeeId', verifyToken, requireRole('admin', 'manager'), ServiceRecordController.removeCleanerFromRecord);

module.exports = router;
