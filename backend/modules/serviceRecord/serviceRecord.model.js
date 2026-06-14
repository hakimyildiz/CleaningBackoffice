const db = require('../../config/db');

const ServiceRecordModel = {
  findList: async ({ limit, offset, search, status, customerId, agencyId, sortBy, sortOrder }) => {
    let query = `
      FROM ServiceRecord sr
      JOIN Service s ON sr.ServiceID = s.ServiceID
      LEFT JOIN Customer c ON sr.CustomerID = c.CustomerID
      LEFT JOIN Person c_p ON c.PersonID = c_p.PersonID
      LEFT JOIN Agency a ON sr.AgencyID = a.AgencyID
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ' AND (sr.AddressLine LIKE ? OR sr.City LIKE ? OR sr.PostCode LIKE ? OR c_p.FirstName LIKE ? OR c_p.SureName LIKE ? OR a.Name LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam, searchParam, searchParam);
    }

    if (status) {
      query += ' AND sr.Status = ?';
      params.push(status);
    }

    if (customerId) {
      query += ' AND sr.CustomerID = ?';
      params.push(parseInt(customerId, 10));
    }

    if (agencyId) {
      query += ' AND sr.AgencyID = ?';
      params.push(parseInt(agencyId, 10));
    }

    // Get Total Count
    const countQuery = `SELECT COUNT(*) AS total ${query}`;
    const [countRows] = await db.query(countQuery, params);
    const total = countRows[0].total;

    // Sorting whitelist
    const allowedSortFields = {
      'ScheduledDate': 'sr.ScheduledDate',
      'ScheduledStart': 'sr.ScheduledStart',
      'Status': 'sr.Status',
      'Rate': 'sr.Rate',
      'Total': 'sr.ActualHours'
    };
    const sortColumn = allowedSortFields[sortBy] || 'sr.ScheduledDate';
    const order = sortOrder && sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Get Data
    const dataQuery = `
      SELECT sr.*, s.RefNo, s.PropertyType,
             c_p.FirstName AS CustomerFirstName, c_p.SureName AS CustomerSureName,
             a.Name AS AgencyName
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
      SELECT sr.*, s.RefNo, s.PropertyType, s.RequireCheckoutPhoto,
             c_p.FirstName AS CustomerFirstName, c_p.SureName AS CustomerSureName, c_p.Email AS CustomerEmail,
             a.Name AS AgencyName, a.Email AS AgencyEmail
      FROM ServiceRecord sr
      JOIN Service s ON sr.ServiceID = s.ServiceID
      LEFT JOIN Customer c ON sr.CustomerID = c.CustomerID
      LEFT JOIN Person c_p ON c.PersonID = c_p.PersonID
      LEFT JOIN Agency a ON sr.AgencyID = a.AgencyID
      WHERE sr.ServiceRecordID = ?
    `;
    const [rows] = await db.query(query, [id]);
    return rows[0] || null;
  },

  create: async (data, connection) => {
    const activeConn = connection || db;
    const query = `
      INSERT INTO ServiceRecord (
        ServiceID, CustomerID, AgencyID, AgencyStaffID, Rate, AddressLine, City, PostCode,
        ScheduledDate, ScheduledStart, EstimatedHours, Status, CreatedBy
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      data.ServiceID, data.CustomerID || null, data.AgencyID || null, data.AgencyStaffID || null,
      data.Rate || null, data.AddressLine, data.City, data.PostCode,
      data.ScheduledDate, data.ScheduledStart, data.EstimatedHours || 2.0,
      data.Status || 'scheduled', data.CreatedBy
    ];
    const [result] = await activeConn.query(query, params);
    return result.insertId;
  },

  updateStatus: async (id, status, connection) => {
    const activeConn = connection || db;
    const query = 'UPDATE ServiceRecord SET Status = ? WHERE ServiceRecordID = ?';
    await activeConn.query(query, [status, id]);
  },

  updateActualHours: async (id, hours, connection) => {
    const activeConn = connection || db;
    const query = 'UPDATE ServiceRecord SET ActualHours = ? WHERE ServiceRecordID = ?';
    await activeConn.query(query, [hours, id]);
  },

  findCleanerCheckIn: async (recordId, employeeId) => {
    const query = `
      SELECT * FROM ServiceRecordCleaner 
      WHERE ServiceRecordID = ? AND EmployeeID = ? AND CheckOut IS NULL
      LIMIT 1
    `;
    const [rows] = await db.query(query, [recordId, employeeId]);
    return rows[0] || null;
  },

  hasActiveJob: async (employeeId) => {
    const query = `
      SELECT * FROM ServiceRecordCleaner 
      WHERE EmployeeID = ? AND CheckOut IS NULL
      LIMIT 1
    `;
    const [rows] = await db.query(query, [employeeId]);
    return rows.length > 0;
  },

  checkInCleaner: async ({ ServiceRecordID, EmployeeID, CheckInLat, CheckInLng }, connection) => {
    const activeConn = connection || db;
    const query = `
      INSERT INTO ServiceRecordCleaner (ServiceRecordID, EmployeeID, AssignedBy, CheckIn, CheckInLat, CheckInLng)
      VALUES (?, ?, NULL, NOW(), ?, ?)
    `;
    await activeConn.query(query, [ServiceRecordID, EmployeeID, CheckInLat, CheckInLng]);
  },

  checkOutCleaner: async ({ ServiceRecordID, EmployeeID, CheckOutLat, CheckOutLng, ActualHours, Note }, connection) => {
    const activeConn = connection || db;
    const query = `
      UPDATE ServiceRecordCleaner
      SET CheckOut = NOW(), CheckOutLat = ?, CheckOutLng = ?, ActualHours = ?, Note = ?
      WHERE ServiceRecordID = ? AND EmployeeID = ? AND CheckOut IS NULL
    `;
    await activeConn.query(query, [CheckOutLat, CheckOutLng, ActualHours, Note || null, ServiceRecordID, EmployeeID]);
  },

  sumActualHours: async (recordId, connection) => {
    const activeConn = connection || db;
    const query = 'SELECT SUM(ActualHours) AS total FROM ServiceRecordCleaner WHERE ServiceRecordID = ?';
    const [rows] = await activeConn.query(query, [recordId]);
    return parseFloat(rows[0].total || 0);
  },

  findCleaners: async (recordId) => {
    const query = `
      SELECT src.*, p.FirstName, p.SureName, u.Username
      FROM ServiceRecordCleaner src
      JOIN Employee e ON src.EmployeeID = e.EmployeeID
      JOIN Person p ON e.PersonID = p.PersonID
      LEFT JOIN User u ON u.PersonID = p.PersonID
      WHERE src.ServiceRecordID = ?
      ORDER BY src.CheckIn ASC
    `;
    const [rows] = await db.query(query, [recordId]);
    return rows;
  },

  addCleanerToRecord: async (recordId, employeeId, assignedBy, connection) => {
    const activeConn = connection || db;
    const query = `
      INSERT INTO ServiceRecordCleaner (ServiceRecordID, EmployeeID, AssignedBy)
      VALUES (?, ?, ?)
    `;
    await activeConn.query(query, [recordId, employeeId, assignedBy]);
  },

  removeCleanerFromRecord: async (recordId, employeeId, connection) => {
    const activeConn = connection || db;
    const query = `
      DELETE FROM ServiceRecordCleaner 
      WHERE ServiceRecordID = ? AND EmployeeID = ?
    `;
    await activeConn.query(query, [recordId, employeeId]);
  },

  verifyAssignment: async (scheduleId, employeeId) => {
    const query = `
      SELECT 1 FROM ServiceScheduleEmployee 
      WHERE ServiceScheduleID = ? AND EmployeeID = ?
    `;
    const [rows] = await db.query(query, [scheduleId, employeeId]);
    return rows.length > 0;
  },

  findOptions: async (recordId) => {
    const query = 'SELECT * FROM ServiceRecordOption WHERE ServiceRecordID = ?';
    const [rows] = await db.query(query, [recordId]);
    return rows;
  },

  copyServiceOptions: async (serviceId, recordId, connection) => {
    const activeConn = connection || db;
    // Phase 4 Snapshot Rule: Look up the service options selected for the Service and insert snapshots.
    // In Phase 3, Service options are stored. Let's select active ones and insert into ServiceRecordOption.
    // Wait, how are options linked to Service in Phase 3? Let's check ServiceRecordOption and ServiceOption.
    // If there is a join table ServiceServiceOption or similar, let's select it.
    // Wait! Let's check how selected options are saved on Service creation in ServiceModel.
    // Let's search the workspace for how options are assigned to a service.
  }
};

module.exports = ServiceRecordModel;
