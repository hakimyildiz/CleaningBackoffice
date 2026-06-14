const db = require('../../config/db');

const PaymentModel = {
  /**
   * Find paginated list of payments with optional filters.
   */
  findList: async ({ limit, offset, method, from, to, search }) => {
    let query = `
      FROM Payment p
      JOIN Invoice i ON p.InvoiceID = i.InvoiceID
      LEFT JOIN Customer c ON i.CustomerID = c.CustomerID
      LEFT JOIN Person c_p ON c.PersonID = c_p.PersonID
      LEFT JOIN Agency a ON i.AgencyID = a.AgencyID
      LEFT JOIN User u ON p.RecordedBy = u.UserID
      LEFT JOIN Person u_p ON u.PersonID = u_p.PersonID
      WHERE 1=1
    `;
    const params = [];

    if (method) {
      query += ' AND p.Method = ?';
      params.push(method);
    }

    if (from) {
      query += ' AND p.PaidAt >= ?';
      params.push(from);
    }

    if (to) {
      query += ' AND p.PaidAt <= ?';
      params.push(to);
    }

    if (search) {
      query += ` AND (
        i.InvoiceNumber LIKE ? 
        OR c_p.FirstName LIKE ? 
        OR c_p.SureName LIKE ? 
        OR a.Name LIKE ?
        OR p.Reference LIKE ?
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
      SELECT p.*, i.InvoiceNumber, i.CustomerID, i.AgencyID,
             c_p.FirstName AS CustomerFirstName, c_p.SureName AS CustomerSureName,
             a.Name AS AgencyName,
             u_p.FirstName AS RecordedByFirstName, u_p.SureName AS RecordedBySureName
      ${query}
      ORDER BY p.PaidAt DESC, p.CreatedAt DESC
      LIMIT ? OFFSET ?
    `;
    const dataParams = [...params, parseInt(limit, 10), parseInt(offset, 10)];
    const [rows] = await db.query(dataQuery, dataParams);

    return { rows, total };
  },

  /**
   * Find payments for a specific invoice.
   */
  findByInvoiceId: async (invoiceId) => {
    const query = `
      SELECT p.*,
             u_p.FirstName AS RecordedByFirstName, u_p.SureName AS RecordedBySureName
      FROM Payment p
      LEFT JOIN User u ON p.RecordedBy = u.UserID
      LEFT JOIN Person u_p ON u.PersonID = u_p.PersonID
      WHERE p.InvoiceID = ?
      ORDER BY p.PaidAt DESC, p.CreatedAt DESC
    `;
    const [rows] = await db.query(query, [invoiceId]);
    return rows;
  },

  /**
   * Find payment by ID.
   */
  findById: async (id) => {
    const query = `
      SELECT p.*, i.InvoiceNumber, i.CustomerID, i.AgencyID, i.Total AS InvoiceTotal
      FROM Payment p
      JOIN Invoice i ON p.InvoiceID = i.InvoiceID
      WHERE p.PaymentID = ?
    `;
    const [rows] = await db.query(query, [id]);
    return rows[0] || null;
  },

  /**
   * Record a payment against an invoice.
   */
  create: async ({ InvoiceID, Amount, PaidAt, Method, Reference, Note, RecordedBy }, connection) => {
    const activeConn = connection || db;
    const query = `
      INSERT INTO Payment (InvoiceID, Amount, PaidAt, Method, Reference, Note, RecordedBy)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [InvoiceID, Amount, PaidAt, Method, Reference || null, Note || null, RecordedBy];
    const [result] = await activeConn.query(query, params);
    return result.insertId;
  },

  /**
   * Delete a payment record.
   */
  delete: async (id, connection) => {
    const activeConn = connection || db;
    const query = 'DELETE FROM Payment WHERE PaymentID = ?';
    await activeConn.query(query, [id]);
  },

  /**
   * Calculate total paid for an invoice.
   */
  sumByInvoiceId: async (invoiceId, connection) => {
    const activeConn = connection || db;
    const query = 'SELECT COALESCE(SUM(Amount), 0) AS totalPaid FROM Payment WHERE InvoiceID = ?';
    const [rows] = await activeConn.query(query, [invoiceId]);
    return parseFloat(rows[0].totalPaid || 0);
  }
};

module.exports = PaymentModel;
