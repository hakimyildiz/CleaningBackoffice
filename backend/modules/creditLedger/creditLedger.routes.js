const express = require('express');
const router = express.Router();
const CreditLedgerController = require('./creditLedger.controller');
const verifyToken = require('../../middleware/auth');
const requireRole = require('../../middleware/role');

// Admin & Manager accesses
router.get('/', verifyToken, requireRole('admin', 'manager'), CreditLedgerController.getCredits);
router.get('/balance/:customerId', verifyToken, requireRole('admin', 'manager'), CreditLedgerController.getCustomerBalance);
router.get('/balance/agency/:agencyId', verifyToken, requireRole('admin', 'manager'), CreditLedgerController.getAgencyBalance);

// Admin only credit adjustment
router.post('/adjust', verifyToken, requireRole('admin'), CreditLedgerController.adjustCredit);

module.exports = router;
