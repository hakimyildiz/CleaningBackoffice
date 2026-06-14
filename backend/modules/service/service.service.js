const db = require('../../config/db');
const ServiceModel = require('./service.model');
const env = require('../../config/env');
const logger = require('../../utils/logger');

const validateService = (data) => {
  const errors = {};

  const customerId = data.CustomerID;
  const agencyId = data.AgencyID;

  if (customerId && agencyId) {
    errors.CustomerID = 'A service cannot belong to both a Customer and an Agency.';
    errors.AgencyID = 'A service cannot belong to both a Customer and an Agency.';
  } else if (!customerId && !agencyId) {
    errors.CustomerID = 'Owner selection is required (either Customer or Agency).';
  }

  if (!data.Type || !['one_off', 'regular'].includes(data.Type)) {
    errors.Type = 'Service type must be "one_off" or "regular".';
  }

  if (!data.PropertyType) {
    errors.PropertyType = 'Property type is required.';
  }

  if (!data.AddressLine || !data.AddressLine.trim()) {
    errors.AddressLine = 'Address line is required.';
  }

  if (!data.City || !data.City.trim()) {
    errors.City = 'City is required.';
  }

  if (!data.PostCode || !data.PostCode.trim()) {
    errors.PostCode = 'Post code is required.';
  }

  if (data.Type === 'one_off') {
    if (!data.ScheduledDate) {
      errors.ScheduledDate = 'Service date is required for one-off services.';
    }
  } else if (data.Type === 'regular') {
    if (!data.Frequency || !['weekly', 'fortnightly', 'monthly'].includes(data.Frequency)) {
      errors.Frequency = 'Frequency must be weekly, fortnightly, or monthly.';
    }

    if (data.Frequency === 'weekly' || data.Frequency === 'fortnightly') {
      if (!data.DayOfWeek || !['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].includes(data.DayOfWeek)) {
        errors.DayOfWeek = 'Day of week is required for weekly/fortnightly services.';
      }
    }

    if (data.Frequency === 'monthly') {
      const dom = parseInt(data.DayOfMonth, 10);
      if (isNaN(dom) || dom < 1 || dom > 31) {
        errors.DayOfMonth = 'Day of month is required and must be between 1 and 31.';
      }
    }

    if (!data.StartDate) {
      errors.StartDate = 'Schedule start date is required.';
    }
  }

  if (data.Rate && (isNaN(data.Rate) || parseFloat(data.Rate) < 0)) {
    errors.Rate = 'Custom rate must be a positive decimal value.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const formatDate = (date) => {
  return date.toISOString().substring(0, 10);
};

const checkInPauseRange = (dateStr, pauses) => {
  const checkTime = new Date(dateStr).getTime();
  for (const pause of pauses) {
    const fromTime = new Date(pause.PauseFrom).getTime();
    const toTime = new Date(pause.PauseTo).getTime();
    if (checkTime >= fromTime && checkTime <= toTime) {
      return true;
    }
  }
  return false;
};

// Auto-generation algorithm for ServiceRecords
const generateOccurrences = (serviceId, serviceData, ruleData, pauses) => {
  const occurrences = [];
  const lookaheadMonths = env.SCHEDULE_LOOKAHEAD_MONTHS || 6;
  
  const today = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + lookaheadMonths);

  const startOccurDate = new Date(ruleData.StartDate || today);
  let currentDate = startOccurDate > today ? startOccurDate : today;

  // Formatting helper to match YYYY-MM-DD
  const formatSQLDate = (d) => d.toISOString().split('T')[0];

  const rateVal = serviceData.Rate ? parseFloat(serviceData.Rate) : null;

  const baseOccur = {
    ServiceID: serviceId,
    CustomerID: serviceData.CustomerID,
    AgencyID: serviceData.AgencyID,
    AgencyStaffID: serviceData.AgencyStaffID,
    Rate: rateVal,
    AddressLine: serviceData.AddressLine,
    City: serviceData.City,
    PostCode: serviceData.PostCode,
    ScheduledStart: ruleData.StartTime || '09:00:00',
    EstimatedHours: ruleData.EstimatedHours || 2.0
  };

  if (ruleData.Frequency === 'weekly' || ruleData.Frequency === 'fortnightly') {
    const daysMap = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 };
    const targetDay = daysMap[ruleData.DayOfWeek];

    // Align currentDate with the targetDayOfWeek
    let tempDate = new Date(currentDate);
    while (tempDate.getDay() !== targetDay) {
      tempDate.setDate(tempDate.getDate() + 1);
    }
    currentDate = tempDate;

    const intervalDays = ruleData.Frequency === 'weekly' ? 7 : 14;

    while (currentDate <= endDate) {
      const dateStr = formatSQLDate(currentDate);
      if (!checkInPauseRange(dateStr, pauses)) {
        occurrences.push({
          ...baseOccur,
          ScheduledDate: dateStr
        });
      }
      currentDate.setDate(currentDate.getDate() + intervalDays);
    }
  } else if (ruleData.Frequency === 'monthly') {
    const targetDom = parseInt(ruleData.DayOfMonth, 10);
    let tempDate = new Date(currentDate);
    
    // Generate forward month-by-month
    while (tempDate <= endDate) {
      let year = tempDate.getFullYear();
      let month = tempDate.getMonth();

      // Find the last day of target month to handle overflow (e.g. Feb 30th)
      const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
      const actualDom = Math.min(targetDom, lastDayOfMonth);

      const targetDate = new Date(year, month, actualDom);
      
      // Ensure we only generate future or equal occurrences
      if (targetDate >= startOccurDate && targetDate >= today && targetDate <= endDate) {
        const dateStr = formatSQLDate(targetDate);
        if (!checkInPauseRange(dateStr, pauses)) {
          occurrences.push({
            ...baseOccur,
            ScheduledDate: dateStr
          });
        }
      }
      // Increment month
      tempDate.setMonth(tempDate.getMonth() + 1);
      tempDate.setDate(1); // Set to start of month to avoid month overflow bugs
    }
  }

  return occurrences;
};

