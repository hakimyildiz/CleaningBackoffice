const express = require('express');
const router = express.Router();
const CleanerController = require('./cleaner.controller');
const verifyToken = require('../../middleware/auth');
const requireRole = require('../../middleware/role');

// Cleaner checklist endpoints
router.get('/jobs', verifyToken, requireRole('cleaner', 'cleaner_manager', 'admin', 'manager'), CleanerController.getCleanerJobs);

module.exports = router;
