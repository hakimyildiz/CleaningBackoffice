const db = require('../../config/db');

const InvoiceModel = {
  findList: async ({ limit, offset, status, ownerType, from, to, search }) => {
    let query = `
      FROM Invoice i
      JOIN ServiceRecord sr ON i.ServiceRecordID = sr.ServiceRecordID
      LEFT JOIN Customer c ON i.CustomerID = c.CustomerID
      LEFT JOIN Person c_p ON c.PersonID = c_p.PersonID
      LEFT JOIN Agency a ON i.AgencyID = a.AgencyID
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND i.Status = ?';
      params.push(status);
    }

    if (ownerType) {
      if (ownerType === 'customer') {
        query += ' AND i.CustomerID IS NOT NULL';
      } else if (ownerType === 'agency') {
        query += ' AND i.AgencyID IS NOT NULL';
      }
    }

    if (from) {
      query += ' AND i.SentAt >= ?';
      params.push(from);
    }
    if (to) {
      query += ' AND i.SentAt <= ?';
      params.push(to);
    }

    if (search) {
      query += ' AND (i.InvoiceNumber LIKE ? OR c_p.FirstName LIKE ? OR c_p.SureName LIKE ? OR a.Name LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    // Get Total Count
    const countQuery = `SELECT COUNT(*) AS total ${query}`;
    const [countRows] = await db.query(countQuery, params);
    const total = countRows[0].total;

    // Get Data
    const dataQuery = `
      SELECT i.*, sr.ScheduledDate AS ServiceDate,
             c_p.FirstName AS CustomerFirstName, c_p.SureName AS CustomerSureName,
             a.Name AS AgencyName
      ${query}
      ORDER BY i.CreatedAt DESC
      LIMIT ? OFFSET ?
    `;
    const dataParams = [...params, parseInt(limit, 10), parseInt(offset, 10)];
    const [rows] = await db.query(dataQuery, dataParams);

    return { rows, total };
  },

  findById: async (id) => {
    const query = `
      SELECT i.*,
             c_p.FirstName AS CustomerFirstName, c_p.SureName AS CustomerSureName,
             a.Name AS AgencyName
      FROM Invoice i
      LEFT JOIN Customer c ON i.CustomerID = c.CustomerID
      LEFT JOIN Person c_p ON c.PersonID = c_p.PersonID
      LEFT JOIN Agency a ON i.AgencyID = a.AgencyID
      WHERE i.InvoiceID = ?
    `;
    const [rows] = await db.query(query, [id]);
    return rows[0] || null;
  },

  updateOverrides: async (id, { SubTotal, Total, Note, HoursOverride, RateOverride }, connection) => {
    const activeConn = connection || db;
    const query = `
      UPDATE Invoice
      SET SubTotal = ?, Total = ?, Note = ?, HoursOverride = ?, RateOverride = ?
      WHERE InvoiceID = ?
    `;
    const params = [
      SubTotal, Total, Note || null,
      HoursOverride !== undefined ? HoursOverride : null,
      RateOverride !== undefined ? RateOverride : null,
      id
    ];
    await activeConn.query(query, params);
  },

  updateStatus: async (id, status, connection) => {
    const activeConn = connection || db;
    const query = 'UPDATE Invoice SET Status = ?, SentAt = CASE WHEN ? = "sent" THEN NOW() ELSE SentAt END WHERE InvoiceID = ?';
    await activeConn.query(query, [status, status, id]);
  }
};

module.exports = InvoiceModel;
