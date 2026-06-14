const CustomerService = require('./customer.service');
const { sendSuccess, sendError } = require('../../utils/response');

const CustomerController = {
  getCustomers: async (req, res, next) => {
    try {
      const { page, limit, search, isActive, sortBy, sortOrder } = req.query;
      const result = await CustomerService.getCustomers({
        page,
        limit,
        search,
        isActive,
        sortBy,
        sortOrder
      });
      return res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  },

  getCustomerById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const customer = await CustomerService.getCustomerById(id);
      return sendSuccess(res, customer, 200);
    } catch (err) {
      return sendError(res, err.message, 404);
    }
  },

  createCustomer: async (req, res, next) => {
    try {
      const { customer, warning } = await CustomerService.createCustomer(req.body);
      return res.status(201).json({
        success: true,
        data: customer,
        warning: warning || undefined
      });
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  },

  updateCustomer: async (req, res, next) => {
    try {
      const { id } = req.params;
      const customer = await CustomerService.updateCustomer(id, req.body);
      return sendSuccess(res, customer, 200);
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  },

  toggleCustomerStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      if (isActive === undefined) {
        return sendError(res, 'Missing required field: isActive', 400);
      }
      const customer = await CustomerService.toggleCustomerStatus(id, isActive);
      return sendSuccess(res, customer, 200);
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  },

  deleteCustomer: async (req, res, next) => {
    try {
      const { id } = req.params;
      // Soft delete: sets IsActive = false
      const customer = await CustomerService.toggleCustomerStatus(id, false);
      return sendSuccess(res, { message: 'Customer soft-deleted successfully.', customer }, 200);
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  }
};

module.exports = CustomerController;
