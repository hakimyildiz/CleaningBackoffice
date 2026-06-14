const ChangeRequestService = require('./changeRequest.service');
const response = require('../../utils/response');

const ChangeRequestController = {
  getRequests: async (req, res, next) => {
    try {
      const filters = {
        limit: req.query.limit,
        page: req.query.page,
        type: req.query.type,
        status: req.query.status,
        search: req.query.search
      };
      const result = await ChangeRequestService.getRequests(filters);
      return response.success(res, 'Change requests retrieved successfully.', result.data, {
        ...result.pagination,
        pendingCount: result.pendingCount
      });
    } catch (error) {
      next(error);
    }
  },

  submitRequest: async (req, res, next) => {
    try {
      const { serviceRecordId, serviceId, serviceScheduleId, type, requestedValue } = req.body;

      if (!type) {
        return response.badRequest(res, 'Type is required.');
      }

      if (!requestedValue) {
        return response.badRequest(res, 'requestedValue is required.');
      }

      const request = await ChangeRequestService.submitRequest({
        serviceRecordId,
        serviceId,
        serviceScheduleId,
        type,
        requestedValue
      }, req.user);

      return response.success(res, 'Change request submitted successfully.', request);
    } catch (error) {
      next(error);
    }
  },

  approveRequest: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { note } = req.body;

      const result = await ChangeRequestService.approveRequest(id, note, req.user);
      return response.success(res, 'Change request approved successfully.', result);
    } catch (error) {
      next(error);
    }
  },

  rejectRequest: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { note } = req.body;

      const result = await ChangeRequestService.rejectRequest(id, note, req.user);
      return response.success(res, 'Change request rejected successfully.', result);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = ChangeRequestController;