const saveServiceRecordOptions = async (serviceRecordIds, serviceOptions, customOptions, connection) => {
  if (!serviceRecordIds || serviceRecordIds.length === 0) return;
  
  // 1. Fetch system options details for the selected serviceOptions ids
  let resolvedOptions = [];
  if (serviceOptions && serviceOptions.length > 0) {
    const [rows] = await connection.query(
      'SELECT ServiceOptionID, Name, Fee, IsChargeable FROM ServiceOption WHERE ServiceOptionID IN (?)',
      [serviceOptions]
    );
    resolvedOptions = rows;
  }

  // 2. Prepare all options to insert
  const insertValues = [];
  for (const recordId of serviceRecordIds) {
    // System options
    for (const opt of resolvedOptions) {
      insertValues.push([
        recordId,
        opt.ServiceOptionID,
        opt.Name,
        opt.Fee,
        opt.IsChargeable
      ]);
    }
    // Custom options
    if (customOptions && customOptions.length > 0) {
      for (const opt of customOptions) {
        insertValues.push([
          recordId,
          null,
          opt.Name,
          opt.Fee,
          opt.IsChargeable !== undefined ? opt.IsChargeable : 1
        ]);
      }
    }
  }

  // 3. Bulk insert
  if (insertValues.length > 0) {
    const query = `
      INSERT INTO ServiceRecordOption (ServiceRecordID, ServiceOptionID, Name, Fee, IsChargeable)
      VALUES ?
    `;
    await connection.query(query, [insertValues]);
  }
};

