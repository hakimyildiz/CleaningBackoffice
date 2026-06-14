const db = require('../../config/db');

const ServiceScheduleModel = {
  findListByServiceId: async (serviceId) => {
    const query = `
      SELECT sr.*, s.RefNo, s.PropertyType, sch.ServiceScheduleID
      FROM ServiceRecord sr
      JOIN Service s ON sr.ServiceID = s.ServiceID
      LEFT JOIN ServiceSchedule sch ON s.ServiceID = sch.ServiceID AND sch.IsActive = 1
      WHERE sr.ServiceID = ?
      ORDER BY sr.ScheduledDate ASC, sr.ScheduledStart ASC
    `;
    const [rows] = await db.query(query, [serviceId]);
    return rows;
  },

  findGlobalList: async ({ limit, offset, from, to, serviceId, status, customerId, agencyId }) => {
    let query = `
      FROM ServiceRecord sr
      JOIN Service s ON sr.ServiceID = s.ServiceID
      LEFT JOIN Customer c ON s.CustomerID = c.CustomerID
      LEFT JOIN Person c_p ON c.PersonID = c_p.PersonID
      LEFT JOIN Agency a ON s.AgencyID = a.AgencyID
      LEFT JOIN ServiceSchedule sch ON s.ServiceID = sch.ServiceID AND sch.IsActive = 1
      WHERE 1=1
    `;
    const params = [];

    if (from) {
      query += ' AND sr.ScheduledDate >= ?';
      params.push(from);
    }
    if (to) {
      query += ' AND sr.ScheduledDate <= ?';
      params.push(to);
    }
    if (serviceId) {
      query += ' AND sr.ServiceID = ?';
      params.push(parseInt(serviceId, 10));
    }
    if (status) {
      query += ' AND sr.Status = ?';
      params.push(status);
    }
    if (customerId) {
      query += ' AND s.CustomerID = ?';
      params.push(parseInt(customerId, 10));
    }
    if (agencyId) {
      query += ' AND s.AgencyID = ?';
      params.push(parseInt(agencyId, 10));
    }

    // Get Total Count
    const countQuery = `SELECT COUNT(*) AS total ${query}`;
    const [countRows] = await db.query(countQuery, params);
    const total = countRows[0].total;

    // Get Data
    const dataQuery = `
      SELECT sr.*, s.RefNo, s.PropertyType, s.AddressLine AS ServiceAddressLine, s.City AS ServiceCity, s.PostCode AS ServicePostCode,
             c_p.FirstName AS CustomerFirstName, c_p.SureName AS CustomerSureName,
             a.Name AS AgencyName, sch.ServiceScheduleID
      ${query}
      ORDER BY sr.ScheduledDate ASC, sr.ScheduledStart ASC
      LIMIT ? OFFSET ?
    `;
    const dataParams = [...params, parseInt(limit, 10), parseInt(offset, 10)];
    const [rows] = await db.query(dataQuery, dataParams);

    return { rows, total };
  },

  findById: async (id) => {
    const query = `
      SELECT sr.*, s.RefNo, s.PropertyType
      FROM ServiceRecord sr
      JOIN Service s ON sr.ServiceID = s.ServiceID
      WHERE sr.ServiceRecordID = ?
    `;
    const [rows] = await db.query(query, [id]);
    return rows[0] || null;
  },

  update: async (id, { ScheduledDate, ScheduledStart, EstimatedHours }, connection) => {
    const activeConn = connection || db;
    const hoursVal = EstimatedHours ? parseFloat(EstimatedHours) : null;

    const query = `
      UPDATE ServiceRecord
      SET ScheduledDate = ?, ScheduledStart = ?, EstimatedHours = ?
      WHERE ServiceRecordID = ?
    `;
    await activeConn.query(query, [ScheduledDate, ScheduledStart, hoursVal, id]);
  },

  cancel: async (id, connection) => {
    const activeConn = connection || db;
    const query = `
      UPDATE ServiceRecord
      SET Status = 'cancelled'
      WHERE ServiceRecordID = ?
    `;
    await activeConn.query(query, [id]);
  },

  updateStatus: async (id, status, connection) => {
    const activeConn = connection || db;
    const query = 'UPDATE ServiceRecord SET Status = ? WHERE ServiceRecordID = ?';
    await activeConn.query(query, [status, id]);
  }
};

module.exports = ServiceScheduleModel;
