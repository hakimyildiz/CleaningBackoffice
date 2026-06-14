const ServicePauseService = require('./servicePause.service');
const { sendSuccess, sendError } = require('../../utils/response');

const ServicePauseController = {
  getPauses: async (req, res, next) => {
    try {
      const pauses = await ServicePauseService.getPauses();
      return sendSuccess(res, pauses, 200);
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  },

  createPause: async (req, res, next) => {
    try {
      const { serviceId } = req.params;
      const pause = await ServicePauseService.createPause(serviceId, req.body, req.user);
      return sendSuccess(res, pause, 201);
    } catch (err) {
      const statusCode = err.statusCode || 500;
      return sendError(res, err.message, statusCode);
    }
  },

  approvePause: async (req, res, next) => {
    try {
      const { id } = req.params;
      const approved = await ServicePauseService.approvePause(id, req.user);
      return sendSuccess(res, approved, 200);
    } catch (err) {
      const statusCode = err.statusCode || 500;
      return sendError(res, err.message, statusCode);
    }
  },

  rejectPause: async (req, res, next) => {
    try {
      const { id } = req.params;
      const rejected = await ServicePauseService.rejectPause(id, req.user);
      return sendSuccess(res, rejected, 200);
    } catch (err) {
      const statusCode = err.statusCode || 500;
      return sendError(res, err.message, statusCode);
    }
  }
};

module.exports = ServicePauseController;
