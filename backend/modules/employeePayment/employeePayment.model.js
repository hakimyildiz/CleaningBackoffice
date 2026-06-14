const db = require('../../config/db');

const EmployeePaymentModel = {
  /**
   * Find paginated list of employee payments with optional filters.
   */
  findList: async ({ limit, offset, employeeId, from, to, type }) => {
    let query = `
      FROM EmployeePayment ep
      JOIN Employee e ON ep.EmployeeID = e.EmployeeID
      JOIN Person p ON e.PersonID = p.PersonID
      LEFT JOIN User u ON ep.RecordedBy = u.UserID
      LEFT JOIN Person u_p ON u.PersonID = u_p.PersonID
      WHERE 1=1
    `;
    const params = [];

    if (employeeId) {
      query += ' AND ep.EmployeeID = ?';
      params.push(employeeId);
    }

    if (type) {
      query += ' AND ep.Type = ?';
      params.push(type);
    }

    if (from) {
      query += ' AND ep.PaidAt >= ?';
      params.push(from);
    }

    if (to) {
      query += ' AND ep.PaidAt <= ?';
      params.push(to);
    }

    // Get Total Count
    const countQuery = `SELECT COUNT(*) AS total ${query}`;
    const [countRows] = await db.query(countQuery, params);
    const total = countRows[0].total;

    // Get Data
    const dataQuery = `
      SELECT ep.*, p.FirstName AS EmployeeFirstName, p.SureName AS EmployeeSureName,
             u_p.FirstName AS RecordedByFirstName, u_p.SureName AS RecordedBySureName
      ${query}
      ORDER BY ep.PaidAt DESC, ep.CreatedAt DESC
      LIMIT ? OFFSET ?
    `;
    const dataParams = [...params, parseInt(limit, 10), parseInt(offset, 10)];
    const [rows] = await db.query(dataQuery, dataParams);

    return { rows, total };
  },

  /**
   * Find payment by ID.
   */
  findById: async (id) => {
    const query = `
      SELECT ep.*, p.FirstName AS EmployeeFirstName, p.SureName AS EmployeeSureName
      FROM EmployeePayment ep
      JOIN Employee e ON ep.EmployeeID = e.EmployeeID
      JOIN Person p ON e.PersonID = p.PersonID
      WHERE ep.EmployeePaymentID = ?
    `;
    const [rows] = await db.query(query, [id]);
    return rows[0] || null;
  },

  /**
   * Create an employee payment.
   */
  create: async ({ EmployeeID, Amount, Type, PeriodFrom, PeriodTo, PaidAt, Reference, Note, RecordedBy }, connection) => {
    const activeConn = connection || db;
    const query = `
      INSERT INTO EmployeePayment (EmployeeID, Amount, Type, PeriodFrom, PeriodTo, PaidAt, Reference, Note, RecordedBy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      EmployeeID,
      Amount,
      Type,
      PeriodFrom || null,
      PeriodTo || null,
      PaidAt || new Date(),
      Reference || null,
      Note || null,
      RecordedBy
    ];
    const [result] = await activeConn.query(query, params);
    return result.insertId;
  },

  /**
   * Delete an employee payment record.
   */
  delete: async (id, connection) => {
    const activeConn = connection || db;
    const query = 'DELETE FROM EmployeePayment WHERE EmployeePaymentID = ?';
    await activeConn.query(query, [id]);
  },

  /**
   * Get total hours and jobs worked by employees within date range.
   */
  findEmployeeEarnings: async ({ employeeId, from, to }) => {
    let query = `
      SELECT e.EmployeeID, p.FirstName AS EmployeeFirstName, p.SureName AS EmployeeSureName,
             u.Role AS EmployeeRole, e.Rate AS EmployeeRate,
             COALESCE(COUNT(CASE WHEN sr.Status = 'completed' THEN src.ServiceRecordCleanerID END), 0) AS totalJobs,
             COALESCE(SUM(CASE WHEN sr.Status = 'completed' THEN src.ActualHours END), 0) AS totalActualHours
      FROM Employee e
      JOIN Person p ON e.PersonID = p.PersonID
      JOIN User u ON p.PersonID = u.PersonID
      LEFT JOIN ServiceRecordCleaner src ON e.EmployeeID = src.EmployeeID
      LEFT JOIN ServiceRecord sr ON src.ServiceRecordID = sr.ServiceRecordID AND sr.ScheduledDate BETWEEN ? AND ?
      WHERE e.IsActive = 1
    `;
    const params = [from, to];

    if (employeeId) {
      query += ' AND e.EmployeeID = ?';
      params.push(employeeId);
    }

    query += ' GROUP BY e.EmployeeID ORDER BY p.FirstName, p.SureName';

    const [rows] = await db.query(query, params);
    return rows;
  },

  /**
   * Get already paid amount for an employee in overlapping period.
   */
  findAlreadyPaid: async (employeeId, from, to) => {
    const query = `
      SELECT COALESCE(SUM(Amount), 0) AS alreadyPaid
      FROM EmployeePayment
      WHERE EmployeeID = ?
        AND (
          (PeriodFrom <= ? AND PeriodTo >= ?)
          OR (PeriodFrom IS NULL AND PeriodTo IS NULL AND PaidAt BETWEEN ? AND ?)
        )
    `;
    // We check if either the periods overlap or (if periods are null) the payment date falls within the range
    const [rows] = await db.query(query, [employeeId, to, from, from, to]);
    return parseFloat(rows[0].alreadyPaid || 0);
  }
};

module.exports = EmployeePaymentModel;
