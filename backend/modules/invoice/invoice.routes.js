const express = require('express');
const router = express.Router();
const InvoiceController = require('./invoice.controller');
const PaymentController = require('../payment/payment.controller');
const verifyToken = require('../../middleware/auth');
const requireRole = require('../../middleware/role');

// Admin, Manager and Bookkeeper accesses
router.get('/', verifyToken, requireRole('admin', 'manager'), InvoiceController.getInvoices);

// Send Overdue Reminders (Bulk)
router.post('/send-reminders', verifyToken, requireRole('admin', 'manager'), InvoiceController.sendOverdueReminders);

router.get('/:id', verifyToken, requireRole('admin', 'manager', 'agency_bookkeeper'), InvoiceController.getInvoiceById);
router.put('/:id', verifyToken, requireRole('admin', 'manager'), InvoiceController.updateInvoice);
router.patch('/:id/approve', verifyToken, requireRole('admin', 'manager'), InvoiceController.approveInvoice);
router.patch('/:id/cancel', verifyToken, requireRole('admin'), InvoiceController.cancelInvoice);

// Send invoice email with PDF
router.post('/:id/send', verifyToken, requireRole('admin', 'manager'), InvoiceController.sendInvoiceEmail);

// Nested Payments endpoints
router.get('/:id/payments', verifyToken, requireRole('admin', 'manager'), PaymentController.getInvoicePayments);
router.post('/:id/payments', verifyToken, requireRole('admin', 'manager'), PaymentController.recordPayment);

module.exports = router;
