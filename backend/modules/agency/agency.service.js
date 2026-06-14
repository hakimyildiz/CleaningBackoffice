const AgencyModel = require('./agency.model');

const validateAgency = (data) => {
  const errors = {};

  if (!data.Name || !data.Name.trim()) {
    errors.Name = 'Name is required.';
  } else if (data.Name.length > 100) {
    errors.Name = 'Name cannot exceed 100 characters.';
  }

  if (data.Email && data.Email.trim()) {
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(data.Email)) {
      errors.Email = 'Please provide a valid email format.';
    }
  }

  if (data.CompanyNo && data.CompanyNo.length > 50) {
    errors.CompanyNo = 'Company number cannot exceed 50 characters.';
  }

  if (data.Rate && (isNaN(data.Rate) || parseFloat(data.Rate) < 0)) {
    errors.Rate = 'Rate must be a positive decimal value.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const AgencyService = {
  getAgencies: async (filters) => {
    const limit = parseInt(filters.limit || 20, 10);
    const page = parseInt(filters.page || 1, 10);
    const offset = (page - 1) * limit;

    const { rows, total } = await AgencyModel.findList({
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

  getAgencyById: async (id) => {
    const agency = await AgencyModel.findById(id);
    if (!agency) {
      const err = new Error(`Agency with ID ${id} not found.`);
      err.statusCode = 404;
      throw err;
    }
    
    // Fetch staff list as well
    const staff = await AgencyModel.findStaff(id);
    agency.staff = staff;

    return agency;
  },

  getAgencyStaff: async (id) => {
    const agency = await AgencyModel.findById(id);
    if (!agency) {
      const err = new Error(`Agency with ID ${id} not found.`);
      err.statusCode = 404;
      throw err;
    }
    return await AgencyModel.findStaff(id);
  },

  createAgency: async (data) => {
    const { isValid, errors } = validateAgency(data);
    if (!isValid) {
      const err = new Error('Validation failed');
      err.statusCode = 400;
      err.errors = errors;
      throw err;
    }

    const id = await AgencyModel.create(data);
    return await AgencyService.getAgencyById(id);
  },

  updateAgency: async (id, data) => {
    const existing = await AgencyModel.findById(id);
    if (!existing) {
      const err = new Error(`Agency with ID ${id} not found.`);
      err.statusCode = 404;
      throw err;
    }

    const { isValid, errors } = validateAgency(data);

    // If PrimaryContactUserID is provided, verify they are staff members
    if (data.PrimaryContactUserID && !errors.PrimaryContactUserID) {
      const isStaff = await AgencyModel.verifyStaffMember(id, data.PrimaryContactUserID);
      if (!isStaff) {
        errors.PrimaryContactUserID = 'Selected user is not a staff member of this agency.';
      }
    }

    if (Object.keys(errors).length > 0) {
      const err = new Error('Validation failed');
      err.statusCode = 400;
      err.errors = errors;
      throw err;
    }

    await AgencyModel.update(id, data);
    return await AgencyService.getAgencyById(id);
  },

  toggleAgencyStatus: async (id, isActive) => {
    const existing = await AgencyModel.findById(id);
    if (!existing) {
      const err = new Error(`Agency with ID ${id} not found.`);
      err.statusCode = 404;
      throw err;
    }

    await AgencyModel.updateStatus(id, isActive);
    return await AgencyService.getAgencyById(id);
  }
};

module.exports = AgencyService;
