const db = require('../../config/db');

const ChangeRequestModel = {
  /**
   * Find paginated list of change requests with optional filters.
   */
  findList: async ({ limit, offset, type, status, search }) => {
    let query = `
      FROM ChangeRequest cr
      LEFT JOIN ServiceRecord sr ON cr.ServiceRecordID = sr.ServiceRecordID
      LEFT JOIN Service s ON cr.ServiceID = s.ServiceID OR sr.ServiceID = s.ServiceID
      LEFT JOIN Customer c ON s.CustomerID = c.CustomerID
      LEFT JOIN Person c_p ON c.PersonID = c_p.PersonID
      LEFT JOIN Agency a ON s.AgencyID = a.AgencyID
      LEFT JOIN User req_u ON cr.RequestedBy = req_u.UserID
      LEFT JOIN Person req_p ON req_u.PersonID = req_p.PersonID
      LEFT JOIN User rev_u ON cr.ReviewedBy = rev_u.UserID
      LEFT JOIN Person rev_p ON rev_u.PersonID = rev_p.PersonID
      WHERE 1=1
    `;
    const params = [];

    if (type && type !== 'all') {
      query += ' AND cr.Type = ?';
      params.push(type);
    }

    if (status && status !== 'all') {
      query += ' AND cr.Status = ?';
      params.push(status);
    }

    if (search) {
      query += ` AND (
        c_p.FirstName LIKE ? 
        OR c_p.SureName LIKE ? 
        OR a.Name LIKE ? 
        OR cr.Type LIKE ?
        OR cr.Note LIKE ?
      )`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam, searchParam);
    }

    // Get Total Count
    const countQuery = `SELECT COUNT(*) AS total ${query}`;
    const [countRows] = await db.query(countQuery, params);
    const total = countRows[0].total;

    // Get Data
    const dataQuery = `
      SELECT cr.*, 
             req_p.FirstName AS RequestedByFirstName, req_p.SureName AS RequestedBySureName,
             rev_p.FirstName AS ReviewedByFirstName, rev_p.SureName AS ReviewedBySureName,
             c_p.FirstName AS CustomerFirstName, c_p.SureName AS CustomerSureName,
             a.Name AS AgencyName,
             COALESCE(sr.AddressLine, s.AddressLine) AS AddressLine,
             COALESCE(sr.City, s.City) AS City
      ${query}
      ORDER BY 
        CASE WHEN cr.Status = 'pending' THEN 1 ELSE 2 END ASC,
        cr.CreatedAt DESC
      LIMIT ? OFFSET ?
    `;
    const dataParams = [...params, parseInt(limit, 10), parseInt(offset, 10)];
    const [rows] = await db.query(dataQuery, dataParams);

    return { rows, total };
  },

  /**
   * Find request by ID.
   */
  findById: async (id) => {
    const query = `
      SELECT cr.*, 
             req_p.FirstName AS RequestedByFirstName, req_p.SureName AS RequestedBySureName,
             c_p.FirstName AS CustomerFirstName, c_p.SureName AS CustomerSureName,
             a.Name AS AgencyName,
             s.ServiceID, s.CustomerID AS ServiceCustomerID, s.AgencyID AS ServiceAgencyID
      FROM ChangeRequest cr
      LEFT JOIN ServiceRecord sr ON cr.ServiceRecordID = sr.ServiceRecordID
      LEFT JOIN Service s ON cr.ServiceID = s.ServiceID OR sr.ServiceID = s.ServiceID
      LEFT JOIN Customer c ON s.CustomerID = c.CustomerID
      LEFT JOIN Person c_p ON c.PersonID = c_p.PersonID
      LEFT JOIN Agency a ON s.AgencyID = a.AgencyID
      LEFT JOIN User req_u ON cr.RequestedBy = req_u.UserID
      LEFT JOIN Person req_p ON req_u.PersonID = req_p.PersonID
      WHERE cr.ChangeRequestID = ?
    `;
    const [rows] = await db.query(query, [id]);
    return rows[0] || null;
  },

  /**
   * Create a change request.
   */
  create: async ({ ServiceRecordID, ServiceID, ServiceScheduleID, RequestedBy, Type, RequestedValue }, connection) => {
    const activeConn = connection || db;
    const query = `
      INSERT INTO ChangeRequest (ServiceRecordID, ServiceID, ServiceScheduleID, RequestedBy, Type, RequestedValue)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [
      ServiceRecordID || null,
      ServiceID || null,
      ServiceScheduleID || null,
      RequestedBy,
      Type,
      RequestedValue
    ];
    const [result] = await activeConn.query(query, params);
    return result.insertId;
  },

  /**
   * Update request status (Approve / Reject).
   */
  updateStatus: async (id, { Status, ReviewedBy, Note }, connection) => {
    const activeConn = connection || db;
    const query = `
      UPDATE ChangeRequest 
      SET Status = ?, ReviewedBy = ?, Note = ?, ReviewedAt = NOW()
      WHERE ChangeRequestID = ?
    `;
    await activeConn.query(query, [Status, ReviewedBy, Note || null, id]);
  },

  /**
   * Count pending requests.
   */
  countPending: async () => {
    const query = "SELECT COUNT(*) AS count FROM ChangeRequest WHERE Status = 'pending'";
    const [rows] = await db.query(query);
    return parseInt(rows[0].count || 0);
  }
};

module.exports = ChangeRequestModel;
