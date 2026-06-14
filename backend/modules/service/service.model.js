const db = require('../../config/db');

const ServiceModel = {
  findList: async ({ limit, offset, search, type, customerId, agencyId, isActive, status, sortBy, sortOrder }) => {
    let query = `
      FROM Service s
      LEFT JOIN Customer c ON s.CustomerID = c.CustomerID
      LEFT JOIN Person c_p ON c.PersonID = c_p.PersonID
      LEFT JOIN Agency a ON s.AgencyID = a.AgencyID
      LEFT JOIN AgencyStaff ast ON s.AgencyStaffID = ast.AgencyStaffID
      LEFT JOIN Person ast_p ON ast.PersonID = ast_p.PersonID
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ' AND (s.RefNo LIKE ? OR s.AddressLine LIKE ? OR s.PostCode LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    if (type) {
      query += ' AND s.Type = ?';
      params.push(type);
    }

    if (customerId) {
      query += ' AND s.CustomerID = ?';
      params.push(parseInt(customerId, 10));
    }

    if (agencyId) {
      query += ' AND s.AgencyID = ?';
      params.push(parseInt(agencyId, 10));
    }

    if (isActive !== undefined && isActive !== null) {
      query += ' AND s.IsActive = ?';
      params.push(isActive === 'true' || isActive === true ? 1 : 0);
    }

    // Status filter (active | paused | pause_requested)
    if (status) {
      if (status === 'pause_requested') {
        query += ' AND s.IsActive = 1 AND s.IsPauseRequested = 1';
      } else if (status === 'paused') {
        query += `
          AND s.IsActive = 1 
          AND EXISTS (
            SELECT 1 FROM ServicePause sp 
            WHERE sp.ServiceID = s.ServiceID 
              AND sp.Status = 'approved' 
              AND CURRENT_DATE BETWEEN sp.PauseFrom AND sp.PauseTo
          )
        `;
      } else if (status === 'active') {
        query += `
          AND s.IsActive = 1 
          AND s.IsPauseRequested = 0 
          AND NOT EXISTS (
            SELECT 1 FROM ServicePause sp 
            WHERE sp.ServiceID = s.ServiceID 
              AND sp.Status = 'approved' 
              AND CURRENT_DATE BETWEEN sp.PauseFrom AND sp.PauseTo
          )
        `;
      }
    }

    // Get Total Count
    const countQuery = `SELECT COUNT(*) AS total ${query}`;
    const [countRows] = await db.query(countQuery, params);
    const total = countRows[0].total;

    // Sorting Whitelist
    const allowedSortFields = {
      'RefNo': 's.RefNo',
      'AddressLine': 's.AddressLine',
      'PostCode': 's.PostCode',
      'Type': 's.Type',
      'IsActive': 's.IsActive'
    };
    const sortColumn = allowedSortFields[sortBy] || 's.RefNo';
    const order = sortOrder && sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Get Data with dynamic Status and EffectiveRate
    const dataQuery = `
      SELECT s.*,
             c_p.FirstName AS CustomerFirstName, c_p.SureName AS CustomerSureName,
             a.Name AS AgencyName,
             ast_p.FirstName AS StaffFirstName, ast_p.SureName AS StaffSureName,
             CASE 
               WHEN s.IsActive = 0 THEN 'inactive'
               WHEN s.IsPauseRequested = 1 THEN 'pause_requested'
               WHEN EXISTS (
                 SELECT 1 FROM ServicePause sp 
                 WHERE sp.ServiceID = s.ServiceID 
                   AND sp.Status = 'approved' 
                   AND CURRENT_DATE BETWEEN sp.PauseFrom AND sp.PauseTo
               ) THEN 'paused'
               ELSE 'active'
             END AS Status,
             COALESCE(
               s.Rate,
               CASE 
                 WHEN s.CustomerID IS NOT NULL THEN (SELECT Rate FROM Customer WHERE CustomerID = s.CustomerID)
                 WHEN s.AgencyID IS NOT NULL THEN (SELECT Rate FROM Agency WHERE AgencyID = s.AgencyID)
                 ELSE NULL
               END,
               (SELECT Rate FROM DefaultRate ORDER BY ValidFrom DESC, CreatedAt DESC LIMIT 1)
             ) AS EffectiveRate,
             CASE
               WHEN s.Rate IS NOT NULL THEN 'service'
               WHEN s.CustomerID IS NOT NULL AND (SELECT Rate FROM Customer WHERE CustomerID = s.CustomerID) IS NOT NULL THEN 'customer'
               WHEN s.AgencyID IS NOT NULL AND (SELECT Rate FROM Agency WHERE AgencyID = s.AgencyID) IS NOT NULL THEN 'agency'
               ELSE 'default'
             END AS EffectiveRateSource
      ${query}
      ORDER BY ${sortColumn} ${order}
      LIMIT ? OFFSET ?
    `;
    const dataParams = [...params, parseInt(limit, 10), parseInt(offset, 10)];
    const [rows] = await db.query(dataQuery, dataParams);

    return { rows, total };
  },

  findById: async (id) => {
    const query = `
      SELECT s.*,
             c_p.FirstName AS CustomerFirstName, c_p.SureName AS CustomerSureName,
             a.Name AS AgencyName,
             ast_p.FirstName AS StaffFirstName, ast_p.SureName AS StaffSureName,
             CASE 
               WHEN s.IsActive = 0 THEN 'inactive'
               WHEN s.IsPauseRequested = 1 THEN 'pause_requested'
               WHEN EXISTS (
                 SELECT 1 FROM ServicePause sp 
                 WHERE sp.ServiceID = s.ServiceID 
                   AND sp.Status = 'approved' 
                   AND CURRENT_DATE BETWEEN sp.PauseFrom AND sp.PauseTo
               ) THEN 'paused'
               ELSE 'active'
             END AS Status,
             COALESCE(
               s.Rate,
               CASE 
                 WHEN s.CustomerID IS NOT NULL THEN (SELECT Rate FROM Customer WHERE CustomerID = s.CustomerID)
                 WHEN s.AgencyID IS NOT NULL THEN (SELECT Rate FROM Agency WHERE AgencyID = s.AgencyID)
                 ELSE NULL
               END,
               (SELECT Rate FROM DefaultRate ORDER BY ValidFrom DESC, CreatedAt DESC LIMIT 1)
             ) AS EffectiveRate,
             CASE
               WHEN s.Rate IS NOT NULL THEN 'service'
               WHEN s.CustomerID IS NOT NULL AND (SELECT Rate FROM Customer WHERE CustomerID = s.CustomerID) IS NOT NULL THEN 'customer'
               WHEN s.AgencyID IS NOT NULL AND (SELECT Rate FROM Agency WHERE AgencyID = s.AgencyID) IS NOT NULL THEN 'agency'
               ELSE 'default'
             END AS EffectiveRateSource
      FROM Service s
      LEFT JOIN Customer c ON s.CustomerID = c.CustomerID
      LEFT JOIN Person c_p ON c.PersonID = c_p.PersonID
      LEFT JOIN Agency a ON s.AgencyID = a.AgencyID
      LEFT JOIN AgencyStaff ast ON s.AgencyStaffID = ast.AgencyStaffID
      LEFT JOIN Person ast_p ON ast.PersonID = ast_p.PersonID
      WHERE s.ServiceID = ?
    `;
    const [rows] = await db.query(query, [id]);
    return rows[0] || null;
  },

  create: async (serviceData, connection) => {
    const activeConn = connection || db;
    const rateVal = serviceData.Rate ? parseFloat(serviceData.Rate) : null;
    const customerId = serviceData.CustomerID ? parseInt(serviceData.CustomerID, 10) : null;
    const agencyId = serviceData.AgencyID ? parseInt(serviceData.AgencyID, 10) : null;
    const staffId = serviceData.AgencyStaffID ? parseInt(serviceData.AgencyStaffID, 10) : null;
    const beds = serviceData.Beds ? parseInt(serviceData.Beds, 10) : null;
    const bathrooms = serviceData.Bathrooms ? parseInt(serviceData.Bathrooms, 10) : null;
    const kitchens = serviceData.Kitchens ? parseInt(serviceData.Kitchens, 10) : null;
    const hasPet = serviceData.HasPet === true || serviceData.HasPet === 1 || serviceData.HasPet === 'true' ? 1 : 0;
    const requireCheckoutPhoto = serviceData.RequireCheckoutPhoto !== undefined
      ? (serviceData.RequireCheckoutPhoto === true || serviceData.RequireCheckoutPhoto === 1 || serviceData.RequireCheckoutPhoto === 'true' ? 1 : 0)
      : 1;

    const query = `
      INSERT INTO Service (
        CustomerID, AgencyID, AgencyStaffID, Type, RefNo, Rate, PropertyType,
        AddressLine, City, PostCode, Beds, Bathrooms, Kitchens, HasPet, IsActive, Note, RequireCheckoutPhoto
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `;
    const params = [
      customerId, agencyId, staffId, serviceData.Type, serviceData.RefNo || null, rateVal, serviceData.PropertyType,
      serviceData.AddressLine, serviceData.City, serviceData.PostCode, beds, bathrooms, kitchens, hasPet, serviceData.Note || null,
      requireCheckoutPhoto
    ];
    const [result] = await activeConn.query(query, params);
    return result.insertId;
  },

  update: async (id, serviceData, connection) => {
    const activeConn = connection || db;
    const rateVal = serviceData.Rate ? parseFloat(serviceData.Rate) : null;
    const customerId = serviceData.CustomerID ? parseInt(serviceData.CustomerID, 10) : null;
    const agencyId = serviceData.AgencyID ? parseInt(serviceData.AgencyID, 10) : null;
    const staffId = serviceData.AgencyStaffID ? parseInt(serviceData.AgencyStaffID, 10) : null;
    const beds = serviceData.Beds ? parseInt(serviceData.Beds, 10) : null;
    const bathrooms = serviceData.Bathrooms ? parseInt(serviceData.Bathrooms, 10) : null;
    const kitchens = serviceData.Kitchens ? parseInt(serviceData.Kitchens, 10) : null;
    const hasPet = serviceData.HasPet === true || serviceData.HasPet === 1 || serviceData.HasPet === 'true' ? 1 : 0;
    const requireCheckoutPhoto = serviceData.RequireCheckoutPhoto !== undefined
      ? (serviceData.RequireCheckoutPhoto === true || serviceData.RequireCheckoutPhoto === 1 || serviceData.RequireCheckoutPhoto === 'true' ? 1 : 0)
      : 1;

    const query = `
      UPDATE Service
      SET CustomerID = ?, AgencyID = ?, AgencyStaffID = ?, Rate = ?, PropertyType = ?,
          AddressLine = ?, City = ?, PostCode = ?, Beds = ?, Bathrooms = ?, Kitchens = ?, HasPet = ?, Note = ?, RequireCheckoutPhoto = ?
      WHERE ServiceID = ?
    `;
    const params = [
      customerId, agencyId, staffId, rateVal, serviceData.PropertyType,
      serviceData.AddressLine, serviceData.City, serviceData.PostCode, beds, bathrooms, kitchens, hasPet, serviceData.Note || null,
      requireCheckoutPhoto, id
    ];
    await activeConn.query(query, params);
  },

  updateStatus: async (id, isActive, connection) => {
    const activeConn = connection || db;
    const statusVal = isActive ? 1 : 0;
    const query = 'UPDATE Service SET IsActive = ? WHERE ServiceID = ?';
    await activeConn.query(query, [statusVal, id]);
  },

  resolveLiveRate: async (customerId, agencyId) => {
    let query = `
      SELECT 
        COALESCE(
          ?,
          (SELECT Rate FROM DefaultRate ORDER BY ValidFrom DESC, CreatedAt DESC LIMIT 1)
        ) AS EffectiveRate,
        ? AS Source
    `;
    const params = [];
    if (customerId) {
      const [rows] = await db.query('SELECT Rate FROM Customer WHERE CustomerID = ?', [customerId]);
      const rate = rows[0] ? rows[0].Rate : null;
      params.push(rate, rate ? 'customer' : 'default');
    } else if (agencyId) {
      const [rows] = await db.query('SELECT Rate FROM Agency WHERE AgencyID = ?', [agencyId]);
      const rate = rows[0] ? rows[0].Rate : null;
      params.push(rate, rate ? 'agency' : 'default');
    } else {
      params.push(null, 'default');
    }

    const [rows] = await db.query(query, params);
    return rows[0];
  },

  findScheduleRule: async (serviceId) => {
    const query = 'SELECT * FROM ServiceSchedule WHERE ServiceID = ? AND IsActive = 1';
    const [rows] = await db.query(query, [serviceId]);
    return rows[0] || null;
  },

  createScheduleRule: async (ruleData, connection) => {
    const activeConn = connection || db;
    const query = `
      INSERT INTO ServiceSchedule (ServiceID, Frequency, DayOfWeek, DayOfMonth, StartTime, EstimatedHours, IsActive)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `;
    const params = [
      ruleData.ServiceID, ruleData.Frequency, ruleData.DayOfWeek || null, ruleData.DayOfMonth || null, ruleData.StartTime, ruleData.EstimatedHours
    ];
    await activeConn.query(query, params);
  },

  updateScheduleRule: async (serviceId, ruleData, connection) => {
    const activeConn = connection || db;
    const query = `
      UPDATE ServiceSchedule
      SET Frequency = ?, DayOfWeek = ?, DayOfMonth = ?, StartTime = ?, EstimatedHours = ?
      WHERE ServiceID = ? AND IsActive = 1
    `;
    const params = [
      ruleData.Frequency, ruleData.DayOfWeek || null, ruleData.DayOfMonth || null, ruleData.StartTime, ruleData.EstimatedHours, serviceId
    ];
    await activeConn.query(query, params);
  },

  findActivePauses: async (serviceId) => {
    const query = "SELECT PauseFrom, PauseTo FROM ServicePause WHERE ServiceID = ? AND Status = 'approved'";
    const [rows] = await db.query(query, [serviceId]);
    return rows;
  },

  insertScheduleOccurrences: async (occurrences, connection) => {
    const activeConn = connection || db;
    if (occurrences.length === 0) return null;
    
    // Batch insert occurrences into ServiceRecord
    const query = `
      INSERT INTO ServiceRecord (
        ServiceID, CustomerID, AgencyID, AgencyStaffID, Rate, AddressLine, City, PostCode,
        ScheduledDate, ScheduledStart, EstimatedHours, Status
      )
      VALUES ?
    `;
    const values = occurrences.map(o => [
      o.ServiceID, o.CustomerID || null, o.AgencyID || null, o.AgencyStaffID || null, o.Rate || null,
      o.AddressLine, o.City, o.PostCode, o.ScheduledDate, o.ScheduledStart, o.EstimatedHours, 'scheduled'
    ]);
    const [result] = await activeConn.query(query, [values]);
    return result;
  },

  cancelFutureOccurrences: async (serviceId, connection) => {
    const activeConn = connection || db;
    const query = `
      UPDATE ServiceRecord
      SET Status = 'cancelled'
      WHERE ServiceID = ? AND Status = 'scheduled' AND ScheduledDate >= CURRENT_DATE
    `;
    await activeConn.query(query, [serviceId]);
  }
};

module.exports = ServiceModel;
