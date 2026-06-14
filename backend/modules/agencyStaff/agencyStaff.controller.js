const AgencyStaffService = require('./agencyStaff.service');
const { sendSuccess, sendError } = require('../../utils/response');

const AgencyStaffController = {
  getAgencyStaff: async (req, res, next) => {
    try {
      const { page, limit, search, isActive, agencyId, role, sortBy, sortOrder } = req.query;
      const result = await AgencyStaffService.getAgencyStaff({
        page,
        limit,
        search,
        isActive,
        agencyId,
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

  getAgencyStaffById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const staff = await AgencyStaffService.getAgencyStaffById(id);
      return sendSuccess(res, staff, 200);
    } catch (err) {
      return sendError(res, err.message, 404);
    }
  },

  createAgencyStaff: async (req, res, next) => {
    try {
      const { staff, warning } = await AgencyStaffService.createAgencyStaff(req.body);
      return res.status(201).json({
        success: true,
        data: staff,
        warning: warning || undefined
      });
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  },

  updateAgencyStaff: async (req, res, next) => {
    try {
      const { id } = req.params;
      const staff = await AgencyStaffService.updateAgencyStaff(id, req.body);
      return sendSuccess(res, staff, 200);
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  },

  toggleAgencyStaffStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      if (isActive === undefined) {
        return sendError(res, 'Missing required field: isActive', 400);
      }
      const staff = await AgencyStaffService.toggleAgencyStaffStatus(id, isActive);
      return sendSuccess(res, staff, 200);
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  },

  deleteAgencyStaff: async (req, res, next) => {
    try {
      const { id } = req.params;
      // Soft delete: sets IsActive = false
      const staff = await AgencyStaffService.toggleAgencyStaffStatus(id, false);
      return sendSuccess(res, { message: 'Agency staff soft-deleted successfully.', staff }, 200);
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  }
};

module.exports = AgencyStaffController;
