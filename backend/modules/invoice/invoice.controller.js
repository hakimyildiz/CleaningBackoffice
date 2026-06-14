const InvoiceService = require('./invoice.service');
const { sendSuccess, sendError } = require('../../utils/response');

const InvoiceController = {
  getInvoices: async (req, res, next) => {
    try {
      const result = await InvoiceService.getInvoices(req.query);
      return sendSuccess(res, result.data, 200, null, result.pagination);
    } catch (err) {
      return sendError(res, err.message, err.statusCode || 500);
    }
  },

  getInvoiceById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const invoice = await InvoiceService.getInvoiceById(id);
      return sendSuccess(res, invoice, 200);
    } catch (err) {
      return sendError(res, err.message, err.statusCode || 500);
    }
  },

  updateInvoice: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { hoursOverride, rateOverride, note } = req.body;
      const invoice = await InvoiceService.updateInvoice(id, { hoursOverride, rateOverride, note });
      return sendSuccess(res, invoice, 200);
    } catch (err) {
      return sendError(res, err.message, err.statusCode || 500);
    }
  },

  approveInvoice: async (req, res, next) => {
    try {
      const { id } = req.params;
      const invoice = await InvoiceService.approveInvoice(id, req.user);
      return sendSuccess(res, invoice, 200);
    } catch (err) {
      return sendError(res, err.message, err.statusCode || 500);
    }
  },

  cancelInvoice: async (req, res, next) => {
    try {
      const { id } = req.params;
      const invoice = await InvoiceService.cancelInvoice(id);
      return sendSuccess(res, invoice, 200);
    } catch (err) {
      return sendError(res, err.message, err.statusCode || 500);
    }
  },

  sendInvoiceEmail: async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await InvoiceService.sendInvoiceEmail(id);
      return sendSuccess(res, result, 200);
    } catch (err) {
      return sendError(res, err.message, err.statusCode || 500);
    }
  },

  sendOverdueReminders: async (req, res, next) => {
    try {
      const { invoiceIds } = req.body;
      if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
        return sendError(res, 'An array of invoiceIds is required in the body.', 400);
      }
      const result = await InvoiceService.sendOverdueReminders(invoiceIds);
      return sendSuccess(res, result, 200);
    } catch (err) {
      return sendError(res, err.message, err.statusCode || 500);
    }
  }
};

module.exports = InvoiceController;
