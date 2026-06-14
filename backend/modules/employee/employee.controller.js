const EmployeeService = require('./employee.service');
const { sendSuccess, sendError } = require('../../utils/response');

const EmployeeController = {
  getEmployees: async (req, res, next) => {
    try {
      const { page, limit, search, isActive, role, sortBy, sortOrder } = req.query;
      const result = await EmployeeService.getEmployees({
        page,
        limit,
        search,
        isActive,
        role,
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

  getEmployeeById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const employee = await EmployeeService.getEmployeeById(id);
      return sendSuccess(res, employee, 200);
    } catch (err) {
      return sendError(res, err.message, 404);
    }
  },

  createEmployee: async (req, res, next) => {
    try {
      const { employee, warning } = await EmployeeService.createEmployee(req.body);
      return res.status(212 || 201).json({
        success: true,
        data: employee,
        warning: warning || undefined
      });
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  },

  updateEmployee: async (req, res, next) => {
    try {
      const { id } = req.params;
      const employee = await EmployeeService.updateEmployee(id, req.body);
      return sendSuccess(res, employee, 200);
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  },

  toggleEmployeeStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      if (isActive === undefined) {
        return sendError(res, 'Missing required field: isActive', 400);
      }
      const employee = await EmployeeService.toggleEmployeeStatus(id, isActive);
      return sendSuccess(res, employee, 200);
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  },

  deleteEmployee: async (req, res, next) => {
    try {
      const { id } = req.params;
      // Soft delete: set IsActive to false
      const employee = await EmployeeService.toggleEmployeeStatus(id, false);
      return sendSuccess(res, { message: 'Employee soft-deleted successfully.', employee }, 200);
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  }
};

module.exports = EmployeeController;
