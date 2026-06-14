const db = require('../../config/db');
const ServicePauseModel = require('./servicePause.model');
const ServiceModel = require('../service/service.model');
const env = require('../../config/env');

const ServicePauseService = {
  getPauses: async () => {
    return await ServicePauseModel.findList();
  },

  createPause: async (serviceId, data, currentUser) => {
    const { PauseFrom, PauseTo, Reason } = data;
    
    if (!PauseFrom || !PauseTo) {
      const err = new Error('Pause start and end dates are required.');
      err.statusCode = 400;
      throw err;
    }

    const fromDate = new Date(PauseFrom);
    const toDate = new Date(PauseTo);
    if (toDate < fromDate) {
      const err = new Error('Pause end date must be after the start date.');
      err.statusCode = 400;
      throw err;
    }

    const service = await ServiceModel.findById(serviceId);
    if (!service) {
      const err = new Error(`Service with ID ${serviceId} not found.`);
      err.statusCode = 404;
      throw err;
    }

    const isCustomer = currentUser.role === 'customer';
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      if (isCustomer) {
        // Enforce 24 hour buffer check
        const bufferHours = env.PAUSE_BUFFER_HOURS || 24;
        const now = new Date();
        const minDate = new Date(now.getTime() + bufferHours * 60 * 60 * 1000);
        
        if (fromDate < minDate) {
          const err = new Error(`Pause requests must be submitted at least ${bufferHours} hours in advance.`);
          err.statusCode = 400;
          throw err;
        }

        // Customer Pause Request is pending approval
        const pauseId = await ServicePauseModel.create({
          ServiceID: serviceId,
          PauseFrom,
          PauseTo,
          Reason,
          RequestedBy: currentUser.userId,
          ApprovedBy: null,
          Status: 'pending'
        }, connection);

        // Update IsPauseRequested flag on Service
        await ServicePauseModel.updateServicePauseRequestFlag(serviceId, true, connection);
        
        await connection.commit();
        connection.release();

        return await ServicePauseModel.findById(pauseId);
      } else {
        // Admin or Manager Pause is instant approval
        const pauseId = await ServicePauseModel.create({
          ServiceID: serviceId,
          PauseFrom,
          PauseTo,
          Reason,
          RequestedBy: currentUser.userId,
          ApprovedBy: currentUser.userId,
          Status: 'approved'
        }, connection);

        // Cancel scheduled occurrences in range
        await ServicePauseModel.cancelScheduledOccurrencesInRange(serviceId, PauseFrom, PauseTo, connection);

        // Clear request flag
        await ServicePauseModel.updateServicePauseRequestFlag(serviceId, false, connection);

        await connection.commit();
        connection.release();

        return await ServicePauseModel.findById(pauseId);
      }
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  },

  approvePause: async (id, currentUser) => {
    const pause = await ServicePauseModel.findById(id);
    if (!pause) {
      const err = new Error(`Pause record with ID ${id} not found.`);
      err.statusCode = 404;
      throw err;
    }

    if (pause.Status !== 'pending') {
      const err = new Error(`Pause record is already ${pause.Status}.`);
      err.statusCode = 400;
      throw err;
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Update status to approved
      await ServicePauseModel.updateStatus(id, {
        Status: 'approved',
        ApprovedBy: currentUser.userId
      }, connection);

      // 2. Cancel future occurrences within the dates
      const formatDateStr = (d) => new Date(d).toISOString().split('T')[0];
      await ServicePauseModel.cancelScheduledOccurrencesInRange(
        pause.ServiceID,
        formatDateStr(pause.PauseFrom),
        formatDateStr(pause.PauseTo),
        connection
      );

      // 3. Reset IsPauseRequested on Service
      await ServicePauseModel.updateServicePauseRequestFlag(pause.ServiceID, false, connection);

      await connection.commit();
      connection.release();
      return await ServicePauseModel.findById(id);
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  },

  rejectPause: async (id, currentUser) => {
    const pause = await ServicePauseModel.findById(id);
    if (!pause) {
      const err = new Error(`Pause record with ID ${id} not found.`);
      err.statusCode = 404;
      throw err;
    }

    if (pause.Status !== 'pending') {
      const err = new Error(`Pause record is already ${pause.Status}.`);
      err.statusCode = 400;
      throw err;
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Update status to rejected
      await ServicePauseModel.updateStatus(id, {
        Status: 'rejected',
        ApprovedBy: currentUser.userId
      }, connection);

      // 2. Reset IsPauseRequested on Service (do NOT touch schedule rows)
      await ServicePauseModel.updateServicePauseRequestFlag(pause.ServiceID, false, connection);

      await connection.commit();
      connection.release();
      return await ServicePauseModel.findById(id);
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  }
};

module.exports = ServicePauseService;
