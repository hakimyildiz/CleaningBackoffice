const AgencyPortalService = require('./agencyPortal.service');
const PDFService = require('../pdf/pdf.service');
const { success, badRequest, notFound, error } = require('../../utils/response');
const logger = require('../../utils/logger');

const AgencyPortalController = {
  getOverview: async (req, res, next) => {
    try {
      const data = await AgencyPortalService.getOverview(req.agencyId, req.agencyStaffId, req.agencyRole);
      return success(res, 'Overview data retrieved successfully.', data);
    } catch (err) {
      next(err);
    }
  },

  getProperties: async (req, res, next) => {
    try {
      const data = await AgencyPortalService.getProperties(req.agencyId, req.agencyStaffId, req.agencyRole);
      return success(res, 'Properties list retrieved successfully.', data);
    } catch (err) {
      next(err);
    }
  },

  getSchedule: async (req, res, next) => {
    try {
      const data = await AgencyPortalService.getSchedule(req.agencyId, req.agencyStaffId, req.agencyRole);
      return success(res, 'Schedule retrieved successfully.', data);
    } catch (err) {
      next(err);
    }
  },

  getInvoices: async (req, res, next) => {
    try {
      if (req.agencyRole === 'agency_staff') {
        return res.status(403).json({ success: false, message: 'Access denied. Staff role cannot view invoices.' });
      }

      const limit = req.query.limit || 10;
      const page = req.query.page || 1;
      const result = await AgencyPortalService.getInvoices(req.agencyId, limit, page);
      return success(res, 'Invoices retrieved successfully.', result.data, result.pagination);
    } catch (err) {
      next(err);
    }
  },

  getInvoiceDetail: async (req, res, next) => {
    try {
      if (req.agencyRole === 'agency_staff') {
        return res.status(403).json({ success: false, message: 'Access denied. Staff role cannot view invoices.' });
      }

      const { id } = req.params;
      const data = await AgencyPortalService.getInvoiceDetail(req.agencyId, id);
      return success(res, 'Invoice detail retrieved successfully.', data);
    } catch (err) {
      next(err);
    }
  },

  getInvoicePDF: async (req, res, next) => {
    try {
      if (req.agencyRole === 'agency_staff') {
        return res.status(403).json({ success: false, message: 'Access denied. Staff role cannot view invoices.' });
      }

      const { id } = req.params;
      // 1. Verify invoice belongs to the agency first
      const detail = await AgencyPortalService.getInvoiceDetail(req.agencyId, id);
      
      // 2. Generate PDF
      const pdfBuffer = await PDFService.generateInvoicePDF(id);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Invoice-${detail.invoice.InvoiceNumber}.pdf`);
      return res.send(pdfBuffer);
    } catch (err) {
      logger.error(`Failed to download invoice PDF from agency portal: ${err.message}`);
      next(err);
    }
  },

  getCreditBalance: async (req, res, next) => {
    try {
      if (req.agencyRole === 'agency_staff') {
        return res.status(403).json({ success: false, message: 'Access denied. Staff role cannot view credit balance.' });
      }

      const data = await AgencyPortalService.getCreditBalance(req.agencyId);
      return success(res, 'Credit balance retrieved successfully.', data);
    } catch (err) {
      next(err);
    }
  },

  submitRequest: async (req, res, next) => {
    try {
      const { type, serviceScheduleId, serviceRecordId, serviceId, requestedValue, note } = req.body;
      const result = await AgencyPortalService.submitRequest(
        req.agencyId,
        req.user.UserID,
        req.agencyStaffId,
        req.agencyRole,
        { type, serviceScheduleId, serviceRecordId, serviceId, requestedValue, note }
      );
      return success(res, 'Change request submitted successfully.', result);
    } catch (err) {
      if (err.statusCode === 400) {
        return badRequest(res, err.message);
      }
      if (err.statusCode === 403) {
        return res.status(403).json({ success: false, message: err.message });
      }
      next(err);
    }
  },

  getRequests: async (req, res, next) => {
    try {
      const data = await AgencyPortalService.getRequests(req.agencyId, req.agencyStaffId, req.agencyRole);
      return success(res, 'Change requests retrieved successfully.', data);
    } catch (err) {
      if (err.statusCode === 403) {
        return res.status(403).json({ success: false, message: err.message });
      }
      next(err);
    }
  },

  getStaffAssignments: async (req, res, next) => {
    try {
      const data = await AgencyPortalService.getStaffAssignments(req.agencyId, req.agencyRole);
      return success(res, 'Staff assignments retrieved successfully.', data);
    } catch (err) {
      if (err.statusCode === 403) {
        return res.status(403).json({ success: false, message: err.message });
      }
      next(err);
    }
  }
};

module.exports = AgencyPortalController;
