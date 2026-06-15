const CustomerPortalService = require('./customerPortal.service');
const PDFService = require('../pdf/pdf.service');
const { success, badRequest, notFound, error } = require('../../utils/response');
const logger = require('../../utils/logger');

const CustomerPortalController = {
  getOverview: async (req, res, next) => {
    try {
      const data = await CustomerPortalService.getOverview(req.customerId);
      return success(res, 'Overview data retrieved successfully.', data);
    } catch (err) {
      next(err);
    }
  },

  getServices: async (req, res, next) => {
    try {
      const data = await CustomerPortalService.getServices(req.customerId);
      return success(res, 'Properties list retrieved successfully.', data);
    } catch (err) {
      next(err);
    }
  },

  getSchedule: async (req, res, next) => {
    try {
      const data = await CustomerPortalService.getSchedule(req.customerId);
      return success(res, 'Schedule retrieved successfully.', data);
    } catch (err) {
      next(err);
    }
  },

  getInvoices: async (req, res, next) => {
    try {
      const limit = req.query.limit || 10;
      const page = req.query.page || 1;
      const result = await CustomerPortalService.getInvoices(req.customerId, limit, page);
      return success(res, 'Invoices retrieved successfully.', result.data, result.pagination);
    } catch (err) {
      next(err);
    }
  },

  getInvoiceDetail: async (req, res, next) => {
    try {
      const { id } = req.params;
      const data = await CustomerPortalService.getInvoiceDetail(req.customerId, id);
      return success(res, 'Invoice detail retrieved successfully.', data);
    } catch (err) {
      next(err);
    }
  },

  getInvoicePDF: async (req, res, next) => {
    try {
      const { id } = req.params;
      // 1. Verify invoice belongs to the customer first
      const detail = await CustomerPortalService.getInvoiceDetail(req.customerId, id);
      
      // 2. Generate PDF
      const pdfBuffer = await PDFService.generateInvoicePDF(id);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Invoice-${detail.invoice.InvoiceNumber}.pdf`);
      return res.send(pdfBuffer);
    } catch (err) {
      logger.error(`Failed to download invoice PDF from customer portal: ${err.message}`);
      next(err);
    }
  },

  submitRequest: async (req, res, next) => {
    try {
      const { type, serviceScheduleId, serviceRecordId, serviceId, requestedValue, note } = req.body;
      const result = await CustomerPortalService.submitRequest(req.customerId, req.user.UserID, {
        type,
        serviceScheduleId,
        serviceRecordId,
        serviceId,
        requestedValue,
        note
      });
      return success(res, 'Change request submitted successfully.', result);
    } catch (err) {
      // Return detailed error message for bad request validation failures
      if (err.statusCode === 400) {
        return badRequest(res, err.message);
      }
      next(err);
    }
  },

  getRequests: async (req, res, next) => {
    try {
      const data = await CustomerPortalService.getRequests(req.user.UserID);
      return success(res, 'Change requests retrieved successfully.', data);
    } catch (err) {
      next(err);
    }
  },

  getPhotos: async (req, res, next) => {
    try {
      const { serviceRecordId } = req.params;
      const data = await CustomerPortalService.getPhotos(req.customerId, serviceRecordId);
      return success(res, 'After photos retrieved successfully.', data);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = CustomerPortalController;
