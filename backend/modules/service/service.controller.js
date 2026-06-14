const ServiceService = require('./service.service');
const { sendSuccess, sendError } = require('../../utils/response');

const ServiceController = {
  getServices: async (req, res, next) => {
    try {
      const result = await ServiceService.getServices(req.query);
      return res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  },

  getServiceById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const service = await ServiceService.getServiceById(id);
      return sendSuccess(res, service, 200);
    } catch (err) {
      const statusCode = err.statusCode || 500;
      return sendError(res, err.message, statusCode);
    }
  },

  createService: async (req, res, next) => {
    try {
      const { service, occurrencesCount } = await ServiceService.createService(req.body);
      
      let message = 'Service created successfully.';
      if (service.Type === 'regular') {
        message = `Service created. ${occurrencesCount} schedule entries generated.`;
      }

      return res.status(201).json({
        success: true,
        data: service,
        message,
        occurrencesCount
      });
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

  updateService: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { service, occurrencesCount, ruleChanged } = await ServiceService.updateService(id, req.body);
      
      let message = 'Service updated successfully.';
      if (ruleChanged && service.Type === 'regular') {
        message = `Service updated. Future schedule regenerated with ${occurrencesCount} entries.`;
      }

      return res.status(200).json({
        success: true,
        data: service,
        message,
        occurrencesCount,
        ruleChanged
      });
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

  toggleServiceStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      if (isActive === undefined) {
        return sendError(res, 'Missing required field: isActive', 400);
      }
      const service = await ServiceService.toggleServiceStatus(id, isActive);
      return sendSuccess(res, service, 200);
    } catch (err) {
      return sendError(res, err.message, err.statusCode || 500);
    }
  },

  deleteService: async (req, res, next) => {
    try {
      const { id } = req.params;
      const service = await ServiceService.toggleServiceStatus(id, false);
      return sendSuccess(res, { message: 'Service soft-deleted successfully.', service }, 200);
    } catch (err) {
      return sendError(res, err.message, err.statusCode || 500);
    }
  },

  resolveLiveRate: async (req, res, next) => {
    try {
      const { customerId, agencyId } = req.query;
      const rateInfo = await ServiceService.resolveLiveRate(customerId, agencyId);
      return sendSuccess(res, rateInfo, 200);
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  },

  getServiceHistory: async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await ServiceService.getServiceHistory(id, req.query);
      return res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (err) {
      return sendError(res, err.message, err.statusCode || 500);
    }
  }
};

module.exports = ServiceController;
