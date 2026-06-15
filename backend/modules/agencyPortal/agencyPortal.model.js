const db = require('../../config/db');

const AgencyPortalModel = {
  /**
   * Find property count for agency.
   */
  getPropertyCount: async (agencyId, agencyStaffId, role) => {
    let query = 'SELECT COUNT(*) AS count FROM Service s WHERE s.AgencyID = ? AND s.IsActive = 1';
    const params = [agencyId];

    if (role === 'agency_staff') {
      query += ' AND s.AgencyStaffID = ?';
      params.push(agencyStaffId);
    }

    const [rows] = await db.query(query, params);
    return rows[0].count || 0;
  },

  /**
   * Get pending requests count submitted by this agency's staff.
   */
  getPendingRequestsCount: async (agencyId, agencyStaffId, role) => {
    let query = `
      SELECT COUNT(*) AS count 
      FROM ChangeRequest cr
      JOIN Service s ON cr.ServiceID = s.ServiceID
      WHERE s.AgencyID = ? AND cr.Status = 'pending'
    `;
    const params = [agencyId];

    if (role === 'agency_staff') {
      query += ' AND s.AgencyStaffID = ?';
      params.push(agencyStaffId);
    }

    const [rows] = await db.query(query, params);
    return rows[0].count || 0;
  },

  /**
   * Get recent schedule entries (last 5) across all agency properties.
   */
  findRecentActivity: async (agencyId, agencyStaffId, role) => {
    let query = `
      FROM ServiceRecord sr
      JOIN Service s ON sr.ServiceID = s.ServiceID
      WHERE s.AgencyID = ?
    `;
    const params = [agencyId];

    if (role === 'agency_staff') {
      query += ' AND s.AgencyStaffID = ?';
      params.push(agencyStaffId);
    }

    const fullQuery = `
      SELECT sr.*, s.AddressLine, s.City,
             (SELECT GROUP_CONCAT(CONCAT(p.FirstName, ' ', p.SureName) SEPARATOR ', ')
              FROM ServiceRecordCleaner src
              JOIN Employee e ON src.EmployeeID = e.EmployeeID
              JOIN Person p ON e.PersonID = p.PersonID
              WHERE src.ServiceRecordID = sr.ServiceRecordID) AS AssignedCleaners
      ${query}
      ORDER BY sr.ScheduledDate DESC, sr.ScheduledStart DESC
      LIMIT 5
    `;

    const [rows] = await db.query(fullQuery, params);
    return rows;
  },

  /**
   * Find properties (services) belonging to the agency.
   */
  findProperties: async (agencyId, agencyStaffId, role) => {
    let query = `
      SELECT s.*, 
             c_p.FirstName AS CustomerFirstName, c_p.SureName AS CustomerSureName,
             ast_p.FirstName AS StaffFirstName, ast_p.SureName AS StaffSureName,
             ss.Frequency, ss.DayOfWeek, ss.StartTime,
             (SELECT MIN(sr.ScheduledDate) FROM ServiceRecord sr WHERE sr.ServiceID = s.ServiceID AND sr.Status = 'scheduled' AND sr.ScheduledDate >= CURDATE()) AS NextCleaningDate,
             (SELECT sr.Status FROM ServiceRecord sr WHERE sr.ServiceID = s.ServiceID AND sr.Status = 'scheduled' AND sr.ScheduledDate >= CURDATE() ORDER BY sr.ScheduledDate ASC LIMIT 1) AS NextCleaningStatus
      FROM Service s
      LEFT JOIN Customer c ON s.CustomerID = c.CustomerID
      LEFT JOIN Person c_p ON c.PersonID = c_p.PersonID
      LEFT JOIN AgencyStaff ast ON s.AgencyStaffID = ast.AgencyStaffID
      LEFT JOIN Person ast_p ON ast.PersonID = ast_p.PersonID
      LEFT JOIN ServiceSchedule ss ON s.ServiceID = ss.ServiceID AND ss.IsActive = 1
      WHERE s.AgencyID = ? AND s.IsActive = 1
    `;
    const params = [agencyId];

    if (role === 'agency_staff') {
      query += ' AND s.AgencyStaffID = ?';
      params.push(agencyStaffId);
    }

    query += ' ORDER BY s.AddressLine ASC';

    const [rows] = await db.query(query, params);
    return rows;
  },

  /**
   * Find properties' last 3 service records (for expand/details).
   */
  findPropertyLastRecords: async (serviceId) => {
    const query = `
      SELECT ServiceRecordID, ScheduledDate, Status, ActualHours, EstimatedHours
      FROM ServiceRecord
      WHERE ServiceID = ?
      ORDER BY ScheduledDate DESC
      LIMIT 3
    `;
    const [rows] = await db.query(query, [serviceId]);
    return rows;
  },

  /**
   * Get schedule across all agency properties.
   */
  findSchedule: async (agencyId, agencyStaffId, role) => {
    let query = `
      SELECT sr.*, s.AddressLine, s.City, s.PropertyType, s.AgencyStaffID,
             ast_p.FirstName AS StaffFirstName, ast_p.SureName AS StaffSureName,
             (SELECT GROUP_CONCAT(CONCAT(p.FirstName, ' ', p.SureName) SEPARATOR ', ')
              FROM ServiceRecordCleaner src
              JOIN Employee e ON src.EmployeeID = e.EmployeeID
              JOIN Person p ON e.PersonID = p.PersonID
              WHERE src.ServiceRecordID = sr.ServiceRecordID) AS AssignedCleaners
      FROM ServiceRecord sr
      JOIN Service s ON sr.ServiceID = s.ServiceID
      LEFT JOIN AgencyStaff ast ON s.AgencyStaffID = ast.AgencyStaffID
      LEFT JOIN Person ast_p ON ast.PersonID = ast_p.PersonID
      WHERE s.AgencyID = ? AND sr.ScheduledDate >= CURDATE()
    `;
    const params = [agencyId];

    if (role === 'agency_staff') {
      query += ' AND s.AgencyStaffID = ?';
      params.push(agencyStaffId);
    }

    query += ' ORDER BY sr.ScheduledDate ASC, sr.ScheduledStart ASC';

    const [rows] = await db.query(query, params);
    return rows;
  },

  /**
   * Get all invoices for the agency (paginated).
   */
  findInvoices: async (agencyId, limit = 10, offset = 0) => {
    const countQuery = `
      SELECT COUNT(*) AS total 
      FROM Invoice i
      JOIN ServiceRecord sr ON i.ServiceRecordID = sr.ServiceRecordID
      JOIN Service s ON sr.ServiceID = s.ServiceID
      WHERE s.AgencyID = ?
    `;
    const [countRows] = await db.query(countQuery, [agencyId]);
    const total = countRows[0].total;

    const dataQuery = `
      SELECT i.*, sr.ScheduledDate, s.AddressLine, s.City
      FROM Invoice i
      JOIN ServiceRecord sr ON i.ServiceRecordID = sr.ServiceRecordID
      JOIN Service s ON sr.ServiceID = s.ServiceID
      WHERE s.AgencyID = ?
      ORDER BY i.CreatedAt DESC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await db.query(dataQuery, [agencyId, parseInt(limit, 10), parseInt(offset, 10)]);
    return { rows, total };
  },

  /**
   * Get single invoice details.
   */
  findInvoiceById: async (agencyId, invoiceId) => {
    const query = `
      SELECT i.*, 
             sr.ScheduledDate, sr.ScheduledStart, sr.EstimatedHours, sr.ActualHours,
             s.AddressLine, s.City, s.PostCode, s.Rate AS BaseRate
      FROM Invoice i
      JOIN ServiceRecord sr ON i.ServiceRecordID = sr.ServiceRecordID
      JOIN Service s ON sr.ServiceID = s.ServiceID
      WHERE s.AgencyID = ? AND i.InvoiceID = ?
    `;
    const [rows] = await db.query(query, [agencyId, invoiceId]);
    return rows[0] || null;
  },

  /**
   * Find payments recorded against an invoice.
   */
  findPaymentsForInvoice: async (invoiceId) => {
    const query = `
      SELECT PaymentID, Amount, PaidAt, Method, Reference, Note
      FROM Payment
      WHERE InvoiceID = ?
      ORDER BY PaidAt DESC
    `;
    const [rows] = await db.query(query, [invoiceId]);
    return rows;
  },

  /**
   * Get current credit/debt balance from ledger.
   */
  findCreditLedgerSum: async (agencyId) => {
    const query = 'SELECT COALESCE(SUM(Amount), 0) AS balance FROM CreditLedger WHERE AgencyID = ?';
    const [rows] = await db.query(query, [agencyId]);
    return parseFloat(rows[0].balance || 0);
  },

  /**
   * Get open debt total from outstanding invoices.
   */
  findOpenInvoiceDebt: async (agencyId) => {
    const query = `
      SELECT COALESCE(SUM(RemainingAmount), 0) AS openDebt 
      FROM Invoice
      WHERE AgencyID = ?
        AND Status IN ('sent', 'partially_paid', 'overdue')
    `;
    const [rows] = await db.query(query, [agencyId]);
    return parseFloat(rows[0].openDebt || 0);
  },

  /**
   * Find Service details to verify ownership and extract details.
   */
  findServiceById: async (agencyId, serviceId) => {
    const query = `
      SELECT s.* 
      FROM Service s
      WHERE s.AgencyID = ? AND s.ServiceID = ? AND s.IsActive = 1
    `;
    const [rows] = await db.query(query, [agencyId, serviceId]);
    return rows[0] || null;
  },

  /**
   * Find ServiceRecord details to verify ownership and extract details.
   */
  findServiceRecordById: async (agencyId, serviceRecordId) => {
    const query = `
      SELECT sr.*, s.CustomBufferHours, s.ServiceID
      FROM ServiceRecord sr
      JOIN Service s ON sr.ServiceID = s.ServiceID
      WHERE s.AgencyID = ? AND sr.ServiceRecordID = ?
    `;
    const [rows] = await db.query(query, [agencyId, serviceRecordId]);
    return rows[0] || null;
  },

  /**
   * Insert change request.
   */
  insertChangeRequest: async ({ ServiceRecordID, ServiceID, ServiceScheduleID, RequestedBy, Type, RequestedValue, Note }) => {
    const query = `
      INSERT INTO ChangeRequest (ServiceRecordID, ServiceID, ServiceScheduleID, RequestedBy, Type, RequestedValue, Note, Status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `;
    const [result] = await db.query(query, [
      ServiceRecordID || null,
      ServiceID || null,
      ServiceScheduleID || null,
      RequestedBy,
      Type,
      typeof RequestedValue === 'object' ? JSON.stringify(RequestedValue) : (RequestedValue || null),
      Note || null
    ]);
    return result.insertId;
  },

  /**
   * Get requests submitted by the agency's users.
   */
  findRequests: async (agencyId, agencyStaffId, role) => {
    let query = `
      SELECT cr.*, 
             s.AddressLine, s.City,
             req_p.FirstName AS RequestedByFirstName, req_p.SureName AS RequestedBySureName,
             rev_p.FirstName AS ReviewedByFirstName, rev_p.SureName AS ReviewedBySureName
      FROM ChangeRequest cr
      JOIN Service s ON cr.ServiceID = s.ServiceID
      LEFT JOIN User req_u ON cr.RequestedBy = req_u.UserID
      LEFT JOIN Person req_p ON req_u.PersonID = req_p.PersonID
      LEFT JOIN User rev_u ON cr.ReviewedBy = rev_u.UserID
      LEFT JOIN Person rev_p ON rev_u.PersonID = rev_p.PersonID
      WHERE s.AgencyID = ?
    `;
    const params = [agencyId];

    if (role === 'agency_staff') {
      query += ' AND s.AgencyStaffID = ?';
      params.push(agencyStaffId);
    }

    query += ' ORDER BY cr.CreatedAt DESC';

    const [rows] = await db.query(query, params);
    return rows;
  },

  /**
   * Get staff assignments mapping (agency_manager only).
   */
  findStaffAssignments: async (agencyId) => {
    const query = `
      SELECT ast.AgencyStaffID, p.FirstName, p.SureName, ast.Role,
             s.ServiceID, s.AddressLine, s.City, s.PropertyType
      FROM AgencyStaff ast
      JOIN Person p ON ast.PersonID = p.PersonID
      LEFT JOIN Service s ON s.AgencyStaffID = ast.AgencyStaffID AND s.IsActive = 1
      WHERE ast.AgencyID = ? AND ast.IsActive = 1
      ORDER BY p.FirstName ASC, p.SureName ASC
    `;
    const [rows] = await db.query(query, [agencyId]);
    return rows;
  }
};

module.exports = AgencyPortalModel;
