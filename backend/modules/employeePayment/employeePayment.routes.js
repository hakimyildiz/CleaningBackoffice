const express = require('express');
const router = express.Router();
const EmployeePaymentController = require('./employeePayment.controller');
const verifyToken = require('../../middleware/auth');
const requireRole = require('../../middleware/role');

// Admin & Manager accesses
router.get('/', verifyToken, requireRole('admin', 'manager'), EmployeePaymentController.getPayments);
router.get('/earnings', verifyToken, requireRole('admin', 'manager'), EmployeePaymentController.getEarningsReport);
router.post('/', verifyToken, requireRole('admin', 'manager'), EmployeePaymentController.recordPayment);

// Admin only payout deletion
router.delete('/:id', verifyToken, requireRole('admin'), EmployeePaymentController.deletePayment);

module.exports = router;
