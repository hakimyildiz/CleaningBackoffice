const db = require('../../config/db');
const ServiceRecordModel = require('./serviceRecord.model');
const ServiceModel = require('../service/service.model');

const ServiceRecordService = {
  getServiceRecords: async (filters) => {
    const limit = parseInt(filters.limit || 20, 10);
    const page = parseInt(filters.page || 1, 10);
    const offset = (page - 1) * limit;

    const { rows, total } = await ServiceRecordModel.findList({
      limit,
      offset,
      search: filters.search,
      status: filters.status,
      customerId: filters.customerId,
      agencyId: filters.agencyId,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder
    });

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  getServiceRecordById: async (id) => {
    const record = await ServiceRecordModel.findById(id);
    if (!record) {
      const err = new Error(`ServiceRecord with ID ${id} not found.`);
      err.statusCode = 404;
      throw err;
    }

    // Load cleaners and photos
    const cleaners = await ServiceRecordModel.findCleaners(id);
    const photosQuery = 'SELECT * FROM ServicePhoto WHERE ServiceRecordID = ? ORDER BY UploadedAt ASC';
    const [photos] = await db.query(photosQuery, [id]);
    
    // Load options
    const options = await ServiceRecordModel.findOptions(id);

    // Load invoice if exists
    const invoiceQuery = 'SELECT * FROM Invoice WHERE ServiceRecordID = ?';
    const [invoices] = await db.query(invoiceQuery, [id]);

    record.cleaners = cleaners;
    record.photos = photos;
    record.options = options;
    record.invoice = invoices[0] || null;

    return record;
  },

  checkIn: async (scheduleId, lat, lng, user) => {
    // 1. Resolve employee record for logged-in user
    const [employeeRows] = await db.query('SELECT EmployeeID FROM Employee WHERE PersonID = ?', [user.personId]);
    if (!employeeRows || employeeRows.length === 0) {
      const err = new Error('You must be registered as an employee to check in to jobs.');
      err.statusCode = 403;
      throw err;
    }
    const employeeId = employeeRows[0].EmployeeID;

    // 2. Fetch target ServiceRecord (which represents the schedule occurrence in Phase 3)
    const record = await ServiceRecordModel.findById(scheduleId);
    if (!record) {
      const err = new Error(`Scheduled occurrence with ID ${scheduleId} not found.`);
      err.statusCode = 404;
      throw err;
    }

    if (record.Status !== 'scheduled') {
      const err = new Error(`This job is already ${record.Status} and cannot be checked in.`);
      err.statusCode = 400;
      throw err;
    }

    // 3. Verify that the cleaner is assigned to this service's schedule rule (ServiceSchedule)
    // Find the schedule rule for the service
    const [scheduleRows] = await db.query(
      'SELECT ServiceScheduleID FROM ServiceSchedule WHERE ServiceID = ? AND IsActive = 1 LIMIT 1',
      [record.ServiceID]
    );

    if (scheduleRows && scheduleRows.length > 0) {
      const scheduleRuleId = scheduleRows[0].ServiceScheduleID;
      const isAssigned = await ServiceRecordModel.verifyAssignment(scheduleRuleId, employeeId);
      if (!isAssigned) {
        const err = new Error('You are not assigned to this service schedule rule.');
        err.statusCode = 403;
        throw err;
      }
    }

    // 4. Concurrency check: check if cleaner is already checked in to another job
    const isBusy = await ServiceRecordModel.hasActiveJob(employeeId);
    if (isBusy) {
      const err = new Error('You already have an active job in progress. Check out first.');
      err.statusCode = 409;
      throw err;
    }

    // 5. Begin check-in transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Resolve effective rate if not already snapshot on record
      let effectiveRate = record.Rate;
      if (!effectiveRate) {
        const rateObj = await ServiceModel.resolveLiveRate(record.CustomerID, record.AgencyID);
        effectiveRate = rateObj.EffectiveRate;
      }

      // Update ServiceRecord status to in_progress
      await connection.query(
        'UPDATE ServiceRecord SET Status = "in_progress", Rate = ?, CreatedBy = ? WHERE ServiceRecordID = ?',
        [effectiveRate, user.userId, scheduleId]
      );

      // Insert check-in record in ServiceRecordCleaner
      await ServiceRecordModel.checkInCleaner({
        ServiceRecordID: scheduleId,
        EmployeeID: employeeId,
        CheckInLat: lat,
        CheckInLng: lng
      }, connection);

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

    return { serviceRecordId: scheduleId, checkedInAt: new Date() };
  },

  checkOut: async (id, { lat, lng, note, estimatedHoursOverride, photoTypes }, files, user) => {
    // 1. Resolve employee
    const [employeeRows] = await db.query('SELECT EmployeeID FROM Employee WHERE PersonID = ?', [user.personId]);
    if (!employeeRows || employeeRows.length === 0) {
      const err = new Error('Employee record not found.');
      err.statusCode = 403;
      throw err;
    }
    const employeeId = employeeRows[0].EmployeeID;

    // 2. Fetch ServiceRecord
    const record = await ServiceRecordModel.findById(id);
    if (!record) {
      const err = new Error(`ServiceRecord with ID ${id} not found.`);
      err.statusCode = 404;
      throw err;
    }

    if (record.Status !== 'in_progress') {
      const err = new Error('This job is not in progress.');
      err.statusCode = 400;
      throw err;
    }

    // 3. Fetch current open cleaner check-in
    const cleanerRecord = await ServiceRecordModel.findCleanerCheckIn(id, employeeId);
    if (!cleanerRecord) {
      const err = new Error('You are not checked in to this job.');
      err.statusCode = 403;
      throw err;
    }

    // 4. Validate photo upload requirement
    if (record.RequireCheckoutPhoto === 1 && (!files || files.length === 0)) {
      const err = new Error('At least one photo is required to check out.');
      err.statusCode = 400;
      throw err;
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    let invoiceId = null;
    let total = 0;

    try {
      // A. Save photos to ServicePhoto
      if (files && files.length > 0) {
        // Normalize photoTypes to an array if it was sent as a single string
        const typesArr = Array.isArray(photoTypes) 
          ? photoTypes 
          : (photoTypes ? [photoTypes] : []);

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const activeType = typesArr[i] || 'after';
          
          // Relative path from backend root, matching Phase 4 guidelines
          const relativePath = path.posix.join('uploads', 'Mopsy', path.relative(path.join(__dirname, '..', 'uploads', 'Mopsy'), file.path));
          await connection.query(
            `INSERT INTO ServicePhoto (ServiceRecordID, EmployeeID, PhotoType, DriveFileID, DriveURL)
             VALUES (?, ?, ?, ?, ?)`,
            [id, employeeId, activeType, relativePath, relativePath]
          );
        }
      }

      // B. Update ServiceRecordCleaner checkout details
      const checkInTime = new Date(cleanerRecord.CheckIn);
      const now = new Date();
      const actualHours = parseFloat(Math.max(0.1, (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)).toFixed(2));

      await ServiceRecordModel.checkOutCleaner({
        ServiceRecordID: id,
        EmployeeID: employeeId,
        CheckOutLat: lat,
        CheckOutLng: lng,
        ActualHours: actualHours,
        Note: note
      }, connection);

      // C. Update the main ServiceRecord actual hours and status
      const totalActualHours = await ServiceRecordModel.sumActualHours(id, connection);
      await connection.query(
        'UPDATE ServiceRecord SET Status = "completed", ActualHours = ? WHERE ServiceRecordID = ?',
        [totalActualHours, id]
      );

      // D. Generate Draft Invoice
      const resolvedRecord = await ServiceRecordModel.findById(id);
      const effectiveHours = estimatedHoursOverride 
        ? parseFloat(estimatedHoursOverride) 
        : parseFloat(resolvedRecord.EstimatedHours || 2.0);
      const serviceCharge = parseFloat(resolvedRecord.Rate || 20.00) * effectiveHours;

      // Calculate options extras charge
      const options = await ServiceRecordModel.findOptions(id);
      const extrasTotal = options
        .filter(o => o.IsChargeable === 1 || o.IsChargeable === true)
        .reduce((sum, o) => sum + parseFloat(o.Fee || 0), 0);

      total = serviceCharge + extrasTotal;

      // Unique Invoice Number format: INV-[YYYYMM]-[4-digit zero-padded seq]
      const nowDt = new Date();
      const yearStr = nowDt.getFullYear();
      const monthStr = String(nowDt.getMonth() + 1).padStart(2, '0');
      const invoicePrefix = `INV-${yearStr}${monthStr}-`;

      const [countRows] = await connection.query(
        'SELECT COUNT(*) AS count FROM Invoice WHERE InvoiceNumber LIKE ?',
        [`${invoicePrefix}%`]
      );
      const sequence = countRows[0].count + 1;
      const invoiceNumber = `${invoicePrefix}${String(sequence).padStart(4, '0')}`;

      // Set DueDate to 14 days from today
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      const [invResult] = await connection.query(
        `INSERT INTO Invoice (InvoiceNumber, ServiceRecordID, CustomerID, AgencyID, SubTotal, ExtrasTotal, Total, Status, DueDate, CreatedBy)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)`,
        [
          invoiceNumber, id, resolvedRecord.CustomerID || null, resolvedRecord.AgencyID || null,
          serviceCharge, extrasTotal, total, dueDate.toISOString().split('T')[0], user.userId
        ]
      );
      invoiceId = invResult.insertId;

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

    return { serviceRecordId: id, invoiceId, totalAmount: total };
  },

  cancelServiceRecord: async (id, user) => {
    const record = await ServiceRecordModel.findById(id);
    if (!record) {
      const err = new Error(`ServiceRecord with ID ${id} not found.`);
      err.statusCode = 404;
      throw err;
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Update record status to cancelled
      await connection.query('UPDATE ServiceRecord SET Status = "cancelled" WHERE ServiceRecordID = ?', [id]);

      // Cancel draft invoice if exists
      await connection.query('UPDATE Invoice SET Status = "cancelled" WHERE ServiceRecordID = ? AND Status = "draft"', [id]);

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

    return { success: true, message: 'ServiceRecord cancelled successfully.' };
  },

  assignCleanersToSchedule: async (scheduleId, employeeIds, user) => {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Remove existing cleaners first to prevent duplication
      await connection.query('DELETE FROM ServiceScheduleEmployee WHERE ServiceScheduleID = ?', [scheduleId]);

      // 2. Insert new assignments
      if (employeeIds && employeeIds.length > 0) {
        const values = employeeIds.map(empId => [
          parseInt(scheduleId, 10),
          parseInt(empId, 10),
          user.userId
        ]);
        await connection.query(
          'INSERT INTO ServiceScheduleEmployee (ServiceScheduleID, EmployeeID, AssignedBy) VALUES ?',
          [values]
        );
      }

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  },

  removeCleanerFromSchedule: async (scheduleId, employeeId) => {
    await db.query(
      'DELETE FROM ServiceScheduleEmployee WHERE ServiceScheduleID = ? AND EmployeeID = ?',
      [scheduleId, employeeId]
    );
  },

  getScheduleCleaners: async (scheduleId) => {
    const query = `
      SELECT sse.*, p.FirstName, p.SureName, e.EmployeeID
      FROM ServiceScheduleEmployee sse
      JOIN Employee e ON sse.EmployeeID = e.EmployeeID
      JOIN Person p ON e.PersonID = p.PersonID
      WHERE sse.ServiceScheduleID = ?
      ORDER BY p.FirstName ASC, p.SureName ASC
    `;
    const [rows] = await db.query(query, [scheduleId]);
    return rows;
  },

  addCleanerToRecord: async (recordId, employeeId, user) => {
    await ServiceRecordModel.addCleanerToRecord(recordId, employeeId, user.userId);
  },

  removeCleanerFromRecord: async (recordId, employeeId) => {
    await ServiceRecordModel.removeCleanerFromRecord(recordId, employeeId);
  }
};

module.exports = ServiceRecordService;
