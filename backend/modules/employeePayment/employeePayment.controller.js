const EmployeePaymentService = require('./employeePayment.service');
const response = require('../../utils/response');

const EmployeePaymentController = {
  getPayments: async (req, res, next) => {
    try {
      const filters = {
        limit: req.query.limit,
        page: req.query.page,
        employeeId: req.query.employeeId,
        from: req.query.from,
        to: req.query.to,
        type: req.query.type
      };
      const result = await EmployeePaymentService.getPayments(filters);
      return response.success(res, 'Employee payments list retrieved successfully.', result.data, result.pagination);
    } catch (error) {
      next(error);
    }
  },

  getEarningsReport: async (req, res, next) => {
    try {
      const { employeeId, from, to } = req.query;

      if (!from || !to) {
        return response.badRequest(res, 'Both from and to dates are required parameters for the earnings report.');
      }

      const result = await EmployeePaymentService.getEarningsReport({
        employeeId: employeeId || null,
        from,
        to
      });
      return response.success(res, 'Employee earnings report generated successfully.', result);
    } catch (error) {
      next(error);
    }
  },

  recordPayment: async (req, res, next) => {
    try {
      const { employeeId, amount, type, paidAt, periodFrom, periodTo, reference, note } = req.body;

      if (!employeeId) {
        return response.badRequest(res, 'employeeId is required.');
      }

      const payment = await EmployeePaymentService.recordPayment({
        employeeId,
        amount,
        type,
        paidAt,
        periodFrom,
        periodTo,
        reference,
        note
      }, req.user);

      return response.success(res, 'Employee payment recorded successfully.', payment);
    } catch (error) {
      next(error);
    }
  },

  deletePayment: async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await EmployeePaymentService.deletePayment(id);
      return response.success(res, result.message, null);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = EmployeePaymentController;
