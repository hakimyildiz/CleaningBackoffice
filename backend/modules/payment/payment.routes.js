const express = require('express');
const router = express.Router();
const PaymentController = require('./payment.controller');
const verifyToken = require('../../middleware/auth');
const requireRole = require('../../middleware/role');

// Admin & Manager accesses
router.get('/', verifyToken, requireRole('admin', 'manager'), PaymentController.getPayments);

// Admin-only deletion
router.delete('/:id', verifyToken, requireRole('admin'), PaymentController.deletePayment);

module.exports = router;
