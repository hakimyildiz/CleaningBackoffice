const express = require('express');
const router = express.Router();
const EmployeeController = require('./employee.controller');
const verifyToken = require('../../middleware/auth');
const requireRole = require('../../middleware/role');

router.get('/', verifyToken, requireRole('admin', 'manager', 'cleaner_manager'), EmployeeController.getEmployees);
router.get('/:id', verifyToken, requireRole('admin', 'manager', 'cleaner_manager'), EmployeeController.getEmployeeById);
router.post('/', verifyToken, requireRole('admin', 'manager'), EmployeeController.createEmployee);
router.put('/:id', verifyToken, requireRole('admin', 'manager'), EmployeeController.updateEmployee);
router.patch('/:id/status', verifyToken, requireRole('admin', 'manager'), EmployeeController.toggleEmployeeStatus);
router.delete('/:id', verifyToken, requireRole('admin'), EmployeeController.deleteEmployee);

module.exports = router;
