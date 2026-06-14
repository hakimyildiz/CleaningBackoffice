const ServiceScheduleService = require('./serviceSchedule.service');
const { sendSuccess, sendError } = require('../../utils/response');

const ServiceScheduleController = {
  getScheduleByServiceId: async (req, res, next) => {
    try {
      const { serviceId } = req.params;
      const schedule = await ServiceScheduleService.getScheduleByServiceId(serviceId);
      return sendSuccess(res, schedule, 200);
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  },

  getGlobalSchedule: async (req, res, next) => {
    try {
      const result = await ServiceScheduleService.getGlobalSchedule(req.query);
      return res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  },

  updateOccurrence: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updated = await ServiceScheduleService.updateOccurrence(id, req.body);
      return sendSuccess(res, updated, 200);
    } catch (err) {
      const statusCode = err.statusCode || 500;
      return sendError(res, err.message, statusCode);
    }
  },

  cancelOccurrence: async (req, res, next) => {
    try {
      const { id } = req.params;
      const cancelled = await ServiceScheduleService.cancelOccurrence(id);
      return sendSuccess(res, { message: 'Schedule entry cancelled successfully.', data: cancelled }, 200);
    } catch (err) {
      const statusCode = err.statusCode || 500;
      return sendError(res, err.message, statusCode);
    }
  },

  updateStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!status) {
        return sendError(res, 'Status is required.', 400);
      }
      const updated = await ServiceScheduleService.updateStatus(id, status);
      return sendSuccess(res, updated, 200);
    } catch (err) {
      const statusCode = err.statusCode || 500;
      return sendError(res, err.message, statusCode);
    }
  }
};

module.exports = ServiceScheduleController;
