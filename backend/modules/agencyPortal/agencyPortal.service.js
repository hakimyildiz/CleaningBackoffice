const AgencyPortalModel = require('./agencyPortal.model');
const env = require('../../config/env');

const resolveBuffer = (customBufferHours) => {
  return customBufferHours !== null && customBufferHours !== undefined
    ? customBufferHours
    : env.DEFAULT_REQUEST_BUFFER_HOURS;
};

const checkBufferLock = (scheduledDate, scheduledStart, bufferHours) => {
  if (!scheduledDate) return { locked: false };

  const dateStr = new Date(scheduledDate).toISOString().split('T')[0];
  const timeStr = scheduledStart || '09:00:00';

  const scheduledDateTime = new Date(`${dateStr}T${timeStr}`);
  if (isNaN(scheduledDateTime.getTime())) return { locked: false };

  const lockCutoff = new Date(scheduledDateTime.getTime() - bufferHours * 60 * 60 * 1000);
  if (new Date() > lockCutoff) {
    return {
      locked: true,
      message: `Changes cannot be made within ${bufferHours} hours of a scheduled cleaning. Please contact support directly.`
    };
  }
  return { locked: false };
};

const AgencyPortalService = {
  getOverview: async (agencyId, agencyStaffId, role) => {
    const propertyCount = await AgencyPortalModel.getPropertyCount(agencyId, agencyStaffId, role);
    const pendingRequestsCount = await AgencyPortalModel.getPendingRequestsCount(agencyId, agencyStaffId, role);
    const recentActivity = await AgencyPortalModel.findRecentActivity(agencyId, agencyStaffId, role);

    const data = {
      propertyCount,
      pendingRequestsCount,
      recentActivity
    };

    // Include billing widget metrics for manager and bookkeeper
    if (role === 'agency_manager' || role === 'agency_bookkeeper') {
      const creditBalance = await AgencyPortalModel.findCreditLedgerSum(agencyId);
      const openInvoiceDebt = await AgencyPortalModel.findOpenInvoiceDebt(agencyId);
      data.billing = {
        creditBalance,
        openInvoiceDebt,
        netPosition: creditBalance - openInvoiceDebt
      };
      
      // Also calculate total invoiced this month
      const db = require('../../config/db');
      const [sumRows] = await db.query(
        `SELECT COALESCE(SUM(Total), 0) AS monthTotal 
         FROM Invoice 
         WHERE AgencyID = ? 
           AND CreatedAt >= DATE_FORMAT(NOW() ,'%Y-%m-01')`,
        [agencyId]
      );
      data.billing.totalInvoicedThisMonth = parseFloat(sumRows[0].monthTotal || 0);
    }

    return data;
  },

  getProperties: async (agencyId, agencyStaffId, role) => {
    const properties = await AgencyPortalModel.findProperties(agencyId, agencyStaffId, role);
    
    // Fetch last 3 records for each property
    const detailedProperties = [];
    for (const prop of properties) {
      const lastRecords = await AgencyPortalModel.findPropertyLastRecords(prop.ServiceID);
      detailedProperties.push({
        ...prop,
        lastRecords
      });
    }

    return detailedProperties;
  },

  getSchedule: async (agencyId, agencyStaffId, role) => {
    const jobs = await AgencyPortalModel.findSchedule(agencyId, agencyStaffId, role);
    return jobs.map(job => {
      const bufferHours = resolveBuffer(job.CustomBufferHours);
      const lockStatus = checkBufferLock(job.ScheduledDate, job.ScheduledStart, bufferHours);
      return {
        ...job,
        isLocked: lockStatus.locked,
        lockMessage: lockStatus.message || null
      };
    });
  },

  getInvoices: async (agencyId, limit = 10, page = 1) => {
    const offset = (page - 1) * limit;
    const { rows, total } = await AgencyPortalModel.findInvoices(agencyId, limit, offset);
    return {
      data: rows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / limit),
        total
      }
    };
  },

  getInvoiceDetail: async (agencyId, invoiceId) => {
    const invoice = await AgencyPortalModel.findInvoiceById(agencyId, invoiceId);
    if (!invoice) {
      const err = new Error('Invoice not found or access denied.');
      err.statusCode = 404;
      throw err;
    }

    const payments = await AgencyPortalModel.findPaymentsForInvoice(invoiceId);

    const db = require('../../config/db');
    const [options] = await db.query(
      'SELECT Name, Fee FROM ServiceRecordOption WHERE ServiceRecordID = ?',
      [invoice.ServiceRecordID]
    );

    return {
      invoice,
      payments,
      options
    };
  },

  getCreditBalance: async (agencyId) => {
    const creditBalance = await AgencyPortalModel.findCreditLedgerSum(agencyId);
    const openInvoiceDebt = await AgencyPortalModel.findOpenInvoiceDebt(agencyId);
    return {
      creditBalance,
      openInvoiceDebt,
      netPosition: creditBalance - openInvoiceDebt
    };
  },

  submitRequest: async (agencyId, userId, agencyStaffId, role, { type, serviceScheduleId, serviceRecordId, serviceId, requestedValue, note }) => {
    // Agency staff cannot submit request unless they are manager or staff
    if (role === 'agency_bookkeeper') {
      const err = new Error('Bookkeepers are not authorized to submit schedule change requests.');
      err.statusCode = 403;
      throw err;
    }

    const allowedTypes = ['reschedule', 'cancel', 'pause', 'extra_service', 'hours_change', 'other'];
    if (!type || !allowedTypes.includes(type)) {
      const err = new Error('Invalid request type.');
      err.statusCode = 400;
      throw err;
    }

    let resolvedServiceId = serviceId;

    // 1. Verify ServiceRecord is owned by agency
    if (serviceRecordId) {
      const record = await AgencyPortalModel.findServiceRecordById(agencyId, serviceRecordId);
      if (!record) {
        const err = new Error('Service record not found or access denied.');
        err.statusCode = 404;
        throw err;
      }

      // If agency_staff, verify they are assigned to this service
      if (role === 'agency_staff' && record.AgencyStaffID !== agencyStaffId) {
        const err = new Error('Access denied. You are not assigned to this service.');
        err.statusCode = 403;
        throw err;
      }

      resolvedServiceId = record.ServiceID;

      const bufferHours = resolveBuffer(record.CustomBufferHours);
      const lockStatus = checkBufferLock(record.ScheduledDate, record.ScheduledStart, bufferHours);
      if (lockStatus.locked) {
        const err = new Error(lockStatus.message);
        err.statusCode = 400;
        throw err;
      }
    }

    // Verify service ownership
    if (resolvedServiceId) {
      const service = await AgencyPortalModel.findServiceById(agencyId, resolvedServiceId);
      if (!service) {
        const err = new Error('Service not found or access denied.');
        err.statusCode = 404;
        throw err;
      }
      
      if (role === 'agency_staff' && service.AgencyStaffID !== agencyStaffId) {
        const err = new Error('Access denied. You are not assigned to this service.');
        err.statusCode = 403;
        throw err;
      }
    } else {
      const err = new Error('ServiceID or ServiceRecordID is required.');
      err.statusCode = 400;
      throw err;
    }

    // 2. If type is pause, perform PAUSE_BUFFER_HOURS validation
    if (type === 'pause') {
      const pauseFromStr = requestedValue?.pauseFrom;
      if (!pauseFromStr) {
        const err = new Error('Pause start date is required.');
        err.statusCode = 400;
        throw err;
      }

      const pauseFromDate = new Date(pauseFromStr);
      if (isNaN(pauseFromDate.getTime())) {
        const err = new Error('Pause start date is invalid.');
        err.statusCode = 400;
        throw err;
      }

      const bufferHours = env.PAUSE_BUFFER_HOURS || 24;
      const cutoff = new Date(Date.now() + bufferHours * 60 * 60 * 1000);
      if (pauseFromDate < cutoff) {
        const err = new Error(`Pause start date must be at least ${bufferHours} hours from now.`);
        err.statusCode = 400;
        throw err;
      }
    }

    // 3. Save the request in the DB
    const changeRequestId = await AgencyPortalModel.insertChangeRequest({
      ServiceRecordID: serviceRecordId,
      ServiceID: resolvedServiceId,
      ServiceScheduleID: serviceScheduleId,
      RequestedBy: userId,
      Type: type,
      RequestedValue,
      Note: note
    });

    return {
      changeRequestId,
      status: 'pending'
    };
  },

  getRequests: async (agencyId, agencyStaffId, role) => {
    if (role === 'agency_bookkeeper') {
      const err = new Error('Bookkeepers are not authorized to view change requests.');
      err.statusCode = 403;
      throw err;
    }
    return await AgencyPortalModel.findRequests(agencyId, agencyStaffId, role);
  },

  getStaffAssignments: async (agencyId, role) => {
    if (role !== 'agency_manager') {
      const err = new Error('Unauthorized. Staff assignments are only visible to agency managers.');
      err.statusCode = 403;
      throw err;
    }

    const rawRows = await AgencyPortalModel.findStaffAssignments(agencyId);
    
    // Group properties under each staff member
    const staffMap = {};
    for (const row of rawRows) {
      if (!staffMap[row.AgencyStaffID]) {
        staffMap[row.AgencyStaffID] = {
          AgencyStaffID: row.AgencyStaffID,
          FirstName: row.FirstName,
          SureName: row.SureName,
          Role: row.Role,
          properties: []
        };
      }
      
      if (row.ServiceID) {
        staffMap[row.AgencyStaffID].properties.push({
          ServiceID: row.ServiceID,
          AddressLine: row.AddressLine,
          City: row.City,
          PropertyType: row.PropertyType
        });
      }
    }

    return Object.values(staffMap);
  }
};

module.exports = AgencyPortalService;
