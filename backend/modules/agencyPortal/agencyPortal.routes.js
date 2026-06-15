const express = require('express');
const router = express.Router();
const AgencyPortalController = require('./agencyPortal.controller');
const verifyToken = require('../../middleware/auth');
const requireRole = require('../../middleware/role');
const resolveAgency = require('../../middleware/resolveAgency');

// Protect all agency-portal routes
router.use(verifyToken);
router.use(requireRole('agency_manager', 'agency_bookkeeper', 'agency_staff'));
router.use(resolveAgency);

router.get('/overview', AgencyPortalController.getOverview);
router.get('/properties', AgencyPortalController.getProperties);
router.get('/schedule', AgencyPortalController.getSchedule);
router.get('/invoices', AgencyPortalController.getInvoices);
router.get('/invoices/:id', AgencyPortalController.getInvoiceDetail);
router.get('/invoices/:id/pdf', AgencyPortalController.getInvoicePDF);
router.get('/credit', AgencyPortalController.getCreditBalance);
router.post('/requests', AgencyPortalController.submitRequest);
router.get('/requests', AgencyPortalController.getRequests);
router.get('/staff-assignments', AgencyPortalController.getStaffAssignments);

module.exports = router;
