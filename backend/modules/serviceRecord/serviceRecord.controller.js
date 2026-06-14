const ServiceRecordService = require('./serviceRecord.service');
const { sendSuccess, sendError } = require('../../utils/response');

const ServiceRecordController = {
  getServiceRecords: async (req, res, next) => {
    try {
      const result = await ServiceRecordService.getServiceRecords(req.query);
      return sendSuccess(res, result.data, 200, null, result.pagination);
    } catch (err) {
      return sendError(res, err.message, err.statusCode || 500);
    }
  },

  getServiceRecordById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const record = await ServiceRecordService.getServiceRecordById(id);
      return sendSuccess(res, record, 200);
    } catch (err) {
      return sendError(res, err.message, err.statusCode || 500);
    }
  },

  checkIn: async (req, res, next) => {
    try {
      const { scheduleId, lat, lng } = req.body;
      if (!scheduleId) {
        return sendError(res, 'scheduleId is required for check-in.', 400);
      }
      
      const latitude = lat !== undefined && lat !== null ? parseFloat(lat) : null;
      const longitude = lng !== undefined && lng !== null ? parseFloat(lng) : null;
      
      const result = await ServiceRecordService.checkIn(scheduleId, latitude, longitude, req.user);
      return sendSuccess(res, result, 200);
    } catch (err) {
      return sendError(res, err.message, err.statusCode || 500);
    }
  },

  checkOut: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { lat, lng, note, estimatedHoursOverride, photoTypes } = req.body;
      
      const latitude = lat !== undefined && lat !== null ? parseFloat(lat) : null;
      const longitude = lng !== undefined && lng !== null ? parseFloat(lng) : null;

      const result = await ServiceRecordService.checkOut(id, {
        lat: latitude,
        lng: longitude,
        note,
        estimatedHoursOverride,
        photoTypes
      }, req.files, req.user);

      return sendSuccess(res, result, 200);
    } catch (err) {
      return sendError(res, err.message, err.statusCode || 500);
    }
  },

  cancelServiceRecord: async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await ServiceRecordService.cancelServiceRecord(id, req.user);
      return sendSuccess(res, result, 200);
    } catch (err) {
      return sendError(res, err.message, err.statusCode || 500);
    }
  },

  assignCleanersToSchedule: async (req, res, next) => {
    try {
      const { scheduleId } = req.params;
      const { employeeIds } = req.body; // Array of employee IDs
      await ServiceRecordService.assignCleanersToSchedule(scheduleId, employeeIds, req.user);
      return sendSuccess(res, { message: 'Cleaners assigned to schedule rule successfully.' }, 200);
    } catch (err) {
      return sendError(res, err.message, err.statusCode || 500);
    }
  },

  removeCleanerFromSchedule: async (req, res, next) => {
    try {
      const { scheduleId, employeeId } = req.params;
      await ServiceRecordService.removeCleanerFromSchedule(scheduleId, employeeId);
      return sendSuccess(res, { message: 'Cleaner removed from schedule rule.' }, 200);
    } catch (err) {
      return sendError(res, err.message, err.statusCode || 500);
    }
  },

  getScheduleCleaners: async (req, res, next) => {
    try {
      const { scheduleId } = req.params;
      const cleaners = await ServiceRecordService.getScheduleCleaners(scheduleId);
      return sendSuccess(res, cleaners, 200);
    } catch (err) {
      return sendError(res, err.message, err.statusCode || 500);
    }
  },

  addCleanerToRecord: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { employeeId } = req.body;
      await ServiceRecordService.addCleanerToRecord(id, employeeId, req.user);
      return sendSuccess(res, { message: 'Cleaner added to service record successfully.' }, 200);
    } catch (err) {
      return sendError(res, err.message, err.statusCode || 500);
    }
  },

  removeCleanerFromRecord: async (req, res, next) => {
    try {
      const { id, employeeId } = req.params;
      await ServiceRecordService.removeCleanerFromRecord(id, employeeId);
      return sendSuccess(res, { message: 'Cleaner removed from service record.' }, 200);
    } catch (err) {
      return sendError(res, err.message, err.statusCode || 500);
    }
  }
};

module.exports = ServiceRecordController;
