const ServiceScheduleModel = require('./serviceSchedule.model');

const ServiceScheduleService = {
  getScheduleByServiceId: async (serviceId) => {
    return await ServiceScheduleModel.findListByServiceId(serviceId);
  },

  getGlobalSchedule: async (filters) => {
    const today = new Date();
    const formatSQLDate = (d) => d.toISOString().split('T')[0];

    const fromVal = filters.from || formatSQLDate(today);
    
    let toVal = filters.to;
    if (!toVal) {
      const defaultTo = new Date(today);
      defaultTo.setDate(defaultTo.getDate() + 30);
      toVal = formatSQLDate(defaultTo);
    }

    const limit = parseInt(filters.limit || 20, 10);
    const page = parseInt(filters.page || 1, 10);
    const offset = (page - 1) * limit;

    const { rows, total } = await ServiceScheduleModel.findGlobalList({
      limit,
      offset,
      from: fromVal,
      to: toVal,
      serviceId: filters.serviceId,
      status: filters.status,
      customerId: filters.customerId,
      agencyId: filters.agencyId
    });

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  updateOccurrence: async (id, data) => {
    const existing = await ServiceScheduleModel.findById(id);
    if (!existing) {
      const err = new Error(`Schedule entry with ID ${id} not found.`);
      err.statusCode = 404;
      throw err;
    }

    if (!data.ScheduledDate || !data.ScheduledStart) {
      const err = new Error('Scheduled date and time are required.');
      err.statusCode = 400;
      throw err;
    }

    await ServiceScheduleModel.update(id, data);
    return await ServiceScheduleModel.findById(id);
  },

  cancelOccurrence: async (id) => {
    const existing = await ServiceScheduleModel.findById(id);
    if (!existing) {
      const err = new Error(`Schedule entry with ID ${id} not found.`);
      err.statusCode = 404;
      throw err;
    }

    await ServiceScheduleModel.cancel(id);
    return await ServiceScheduleModel.findById(id);
  },

  updateStatus: async (id, status) => {
    const existing = await ServiceScheduleModel.findById(id);
    if (!existing) {
      const err = new Error(`Schedule entry with ID ${id} not found.`);
      err.statusCode = 404;
      throw err;
    }
    
    const allowedStatuses = ['scheduled', 'missed', 'cancelled', 'completed', 'skipped', 'in_progress'];
    if (!allowedStatuses.includes(status)) {
      const err = new Error(`Invalid status: ${status}`);
      err.statusCode = 400;
      throw err;
    }

    await ServiceScheduleModel.updateStatus(id, status);
    return await ServiceScheduleModel.findById(id);
  }
};

module.exports = ServiceScheduleService;
