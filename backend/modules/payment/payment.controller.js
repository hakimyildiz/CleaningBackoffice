const PaymentService = require('./payment.service');
const response = require('../../utils/response');

const PaymentController = {
  getPayments: async (req, res, next) => {
    try {
      const filters = {
        limit: req.query.limit,
        page: req.query.page,
        method: req.query.method,
        from: req.query.from,
        to: req.query.to,
        search: req.query.search
      };
      const result = await PaymentService.getPayments(filters);
      return response.success(res, 'Payments list retrieved successfully.', result.data, result.pagination);
    } catch (error) {
      next(error);
    }
  },

  getInvoicePayments: async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await PaymentService.getInvoicePayments(id);
      return response.success(res, 'Invoice payments retrieved successfully.', result.data);
    } catch (error) {
      next(error);
    }
  },

  recordPayment: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { amount, method, reference, paidAt, note } = req.body;

      // 1. Validation
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0 || parsedAmount > 99999.99) {
        return response.badRequest(res, 'Amount is required, must be a positive decimal, and cannot exceed 99999.99.');
      }

      const validMethods = ['bank_transfer', 'cash', 'card', 'other'];
      if (!method || !validMethods.includes(method)) {
        return response.badRequest(res, `Method is required and must be one of: ${validMethods.join(', ')}.`);
      }

      if (!paidAt) {
        return response.badRequest(res, 'Payment date (paidAt) is required.');
      }

      const paymentDate = new Date(paidAt);
      if (isNaN(paymentDate.getTime())) {
        return response.badRequest(res, 'Payment date is invalid.');
      }

      if (paymentDate > new Date()) {
        return response.badRequest(res, 'Payment date cannot be in the future.');
      }

      if (reference && reference.length > 100) {
        return response.badRequest(res, 'Reference cannot exceed 100 characters.');
      }

      const result = await PaymentService.recordPayment(id, {
        amount: parsedAmount,
        method,
        reference,
        paidAt: paymentDate,
        note
      }, req.user);

      return response.success(res, 'Payment recorded successfully.', result);
    } catch (error) {
      next(error);
    }
  },

  deletePayment: async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await PaymentService.deletePayment(id);
      return response.success(res, result.message, null);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = PaymentController;