const ServiceService = {
  getServices: async (filters) => {
    const limit = parseInt(filters.limit || 20, 10);
    const page = parseInt(filters.page || 1, 10);
    const offset = (page - 1) * limit;

    const { rows, total } = await ServiceModel.findList({
      limit,
      offset,
      search: filters.search,
      type: filters.type,
      customerId: filters.customerId,
      agencyId: filters.agencyId,
      isActive: filters.isActive,
      status: filters.status,
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

  getServiceById: async (id) => {
    const service = await ServiceModel.findById(id);
    if (!service) {
      const err = new Error(`Service with ID ${id} not found.`);
      err.statusCode = 404;
      throw err;
    }

    const rule = await ServiceModel.findScheduleRule(id);
    service.scheduleRule = rule;

    // Fetch options from the earliest scheduled occurrence (or latest if no scheduled ones exist)
    const [occurRows] = await db.query(
      `SELECT ServiceRecordID FROM ServiceRecord 
       WHERE ServiceID = ? 
       ORDER BY CASE WHEN Status = 'scheduled' THEN 0 ELSE 1 END, ScheduledDate ASC LIMIT 1`,
      [id]
    );
    if (occurRows && occurRows.length > 0) {
      const recordId = occurRows[0].ServiceRecordID;
      const [optionRows] = await db.query(
        'SELECT ServiceOptionID, Name, Fee, IsChargeable FROM ServiceRecordOption WHERE ServiceRecordID = ?',
        [recordId]
      );
      service.ServiceOptions = optionRows.filter(o => o.ServiceOptionID !== null).map(o => o.ServiceOptionID);
      service.CustomOptions = optionRows.filter(o => o.ServiceOptionID === null);
    } else {
      service.ServiceOptions = [];
      service.CustomOptions = [];
    }

    return service;
  },

  createService: async (data) => {
    const { isValid, errors } = validateService(data);
    if (!isValid) {
      const err = new Error('Validation failed');
      err.statusCode = 400;
      err.errors = errors;
      throw err;
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    let serviceId;
    let createdOccurrencesCount = 0;

    try {
      // 1. Insert Service record
      serviceId = await ServiceModel.create(data, connection);

      // 2. Build Schedule rule and occurrences
      if (data.Type === 'one_off') {
        const ruleData = {
          ServiceID: serviceId,
          Frequency: 'weekly', // dummy frequency matching schema enum
          StartTime: data.StartTime || '09:00:00',
          EstimatedHours: parseFloat(data.EstimatedHours || 2.0)
        };
        await ServiceModel.createScheduleRule(ruleData, connection);

        const singleOccurrence = [{
          ServiceID: serviceId,
          CustomerID: data.CustomerID,
          AgencyID: data.AgencyID,
          AgencyStaffID: data.AgencyStaffID,
          Rate: data.Rate ? parseFloat(data.Rate) : null,
          AddressLine: data.AddressLine,
          City: data.City,
          PostCode: data.PostCode,
          ScheduledDate: data.ScheduledDate,
          ScheduledStart: data.StartTime || '09:00:00',
          EstimatedHours: parseFloat(data.EstimatedHours || 2.0)
        }];
        const insertRes = await ServiceModel.insertScheduleOccurrences(singleOccurrence, connection);
        if (insertRes && insertRes.insertId) {
          await saveServiceRecordOptions([insertRes.insertId], data.ServiceOptions, data.CustomOptions, connection);
        }
        createdOccurrencesCount = 1;
      } else {
        const ruleData = {
          ServiceID: serviceId,
          Frequency: data.Frequency,
          DayOfWeek: data.DayOfWeek,
          DayOfMonth: data.DayOfMonth,
          StartTime: data.StartTime || '09:00:00',
          EstimatedHours: parseFloat(data.EstimatedHours || 2.0),
          StartDate: data.StartDate
        };
        await ServiceModel.createScheduleRule(ruleData, connection);

        // Generate 6 months forward from StartDate, skipping pauses
        const occurrences = generateOccurrences(serviceId, data, ruleData, []);
        if (occurrences.length > 0) {
          const insertRes = await ServiceModel.insertScheduleOccurrences(occurrences, connection);
          if (insertRes && insertRes.insertId) {
            const firstInsertId = insertRes.insertId;
            const insertedIds = Array.from({ length: occurrences.length }, (_, i) => firstInsertId + i);
            await saveServiceRecordOptions(insertedIds, data.ServiceOptions, data.CustomOptions, connection);
          }
          createdOccurrencesCount = occurrences.length;
        }
      }

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

    const fullService = await ServiceService.getServiceById(serviceId);
    return { service: fullService, occurrencesCount: createdOccurrencesCount };
  },

  updateService: async (id, data) => {
    const existing = await ServiceService.getServiceById(id);
    if (!existing) {
      const err = new Error(`Service with ID ${id} not found.`);
      err.statusCode = 404;
      throw err;
    }

    const { isValid, errors } = validateService(data);
    if (!isValid) {
      const err = new Error('Validation failed');
      err.statusCode = 400;
      err.errors = errors;
      throw err;
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    let regeneratedOccurrencesCount = 0;
    let ruleChanged = false;

    try {
      // 1. Update Service basic fields
      await ServiceModel.update(id, data, connection);

      // 2. Check if schedule rule details changed
      if (data.Type === 'one_off') {
        const oldOccurs = await db.query('SELECT ServiceRecordID, ScheduledDate, ScheduledStart, EstimatedHours FROM ServiceRecord WHERE ServiceID = ? AND Status = "scheduled"', [id]);
        
        const dateChanged = data.ScheduledDate !== oldOccurs[0]?.ScheduledDate;
        const timeChanged = data.StartTime !== oldOccurs[0]?.ScheduledStart;
        const hoursChanged = parseFloat(data.EstimatedHours) !== parseFloat(oldOccurs[0]?.EstimatedHours);

        if (dateChanged || timeChanged || hoursChanged) {
          // Cancel old scheduled occurrence
          await ServiceModel.cancelFutureOccurrences(id, connection);
          
          // Insert new occurrence
          const singleOccurrence = [{
            ServiceID: id,
            CustomerID: data.CustomerID,
            AgencyID: data.AgencyID,
            AgencyStaffID: data.AgencyStaffID,
            Rate: data.Rate ? parseFloat(data.Rate) : null,
            AddressLine: data.AddressLine,
            City: data.City,
            PostCode: data.PostCode,
            ScheduledDate: data.ScheduledDate,
            ScheduledStart: data.StartTime || '09:00:00',
            EstimatedHours: parseFloat(data.EstimatedHours || 2.0)
          }];
          const insertRes = await ServiceModel.insertScheduleOccurrences(singleOccurrence, connection);
          if (insertRes && insertRes.insertId) {
            await saveServiceRecordOptions([insertRes.insertId], data.ServiceOptions, data.CustomOptions, connection);
          }
          regeneratedOccurrencesCount = 1;
        } else {
          // Update options for existing upcoming occurrences
          const [upcomingRows] = await connection.query(
            'SELECT ServiceRecordID FROM ServiceRecord WHERE ServiceID = ? AND Status = "scheduled"',
            [id]
          );
          if (upcomingRows && upcomingRows.length > 0) {
            const upcomingIds = upcomingRows.map(r => r.ServiceRecordID);
            await connection.query('DELETE FROM ServiceRecordOption WHERE ServiceRecordID IN (?)', [upcomingIds]);
            await saveServiceRecordOptions(upcomingIds, data.ServiceOptions, data.CustomOptions, connection);
          }
        }
      } else {
        const oldRule = existing.scheduleRule;
        const freqChanged = data.Frequency !== oldRule?.Frequency;
        const dowChanged = data.DayOfWeek !== oldRule?.DayOfWeek;
        const domChanged = parseInt(data.DayOfMonth) !== parseInt(oldRule?.DayOfMonth);
        const timeChanged = data.StartTime !== oldRule?.StartTime;
        const hoursChanged = parseFloat(data.EstimatedHours) !== parseFloat(oldRule?.EstimatedHours);
        
        if (freqChanged || dowChanged || domChanged || timeChanged || hoursChanged) {
          ruleChanged = true;
          // Update Schedule rule definition
          const ruleData = {
            Frequency: data.Frequency,
            DayOfWeek: data.DayOfWeek,
            DayOfMonth: data.DayOfMonth,
            StartTime: data.StartTime,
            EstimatedHours: parseFloat(data.EstimatedHours)
          };
          await ServiceModel.updateScheduleRule(id, ruleData, connection);

          // Cancel future occurrences
          await ServiceModel.cancelFutureOccurrences(id, connection);

          // Retrieve active approved pauses
          const pauses = await ServiceModel.findActivePauses(id);

          // Re-generate forward occurrences starting from tomorrow
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          const ruleGenData = {
            ...ruleData,
            StartDate: formatDate(tomorrow)
          };

          const occurrences = generateOccurrences(id, data, ruleGenData, pauses);
          if (occurrences.length > 0) {
            const insertRes = await ServiceModel.insertScheduleOccurrences(occurrences, connection);
            if (insertRes && insertRes.insertId) {
              const firstInsertId = insertRes.insertId;
              const insertedIds = Array.from({ length: occurrences.length }, (_, i) => firstInsertId + i);
              await saveServiceRecordOptions(insertedIds, data.ServiceOptions, data.CustomOptions, connection);
            }
            regeneratedOccurrencesCount = occurrences.length;
          }
        } else {
          // Update options for existing upcoming occurrences
          const [upcomingRows] = await connection.query(
            'SELECT ServiceRecordID FROM ServiceRecord WHERE ServiceID = ? AND Status = "scheduled"',
            [id]
          );
          if (upcomingRows && upcomingRows.length > 0) {
            const upcomingIds = upcomingRows.map(r => r.ServiceRecordID);
            await connection.query('DELETE FROM ServiceRecordOption WHERE ServiceRecordID IN (?)', [upcomingIds]);
            await saveServiceRecordOptions(upcomingIds, data.ServiceOptions, data.CustomOptions, connection);
          }
        }
      }

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

    const fullService = await ServiceService.getServiceById(id);
    return { service: fullService, occurrencesCount: regeneratedOccurrencesCount, ruleChanged };
  },

  toggleServiceStatus: async (id, isActive) => {
    const existing = await ServiceModel.findById(id);
    if (!existing) {
      const err = new Error(`Service with ID ${id} not found.`);
      err.statusCode = 404;
      throw err;
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      await ServiceModel.updateStatus(id, isActive, connection);
      if (!isActive) {
        // Soft deleting/deactivating: cancel future scheduled rows
        await ServiceModel.cancelFutureOccurrences(id, connection);
      }
      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

    return await ServiceService.getServiceById(id);
  },

  resolveLiveRate: async (customerId, agencyId) => {
    return await ServiceModel.resolveLiveRate(customerId, agencyId);
  },

  getServiceHistory: async (serviceId, queryParams) => {
    const limit = parseInt(queryParams.limit || 10, 10);
    const page = parseInt(queryParams.page || 1, 10);
    const offset = (page - 1) * limit;

    const [countRows] = await db.query(
      "SELECT COUNT(*) AS total FROM ServiceRecord WHERE ServiceID = ? AND Status != 'scheduled'",
      [serviceId]
    );
    const total = countRows[0].total;

    const [rows] = await db.query(
      `SELECT sr.*, i.InvoiceNumber, i.Status AS InvoiceStatus
       FROM ServiceRecord sr
       LEFT JOIN Invoice i ON sr.ServiceRecordID = i.ServiceRecordID
       WHERE sr.ServiceID = ? AND sr.Status != 'scheduled'
       ORDER BY sr.ScheduledDate DESC, sr.ScheduledStart DESC
       LIMIT ? OFFSET ?`,
      [parseInt(serviceId, 10), limit, offset]
    );

    // Load cleaners and photos for each record
    for (const record of rows) {
      // Cleaners
      const [cleaners] = await db.query(
        `SELECT src.*, p.FirstName, p.SureName
         FROM ServiceRecordCleaner src
         JOIN Employee e ON src.EmployeeID = e.EmployeeID
         JOIN Person p ON e.PersonID = p.PersonID
         WHERE src.ServiceRecordID = ?`,
        [record.ServiceRecordID]
      );
      record.cleaners = cleaners;

      // Photos
      const [photos] = await db.query(
        `SELECT sp.*, p.FirstName, p.SureName
         FROM ServicePhoto sp
         LEFT JOIN Employee e ON sp.EmployeeID = e.EmployeeID
         LEFT JOIN Person p ON e.PersonID = p.PersonID
         WHERE sp.ServiceRecordID = ?`,
        [record.ServiceRecordID]
      );
      record.photos = photos;
    }

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
};

module.exports = ServiceService;
