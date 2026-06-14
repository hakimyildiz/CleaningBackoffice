const express = require('express');
const router = express.Router();
const UserController = require('./user.controller');
const verifyToken = require('../../middleware/auth');
const requireRole = require('../../middleware/role');

router.get('/', verifyToken, requireRole('admin'), UserController.getUsers);
router.patch('/:id/status', verifyToken, requireRole('admin'), UserController.toggleUserStatus);
router.post('/:id/reset-password', verifyToken, requireRole('admin'), UserController.resetPassword);

module.exports = router;
