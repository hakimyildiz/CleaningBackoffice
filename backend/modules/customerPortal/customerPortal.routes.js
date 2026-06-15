const express = require('express');
const router = express.Router();
const CustomerPortalController = require('./customerPortal.controller');
const verifyToken = require('../../middleware/auth');
const requireRole = require('../../middleware/role');
const resolveCustomer = require('../../middleware/resolveCustomer');

// Protect all customer-portal routes
router.use(verifyToken);
router.use(requireRole('customer'));
router.use(resolveCustomer);

router.get('/overview', CustomerPortalController.getOverview);
router.get('/services', CustomerPortalController.getServices);
router.get('/schedule', CustomerPortalController.getSchedule);
router.get('/invoices', CustomerPortalController.getInvoices);
router.get('/invoices/:id', CustomerPortalController.getInvoiceDetail);
router.get('/invoices/:id/pdf', CustomerPortalController.getInvoicePDF);
router.post('/requests', CustomerPortalController.submitRequest);
router.get('/requests', CustomerPortalController.getRequests);
router.get('/photos/:serviceRecordId', CustomerPortalController.getPhotos);

module.exports = router;
