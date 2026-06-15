const CustomerPortalModel = require('./customerPortal.model');
const env = require('../../config/env');

const resolveBuffer = (customBufferHours) => {
  return customBufferHours !== null && customBufferHours !== undefined
    ? customBufferHours
    : env.DEFAULT_REQUEST_BUFFER_HOURS;
};

const checkBufferLock = (scheduledDate, scheduledStart, bufferHours) => {
  if (!scheduledDate) return { locked: false };

  // Format ScheduledDate as YYYY-MM-DD
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

const CustomerPortalService = {
  getOverview: async (customerId) => {
    // 1. Get active job
    const activeJob = await CustomerPortalModel.findActiveJob(customerId);

    // 2. If no active job, check if there is a scheduled job today
    let todayScheduledJob = null;
    if (!activeJob) {
      const todayJob = await CustomerPortalModel.findTodayScheduledJob(customerId);
      if (todayJob) {
        todayScheduledJob = {
          serviceRecordId: todayJob.ServiceRecordID,
          address: `${todayJob.AddressLine}, ${todayJob.City}`,
          expectedArrival: todayJob.ScheduledStart
        };
      }
    }

    // 3. Get next 5 upcoming jobs
    const upcomingJobsRaw = await CustomerPortalModel.findUpcomingJobs(customerId);
    const upcomingJobs = upcomingJobsRaw.map(job => {
      const bufferHours = resolveBuffer(job.CustomBufferHours);
      const lockStatus = checkBufferLock(job.ScheduledDate, job.ScheduledStart, bufferHours);
      return {
        serviceRecordId: job.ServiceRecordID,
        serviceId: job.ServiceID,
        scheduledDate: job.ScheduledDate,
        scheduledStart: job.ScheduledStart,
        estimatedHours: job.EstimatedHours,
        address: `${job.AddressLine}, ${job.City}`,
        propertyType: job.PropertyType,
        isLocked: lockStatus.locked,
        lockMessage: lockStatus.message || null
      };
    });

    // 4. Get last completed job with photos
    const lastCompletedJob = await CustomerPortalModel.findLastCompletedJobWithPhotos(customerId);

    // 5. Get outstanding unpaid invoices alert details
    const { rows: invoices } = await CustomerPortalModel.findInvoices(customerId, 100, 0);
    const unpaidInvoices = invoices.filter(inv => ['sent', 'partially_paid', 'overdue'].includes(inv.Status));
    const unpaidCount = unpaidInvoices.length;
    const unpaidTotal = unpaidInvoices.reduce((sum, inv) => sum + parseFloat(inv.RemainingAmount || 0), 0);

    return {
      activeJob,
      todayScheduledJob,
      upcomingJobs,
      lastCompletedJob,
      unpaidInvoices: {
        count: unpaidCount,
        total: unpaidTotal
      },
      lastRefreshedAt: new Date().toISOString()
    };
  },

  getServices: async (customerId) => {
    return await CustomerPortalModel.findServices(customerId);
  },

  getSchedule: async (customerId) => {
    const jobs = await CustomerPortalModel.findSchedule(customerId, 30);
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

  getInvoices: async (customerId, limit = 10, page = 1) => {
    const offset = (page - 1) * limit;
    const { rows, total } = await CustomerPortalModel.findInvoices(customerId, limit, offset);
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

  getInvoiceDetail: async (customerId, invoiceId) => {
    const invoice = await CustomerPortalModel.findInvoiceById(customerId, invoiceId);
    if (!invoice) {
      const err = new Error('Invoice not found or access denied.');
      err.statusCode = 404;
      throw err;
    }

    const payments = await CustomerPortalModel.findPaymentsForInvoice(invoiceId);

    // Fetch service options for the line item list
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

  submitRequest: async (customerId, userId, { type, serviceScheduleId, serviceRecordId, serviceId, requestedValue, note }) => {
    const allowedTypes = ['reschedule', 'cancel', 'pause', 'extra_service', 'hours_change', 'other'];
    if (!type || !allowedTypes.includes(type)) {
      const err = new Error('Invalid request type.');
      err.statusCode = 400;
      throw err;
    }

    let resolvedServiceId = serviceId;

    // 1. If reschedule or cancel, verify the ServiceRecord belongs to this customer and check buffer lock
    if (serviceRecordId) {
      const record = await CustomerPortalModel.findServiceRecordById(customerId, serviceRecordId);
      if (!record) {
        const err = new Error('Service record not found or access denied.');
        err.statusCode = 404;
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
      const service = await CustomerPortalModel.findServiceById(customerId, resolvedServiceId);
      if (!service) {
        const err = new Error('Service not found or access denied.');
        err.statusCode = 404;
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
    const changeRequestId = await CustomerPortalModel.insertChangeRequest({
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

  getRequests: async (userId) => {
    return await CustomerPortalModel.findRequests(userId);
  },

  getPhotos: async (customerId, serviceRecordId) => {
    return await CustomerPortalModel.findPhotosByServiceRecord(customerId, serviceRecordId);
  }
};

module.exports = CustomerPortalService;
