const db = require('../../config/db');

const CreditLedgerModel = {
  /**
   * Lists all credit ledger entries.
   */
  findList: async ({ limit, offset }) => {
    let query = `
      FROM CreditLedger cl
      LEFT JOIN Customer c ON cl.CustomerID = c.CustomerID
      LEFT JOIN Person c_p ON c.PersonID = c_p.PersonID
      LEFT JOIN Agency a ON cl.AgencyID = a.AgencyID
      LEFT JOIN User u ON cl.CreatedBy = u.UserID
      LEFT JOIN Person u_p ON u.PersonID = u_p.PersonID
      WHERE 1=1
    `;

    const countQuery = `SELECT COUNT(*) AS total ${query}`;
    const [countRows] = await db.query(countQuery);
    const total = countRows[0].total;

    const dataQuery = `
      SELECT cl.*,
             c_p.FirstName AS CustomerFirstName, c_p.SureName AS CustomerSureName,
             a.Name AS AgencyName,
             u_p.FirstName AS CreatedByFirstName, u_p.SureName AS CreatedBySureName
      ${query}
      ORDER BY cl.CreatedAt DESC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await db.query(dataQuery, [parseInt(limit, 10), parseInt(offset, 10)]);

    return { rows, total };
  },

  /**
   * Find credit balance for a customer.
   */
  findCustomerBalance: async (customerId, connection) => {
    const activeConn = connection || db;
    const query = 'SELECT COALESCE(SUM(Amount), 0) AS balance FROM CreditLedger WHERE CustomerID = ?';
    const [rows] = await activeConn.query(query, [customerId]);
    return parseFloat(rows[0].balance || 0);
  },

  /**
   * Find credit balance for an agency.
   */
  findAgencyBalance: async (agencyId, connection) => {
    const activeConn = connection || db;
    const query = 'SELECT COALESCE(SUM(Amount), 0) AS balance FROM CreditLedger WHERE AgencyID = ?';
    const [rows] = await activeConn.query(query, [agencyId]);
    return parseFloat(rows[0].balance || 0);
  },

  /**
   * Record credit ledger entry.
   */
  create: async ({ CustomerID, AgencyID, Amount, Type, RelatedPaymentID, RelatedInvoiceID, Note, CreatedBy }, connection) => {
    const activeConn = connection || db;
    const query = `
      INSERT INTO CreditLedger (CustomerID, AgencyID, Amount, Type, RelatedPaymentID, RelatedInvoiceID, Note, CreatedBy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      CustomerID || null,
      AgencyID || null,
      Amount,
      Type,
      RelatedPaymentID || null,
      RelatedInvoiceID || null,
      Note || null,
      CreatedBy
    ];
    const [result] = await activeConn.query(query, params);
    return result.insertId;
  }
};

module.exports = CreditLedgerModel;
