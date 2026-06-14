const ServiceOptionModel = { ...require('./serviceOption.model') };

const validateOption = (data) => {
  const errors = {};

  if (!data.Name || !data.Name.trim()) {
    errors.Name = 'Name is required.';
  } else if (data.Name.length > 100) {
    errors.Name = 'Name cannot exceed 100 characters.';
  }

  const isChargeable = data.IsChargeable === 'true' || data.IsChargeable === true || data.IsChargeable === 1;

  if (isChargeable) {
    const feeNum = parseFloat(data.Fee);
    if (isNaN(feeNum) || feeNum < 0) {
      errors.Fee = 'Fee must be a valid positive decimal number.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const ServiceOptionService = {
  getActiveOptions: async () => {
    return await ServiceOptionModel.findActive();
  },

  getAllOptions: async (filters) => {
    const limit = parseInt(filters.limit || 20, 10);
    const page = parseInt(filters.page || 1, 10);
    const offset = (page - 1) * limit;

    const { rows, total } = await ServiceOptionModel.findList({
      limit,
      offset,
      search: filters.search,
      isActive: filters.isActive,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder
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

  createOption: async (data) => {
    const { isValid, errors } = validateOption(data);
    if (!isValid) {
      const err = new Error('Validation failed');
      err.statusCode = 400;
      err.errors = errors;
      throw err;
    }

    const cleanData = {
      Name: data.Name.trim(),
      IsChargeable: data.IsChargeable,
      Fee: data.IsChargeable ? parseFloat(data.Fee) : 0.00
    };

    const id = await ServiceOptionModel.create(cleanData);
    return await ServiceOptionModel.findById(id);
  },

  updateOption: async (id, data) => {
    const existing = await ServiceOptionModel.findById(id);
    if (!existing) {
      const err = new Error(`Service option with ID ${id} not found.`);
      err.statusCode = 404;
      throw err;
    }

    const { isValid, errors } = validateOption(data);
    if (!isValid) {
      const err = new Error('Validation failed');
      err.statusCode = 400;
      err.errors = errors;
      throw err;
    }

    const cleanData = {
      Name: data.Name.trim(),
      IsChargeable: data.IsChargeable,
      Fee: data.IsChargeable ? parseFloat(data.Fee) : 0.00
    };

    await ServiceOptionModel.update(id, cleanData);
    return await ServiceOptionModel.findById(id);
  },

  toggleStatus: async (id, isActive) => {
    const existing = await ServiceOptionModel.findById(id);
    if (!existing) {
      const err = new Error(`Service option with ID ${id} not found.`);
      err.statusCode = 404;
      throw err;
    }

    await ServiceOptionModel.updateStatus(id, isActive);
    return await ServiceOptionModel.findById(id);
  }
};

module.exports = ServiceOptionService;
