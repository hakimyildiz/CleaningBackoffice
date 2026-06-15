const db = require('../../config/db');

const CustomerPortalModel = {
  /**
   * Get active job in progress for the customer.
   */
  findActiveJob: async (customerId) => {
    const query = `
      SELECT sr.*, src.CheckIn, src.CheckOut, 
             s.AddressLine, s.City, s.PostCode
      FROM ServiceRecord sr
      JOIN ServiceRecordCleaner src ON sr.ServiceRecordID = src.ServiceRecordID
      JOIN Service s ON sr.ServiceID = s.ServiceID
      WHERE s.CustomerID = ?
        AND sr.Status = 'in_progress'
        AND src.CheckOut IS NULL
      LIMIT 1
    `;
    const [rows] = await db.query(query, [customerId]);
    if (rows.length === 0) return null;

    // Count how many cleaners are checked in
    const countQuery = `
      SELECT COUNT(DISTINCT EmployeeID) AS cleanerCount 
      FROM ServiceRecordCleaner 
      WHERE ServiceRecordID = ? AND CheckOut IS NULL
    `;
    const [countRows] = await db.query(countQuery, [rows[0].ServiceRecordID]);

    return {
      serviceRecordId: rows[0].ServiceRecordID,
      address: `${rows[0].AddressLine}, ${rows[0].City}`,
      checkedInAt: rows[0].CheckIn,
      cleanerCount: countRows[0].cleanerCount || 0
    };
  },

  /**
   * Check if today has a scheduled job.
   */
  findTodayScheduledJob: async (customerId) => {
    const query = `
      SELECT sr.*, s.AddressLine, s.City
      FROM ServiceRecord sr
      JOIN Service s ON sr.ServiceID = s.ServiceID
      WHERE s.CustomerID = ?
        AND sr.Status = 'scheduled'
        AND sr.ScheduledDate = CURDATE()
      ORDER BY sr.ScheduledStart ASC
      LIMIT 1
    `;
    const [rows] = await db.query(query, [customerId]);
    return rows[0] || null;
  },

  /**
   * Get next 5 upcoming scheduled jobs.
   */
  findUpcomingJobs: async (customerId) => {
    const query = `
      SELECT sr.ServiceRecordID, sr.ScheduledDate, sr.ScheduledStart, sr.EstimatedHours,
             s.ServiceID, s.AddressLine, s.City, s.PropertyType
      FROM ServiceRecord sr
      JOIN Service s ON sr.ServiceID = s.ServiceID
      WHERE s.CustomerID = ?
        AND sr.Status = 'scheduled'
        AND sr.ScheduledDate >= CURDATE()
      ORDER BY sr.ScheduledDate ASC, sr.ScheduledStart ASC
      LIMIT 5
    `;
    const [rows] = await db.query(query, [customerId]);
    return rows;
  },

  /**
   * Get all services (properties) belonging to this customer.
   */
  findServices: async (customerId) => {
    const query = `
      SELECT s.*, 
             ss.ServiceScheduleID, ss.Frequency, ss.DayOfWeek, ss.DayOfMonth, ss.StartTime, ss.EstimatedHours AS ScheduleHours
      FROM Service s
      LEFT JOIN ServiceSchedule ss ON s.ServiceID = ss.ServiceID AND ss.IsActive = 1
      WHERE s.CustomerID = ? AND s.IsActive = 1
      ORDER BY s.AddressLine ASC
    `;
    const [rows] = await db.query(query, [customerId]);
    return rows;
  },

  /**
   * Get scheduled jobs for next 30 days.
   */
  findSchedule: async (customerId, daysLimit = 30) => {
    const query = `
      SELECT sr.*, s.AddressLine, s.City, s.PropertyType
      FROM ServiceRecord sr
      JOIN Service s ON sr.ServiceID = s.ServiceID
      WHERE s.CustomerID = ?
        AND sr.ScheduledDate >= CURDATE()
        AND sr.ScheduledDate <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
      ORDER BY sr.ScheduledDate ASC, sr.ScheduledStart ASC
    `;
    const [rows] = await db.query(query, [customerId, daysLimit]);
    return rows;
  },

  /**
   * Get all invoices for the customer (paginated).
   */
  findInvoices: async (customerId, limit = 10, offset = 0) => {
    const countQuery = `
      SELECT COUNT(*) AS total 
      FROM Invoice i
      JOIN ServiceRecord sr ON i.ServiceRecordID = sr.ServiceRecordID
      JOIN Service s ON sr.ServiceID = s.ServiceID
      WHERE s.CustomerID = ?
    `;
    const [countRows] = await db.query(countQuery, [customerId]);
    const total = countRows[0].total;

    const dataQuery = `
      SELECT i.*, sr.ScheduledDate, s.AddressLine, s.City
      FROM Invoice i
      JOIN ServiceRecord sr ON i.ServiceRecordID = sr.ServiceRecordID
      JOIN Service s ON sr.ServiceID = s.ServiceID
      WHERE s.CustomerID = ?
      ORDER BY i.CreatedAt DESC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await db.query(dataQuery, [customerId, parseInt(limit, 10), parseInt(offset, 10)]);
    return { rows, total };
  },

  /**
   * Get single invoice detail.
   */
  findInvoiceById: async (customerId, invoiceId) => {
    const query = `
      SELECT i.*, 
             sr.ScheduledDate, sr.ScheduledStart, sr.EstimatedHours, sr.ActualHours,
             s.AddressLine, s.City, s.PostCode, s.Rate AS BaseRate
      FROM Invoice i
      JOIN ServiceRecord sr ON i.ServiceRecordID = sr.ServiceRecordID
      JOIN Service s ON sr.ServiceID = s.ServiceID
      WHERE s.CustomerID = ? AND i.InvoiceID = ?
    `;
    const [rows] = await db.query(query, [customerId, invoiceId]);
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
   * Find completed job after photos.
   */
  findPhotosByServiceRecord: async (customerId, serviceRecordId) => {
    const query = `
      SELECT sp.ServicePhotoID, sp.PhotoType, sp.DriveFileID, sp.DriveURL, sp.UploadedAt
      FROM ServicePhoto sp
      JOIN ServiceRecord sr ON sp.ServiceRecordID = sr.ServiceRecordID
      JOIN Service s ON sr.ServiceID = s.ServiceID
      WHERE s.CustomerID = ? 
        AND sp.ServiceRecordID = ?
        AND sp.PhotoType = 'after'
      ORDER BY sp.UploadedAt DESC
    `;
    const [rows] = await db.query(query, [customerId, serviceRecordId]);
    return rows;
  },

  /**
   * Find the last completed job with photos.
   */
  findLastCompletedJobWithPhotos: async (customerId) => {
    const query = `
      SELECT sr.ServiceRecordID, sr.ScheduledDate
      FROM ServiceRecord sr
      JOIN Service s ON sr.ServiceID = s.ServiceID
      WHERE s.CustomerID = ?
        AND sr.Status = 'completed'
      ORDER BY sr.ScheduledDate DESC
      LIMIT 1
    `;
    const [recordRows] = await db.query(query, [customerId]);
    if (recordRows.length === 0) return null;

    const record = recordRows[0];
    const photos = await CustomerPortalModel.findPhotosByServiceRecord(customerId, record.ServiceRecordID);
    if (photos.length === 0) return null;

    return {
      serviceRecordId: record.ServiceRecordID,
      scheduledDate: record.ScheduledDate,
      photos
    };
  },

  /**
   * Find ServiceRecord details to verify ownership and extract details.
   */
  findServiceRecordById: async (customerId, serviceRecordId) => {
    const query = `
      SELECT sr.*, s.CustomBufferHours, s.ServiceID
      FROM ServiceRecord sr
      JOIN Service s ON sr.ServiceID = s.ServiceID
      WHERE s.CustomerID = ? AND sr.ServiceRecordID = ?
    `;
    const [rows] = await db.query(query, [customerId, serviceRecordId]);
    return rows[0] || null;
  },

  /**
   * Verify Service belongs to customer.
   */
  findServiceById: async (customerId, serviceId) => {
    const query = `
      SELECT s.* 
      FROM Service s
      WHERE s.CustomerID = ? AND s.ServiceID = ? AND s.IsActive = 1
    `;
    const [rows] = await db.query(query, [customerId, serviceId]);
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
    const params = [
      ServiceRecordID || null,
      ServiceID || null,
      ServiceScheduleID || null,
      RequestedBy,
      Type,
      RequestedValue ? JSON.stringify(requestedValue) : null, // wait, let's keep it as JSON.stringify if it is object
      Note || null
    ];
    // Oh, wait, the controller/service passes requestedValue as object/string already, let's normalize in the service.
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
   * Get requests submitted by the customer.
   */
  findRequests: async (userId) => {
    const query = `
      SELECT cr.*, 
             s.AddressLine, s.City,
             rev_p.FirstName AS ReviewedByFirstName, rev_p.SureName AS ReviewedBySureName
      FROM ChangeRequest cr
      LEFT JOIN Service s ON cr.ServiceID = s.ServiceID
      LEFT JOIN User rev_u ON cr.ReviewedBy = rev_u.UserID
      LEFT JOIN Person rev_p ON rev_u.PersonID = rev_p.PersonID
      WHERE cr.RequestedBy = ?
      ORDER BY cr.CreatedAt DESC
    `;
    const [rows] = await db.query(query, [userId]);
    return rows;
  }
};

module.exports = CustomerPortalModel;
