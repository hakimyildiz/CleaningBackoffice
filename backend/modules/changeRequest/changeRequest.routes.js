const express = require('express');
const router = express.Router();
const ChangeRequestController = require('./changeRequest.controller');
const verifyToken = require('../../middleware/auth');
const requireRole = require('../../middleware/role');

// Get requests queue (Admin & Manager)
router.get('/', verifyToken, requireRole('admin', 'manager'), ChangeRequestController.getRequests);

// Submit request (Any authenticated user: Customer, Cleaner, Staff, Admin)
router.post('/', verifyToken, ChangeRequestController.submitRequest);

// Approve request (Admin & Manager)
router.patch('/:id/approve', verifyToken, requireRole('admin', 'manager'), ChangeRequestController.approveRequest);

// Reject request (Admin & Manager)
router.patch('/:id/reject', verifyToken, requireRole('admin', 'manager'), ChangeRequestController.rejectRequest);

module.exports = router;
