const db = require('../../config/db');

const ServicePauseModel = {
  findList: async () => {
    const query = `
      SELECT sp.*, s.RefNo, s.PropertyType,
             c_p.FirstName AS CustomerFirstName, c_p.SureName AS CustomerSureName,
             a.Name AS AgencyName
      FROM ServicePause sp
      JOIN Service s ON sp.ServiceID = s.ServiceID
      LEFT JOIN Customer c ON s.CustomerID = c.CustomerID
      LEFT JOIN Person c_p ON c.PersonID = c_p.PersonID
      LEFT JOIN Agency a ON s.AgencyID = a.AgencyID
      ORDER BY sp.CreatedAt DESC
    `;
    const [rows] = await db.query(query);
    return rows;
  },

  findById: async (id) => {
    const query = 'SELECT * FROM ServicePause WHERE ServicePauseID = ?';
    const [rows] = await db.query(query, [id]);
    return rows[0] || null;
  },

  create: async ({ ServiceID, PauseFrom, PauseTo, Reason, RequestedBy, ApprovedBy, Status }, connection) => {
    const activeConn = connection || db;
    const reqBy = RequestedBy ? parseInt(RequestedBy, 10) : null;
    const appBy = ApprovedBy ? parseInt(ApprovedBy, 10) : null;

    const query = `
      INSERT INTO ServicePause (ServiceID, PauseFrom, PauseTo, Reason, RequestedBy, ApprovedBy, Status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await activeConn.query(query, [ServiceID, PauseFrom, PauseTo, Reason || null, reqBy, appBy, Status]);
    return result.insertId;
  },

  updateStatus: async (id, { Status, ApprovedBy }, connection) => {
    const activeConn = connection || db;
    const appBy = ApprovedBy ? parseInt(ApprovedBy, 10) : null;

    const query = 'UPDATE ServicePause SET Status = ?, ApprovedBy = ? WHERE ServicePauseID = ?';
    await activeConn.query(query, [Status, appBy, id]);
  },

  updateServicePauseRequestFlag: async (serviceId, isRequested, connection) => {
    const activeConn = connection || db;
    const flagVal = isRequested ? 1 : 0;
    const query = 'UPDATE Service SET IsPauseRequested = ? WHERE ServiceID = ?';
    await activeConn.query(query, [flagVal, serviceId]);
  },

  cancelScheduledOccurrencesInRange: async (serviceId, fromDate, toDate, connection) => {
    const activeConn = connection || db;
    const query = `
      UPDATE ServiceRecord
      SET Status = 'cancelled'
      WHERE ServiceID = ? 
        AND Status = 'scheduled' 
        AND ScheduledDate BETWEEN ? AND ?
    `;
    await activeConn.query(query, [serviceId, fromDate, toDate]);
  }
};

module.exports = ServicePauseModel;
