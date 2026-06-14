const AgencyService = require('./agency.service');
const { sendSuccess, sendError } = require('../../utils/response');

const AgencyController = {
  getAgencies: async (req, res, next) => {
    try {
      const result = await AgencyService.getAgencies(req.query);
      return res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  },

  getAgencyById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const agency = await AgencyService.getAgencyById(id);
      return sendSuccess(res, agency, 200);
    } catch (err) {
      const statusCode = err.statusCode || 500;
      return sendError(res, err.message, statusCode);
    }
  },

  getAgencyStaff: async (req, res, next) => {
    try {
      const { id } = req.params;
      const staff = await AgencyService.getAgencyStaff(id);
      return sendSuccess(res, staff, 200);
    } catch (err) {
      const statusCode = err.statusCode || 500;
      return sendError(res, err.message, statusCode);
    }
  },

  createAgency: async (req, res, next) => {
    try {
      const agency = await AgencyService.createAgency(req.body);
      return sendSuccess(res, agency, 201);
    } catch (err) {
      if (err.statusCode === 400 && err.errors) {
        return res.status(400).json({
          success: false,
          message: err.message,
          errors: err.errors
        });
      }
      return sendError(res, err.message, err.statusCode || 500);
    }
  },

  updateAgency: async (req, res, next) => {
    try {
      const { id } = req.params;
      const agency = await AgencyService.updateAgency(id, req.body);
      return sendSuccess(res, agency, 200);
    } catch (err) {
      if (err.statusCode === 400 && err.errors) {
        return res.status(400).json({
          success: false,
          message: err.message,
          errors: err.errors
        });
      }
      return sendError(res, err.message, err.statusCode || 500);
    }
  },

  toggleAgencyStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      if (isActive === undefined) {
        return sendError(res, 'Missing required field: isActive', 400);
      }
      const agency = await AgencyService.toggleAgencyStatus(id, isActive);
      return sendSuccess(res, agency, 200);
    } catch (err) {
      return sendError(res, err.message, err.statusCode || 500);
    }
  },

  deleteAgency: async (req, res, next) => {
    try {
      const { id } = req.params;
      // Soft delete: Toggle IsActive to false
      const agency = await AgencyService.toggleAgencyStatus(id, false);
      return sendSuccess(res, { message: 'Agency soft-deleted successfully.', agency }, 200);
    } catch (err) {
      return sendError(res, err.message, err.statusCode || 500);
    }
  }
};

module.exports = AgencyController;
