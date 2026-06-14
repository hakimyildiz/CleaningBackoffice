const CleanerService = require('./cleaner.service');
const { sendSuccess, sendError } = require('../../utils/response');

const CleanerController = {
  getCleanerJobs: async (req, res, next) => {
    try {
      const result = await CleanerService.getCleanerJobs(req.user);
      return sendSuccess(res, result, 200);
    } catch (err) {
      return sendError(res, err.message, err.statusCode || 500);
    }
  }
};

module.exports = CleanerController;
