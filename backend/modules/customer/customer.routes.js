const express = require('express');
const router = express.Router();
const CustomerController = require('./customer.controller');
const verifyToken = require('../../middleware/auth');
const requireRole = require('../../middleware/role');

router.get('/', verifyToken, requireRole('admin', 'manager'), CustomerController.getCustomers);
router.get('/:id', verifyToken, requireRole('admin', 'manager'), CustomerController.getCustomerById);
router.post('/', verifyToken, requireRole('admin', 'manager'), CustomerController.createCustomer);
router.put('/:id', verifyToken, requireRole('admin', 'manager'), CustomerController.updateCustomer);
router.patch('/:id/status', verifyToken, requireRole('admin', 'manager'), CustomerController.toggleCustomerStatus);
router.delete('/:id', verifyToken, requireRole('admin'), CustomerController.deleteCustomer);

module.exports = router;
