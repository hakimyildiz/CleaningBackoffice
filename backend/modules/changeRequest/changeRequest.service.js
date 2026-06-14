const db = require('../../config/db');
const ChangeRequestModel = require('./changeRequest.model');
const logger = require('../../utils/logger');

const ChangeRequestService = {
  getRequests: async (filters) => {
    const limit = parseInt(filters.limit || 20, 10);
    const page = parseInt(filters.page || 1, 10);
    const offset = (page - 1) * limit;

    const { rows, total } = await ChangeRequestModel.findList({
      limit,
      offset,
      type: filters.type || null,
      status: filters.status || null,
      search: filters.search || null
    });

    const pendingCount = await ChangeRequestModel.countPending();

    return {
      data: rows,
      pendingCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  submitRequest: async ({ serviceRecordId, serviceId, serviceScheduleId, type, requestedValue }, user) => {
    const validTypes = ['reschedule', 'cancel', 'extra_service', 'cleaner_change', 'hours_change', 'pause', 'other'];
    if (!type || !validTypes.includes(type)) {
      const err = new Error(`Type must be one of: ${validTypes.join(', ')}.`);
      err.statusCode = 400;
      throw err;
    }

    if (!serviceRecordId && !serviceId && !serviceScheduleId) {
      const err = new Error('At least one of serviceRecordId, serviceId, or serviceScheduleId must be provided.');
      err.statusCode = 400;
      throw err;
    }

    // Validate requestedValue is valid JSON
    let valString = '';
    if (typeof requestedValue === 'object') {
      valString = JSON.stringify(requestedValue);
    } else {
      try {
        JSON.parse(requestedValue);
        valString = requestedValue;
      } catch (e) {
        const err = new Error('RequestedValue must be a valid JSON string or object.');
        err.statusCode = 400;
        throw err;
      }
    }

    const insertId = await ChangeRequestModel.create({
      ServiceRecordID: serviceRecordId || null,
      ServiceID: serviceId || null,
      ServiceScheduleID: serviceScheduleId || null,
      RequestedBy: user.UserID,
      Type: type,
      RequestedValue: valString
    });

    return await ChangeRequestModel.findById(insertId);
  },

  approveRequest: async (id, note, user) => {
    const request = await ChangeRequestModel.findById(id);
    if (!request) {
      const err = new Error(`ChangeRequest with ID ${id} not found.`);
      err.statusCode = 404;
      throw err;
    }

    if (request.Status !== 'pending') {
      const err = new Error(`Cannot approve a change request with status "${request.Status}".`);
      err.statusCode = 400;
      throw err;
    }

    let value = {};
    if (request.RequestedValue) {
      try {
        value = JSON.parse(request.RequestedValue);
      } catch (e) {
        logger.error(`Failed to parse ChangeRequest RequestedValue JSON: ${e.message}`);
      }
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Switch on ChangeRequest Type
      switch (request.Type) {
        case 'pause': {
          // Pause logic:
          // Try to find linked ServicePause
          const serviceId = request.ServiceID || request.ServiceRecordID; // fallback
          
          // Find the pending pause
          const [pauseRows] = await connection.query(
            "SELECT * FROM ServicePause WHERE ServiceID = ? AND Status = 'pending' ORDER BY CreatedAt DESC LIMIT 1",
            [serviceId]
          );

          if (pauseRows && pauseRows.length > 0) {
            const pause = pauseRows[0];
            
            // 1. UPDATE ServicePause status
            await connection.query(
              "UPDATE ServicePause SET Status = 'approved', ApprovedBy = ? WHERE ServicePauseID = ?",
              [user.UserID, pause.ServicePauseID]
            );

            // 2. Cancel all ServiceRecord occurrences in the PauseFrom -> PauseTo range
            await connection.query(
              "UPDATE ServiceRecord SET Status = 'cancelled', Note = CONCAT(COALESCE(Note,''), ' \\n(Cancelled due to approved service pause)') WHERE ServiceID = ? AND ScheduledDate BETWEEN ? AND ? AND Status = 'scheduled'",
              [serviceId, pause.PauseFrom, pause.PauseTo]
            );
          }

          // 3. Clear IsPauseRequested on Service
          await connection.query(
            "UPDATE Service SET IsPauseRequested = 0 WHERE ServiceID = ?",
            [serviceId]
          );
          break;
        }

        case 'reschedule': {
          const scheduleId = value.scheduleId || request.ServiceScheduleID;
          const recordId = value.recordId || request.ServiceRecordID;
          const newDate = value.newDate;
          const newTime = value.newTime;

          if (recordId) {
            await connection.query(
              'UPDATE ServiceRecord SET ScheduledDate = ?, ScheduledStart = ? WHERE ServiceRecordID = ?',
              [newDate, newTime, recordId]
            );
          } else if (scheduleId) {
            await connection.query(
              'UPDATE ServiceSchedule SET StartTime = ? WHERE ServiceScheduleID = ?',
              [newTime, scheduleId]
            );
          }
          break;
        }

        case 'cancel': {
          const recordId = value.recordId || request.ServiceRecordID;
          const scheduleId = value.scheduleId || request.ServiceScheduleID;

          if (recordId) {
            await connection.query(
              "UPDATE ServiceRecord SET Status = 'cancelled' WHERE ServiceRecordID = ?",
              [recordId]
            );
          } else if (scheduleId) {
            await connection.query(
              "UPDATE ServiceSchedule SET IsActive = 0 WHERE ServiceScheduleID = ?",
              [scheduleId]
            );
          }
          break;
        }

        case 'hours_change': {
          const recordId = value.recordId || request.ServiceRecordID;
          const scheduleId = value.scheduleId || request.ServiceScheduleID;
          const newEstimatedHours = parseFloat(value.newEstimatedHours);

          if (recordId) {
            await connection.query(
              'UPDATE ServiceRecord SET EstimatedHours = ? WHERE ServiceRecordID = ?',
              [newEstimatedHours, recordId]
            );
          } else if (scheduleId) {
            await connection.query(
              'UPDATE ServiceSchedule SET EstimatedHours = ? WHERE ServiceScheduleID = ?',
              [newEstimatedHours, scheduleId]
            );
          }
          break;
        }

        case 'cleaner_change': {
          const recordId = value.recordId || request.ServiceRecordID;
          const scheduleId = value.scheduleId || request.ServiceScheduleID;
          const removeEmployeeId = value.removeEmployeeId;
          const addEmployeeId = value.addEmployeeId;

          if (recordId) {
            if (removeEmployeeId) {
              await connection.query(
                'DELETE FROM ServiceRecordCleaner WHERE ServiceRecordID = ? AND EmployeeID = ?',
                [recordId, removeEmployeeId]
              );
            }
            if (addEmployeeId) {
              await connection.query(
                'INSERT INTO ServiceRecordCleaner (ServiceRecordID, EmployeeID, AssignedBy) VALUES (?, ?, ?)',
                [recordId, addEmployeeId, user.UserID]
              );
            }
          } else if (scheduleId) {
            if (removeEmployeeId) {
              await connection.query(
                'DELETE FROM ServiceScheduleEmployee WHERE ServiceScheduleID = ? AND EmployeeID = ?',
                [scheduleId, removeEmployeeId]
              );
            }
            if (addEmployeeId) {
              await connection.query(
                'INSERT INTO ServiceScheduleEmployee (ServiceScheduleID, EmployeeID, AssignedBy) VALUES (?, ?, ?)',
                [scheduleId, addEmployeeId, user.UserID]
              );
            }
          }
          break;
        }

        default:
          logger.info(`ChangeRequest type "${request.Type}" approved without db mutations.`);
          break;
      }

      // Update ChangeRequest status
      await ChangeRequestModel.updateStatus(id, {
        Status: 'approved',
        ReviewedBy: user.UserID,
        Note: note || 'Approved'
      }, connection);

      // Log in SystemLog
      const logQuery = `
        INSERT INTO SystemLog (UserID, Action, EntityType, EntityID, Note)
        VALUES (?, 'change_request_approved', 'ChangeRequest', ?, ?)
      `;
      await connection.query(logQuery, [user.UserID, id, `Approved request of type ${request.Type}`]);

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

    return await ChangeRequestModel.findById(id);
  },

  rejectRequest: async (id, note, user) => {
    const request = await ChangeRequestModel.findById(id);
    if (!request) {
      const err = new Error(`ChangeRequest with ID ${id} not found.`);
      err.statusCode = 404;
      throw err;
    }

    if (request.Status !== 'pending') {
      const err = new Error(`Cannot reject a change request with status "${request.Status}".`);
      err.statusCode = 400;
      throw err;
    }

    await ChangeRequestModel.updateStatus(id, {
      Status: 'rejected',
      ReviewedBy: user.UserID,
      Note: note || 'Rejected'
    });

    return await ChangeRequestModel.findById(id);
  }
};

module.exports = ChangeRequestService;
