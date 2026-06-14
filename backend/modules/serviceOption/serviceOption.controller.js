const ServiceOptionService = require('./serviceOption.service');
const { sendSuccess, sendError } = require('../../utils/response');

const ServiceOptionController = {
  getActiveOptions: async (req, res, next) => {
    try {
      const options = await ServiceOptionService.getActiveOptions();
      return sendSuccess(res, options, 200);
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  },

  getAllOptions: async (req, res, next) => {
    try {
      const result = await ServiceOptionService.getAllOptions(req.query);
      return res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  },

  createOption: async (req, res, next) => {
    try {
      const option = await ServiceOptionService.createOption(req.body);
      return sendSuccess(res, option, 201);
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

  updateOption: async (req, res, next) => {
    try {
      const { id } = req.params;
      const option = await ServiceOptionService.updateOption(id, req.body);
      return sendSuccess(res, option, 200);
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

  toggleStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      if (isActive === undefined) {
        return sendError(res, 'Missing required field: isActive', 400);
      }
      const option = await ServiceOptionService.toggleStatus(id, isActive);
      return sendSuccess(res, option, 200);
    } catch (err) {
      return sendError(res, err.message, err.statusCode || 500);
    }
  }
};

module.exports = ServiceOptionController;
