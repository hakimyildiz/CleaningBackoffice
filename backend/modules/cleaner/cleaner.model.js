const db = require('../../config/db');

const CleanerModel = {
  getEmployeeIdByPersonId: async (personId) => {
    const query = 'SELECT EmployeeID FROM Employee WHERE PersonID = ?';
    const [rows] = await db.query(query, [personId]);
    return rows[0] ? rows[0].EmployeeID : null;
  },

  findPastJobs: async (employeeId) => {
    const query = `
      SELECT sr.*, s.RefNo, s.PropertyType, s.AddressLine AS ServiceAddressLine, s.City AS ServiceCity, s.PostCode AS ServicePostCode,
             c_p.FirstName AS CustomerFirstName, c_p.SureName AS CustomerSureName,
             a.Name AS AgencyName
      FROM ServiceRecord sr
      JOIN Service s ON sr.ServiceID = s.ServiceID
      LEFT JOIN Customer c ON s.CustomerID = c.CustomerID
      LEFT JOIN Person c_p ON c.PersonID = c_p.PersonID
      LEFT JOIN Agency a ON s.AgencyID = a.AgencyID
      WHERE (
        s.ServiceID IN (
          SELECT ss.ServiceID 
          FROM ServiceSchedule ss 
          JOIN ServiceScheduleEmployee sse ON ss.ServiceScheduleID = sse.ServiceScheduleID 
          WHERE sse.EmployeeID = ?
        ) OR sr.ServiceRecordID IN (
          SELECT src.ServiceRecordID 
          FROM ServiceRecordCleaner src 
          WHERE src.EmployeeID = ?
        )
      )
      AND sr.Status IN ('completed', 'missed', 'cancelled')
      ORDER BY sr.ScheduledDate DESC, sr.ScheduledStart DESC
      LIMIT 5
    `;
    const [rows] = await db.query(query, [employeeId, employeeId]);
    return rows;
  },

  findTodayJobs: async (employeeId) => {
    const query = `
      SELECT sr.*, s.RefNo, s.PropertyType, s.AddressLine AS ServiceAddressLine, s.City AS ServiceCity, s.PostCode AS ServicePostCode,
             c_p.FirstName AS CustomerFirstName, c_p.SureName AS CustomerSureName,
             a.Name AS AgencyName,
             EXISTS (
               SELECT 1 FROM ServiceRecordCleaner src 
               WHERE src.ServiceRecordID = sr.ServiceRecordID 
                 AND src.EmployeeID = ? 
                 AND src.CheckOut IS NULL
             ) AS hasActiveRecord,
             (
               SELECT src.CheckIn FROM ServiceRecordCleaner src 
               WHERE src.ServiceRecordID = sr.ServiceRecordID 
                 AND src.EmployeeID = ? 
                 AND src.CheckOut IS NULL
               LIMIT 1
             ) AS checkInTime,
             (
               SELECT src.CheckOut FROM ServiceRecordCleaner src 
               WHERE src.ServiceRecordID = sr.ServiceRecordID 
                 AND src.EmployeeID = ? 
               ORDER BY src.CheckIn DESC LIMIT 1
             ) AS checkOutTime
      FROM ServiceRecord sr
      JOIN Service s ON sr.ServiceID = s.ServiceID
      LEFT JOIN Customer c ON s.CustomerID = c.CustomerID
      LEFT JOIN Person c_p ON c.PersonID = c_p.PersonID
      LEFT JOIN Agency a ON s.AgencyID = a.AgencyID
      WHERE (
        s.ServiceID IN (
          SELECT ss.ServiceID 
          FROM ServiceSchedule ss 
          JOIN ServiceScheduleEmployee sse ON ss.ServiceScheduleID = sse.ServiceScheduleID 
          WHERE sse.EmployeeID = ?
        ) OR sr.ServiceRecordID IN (
          SELECT src.ServiceRecordID 
          FROM ServiceRecordCleaner src 
          WHERE src.EmployeeID = ?
        )
      )
      AND sr.ScheduledDate = CURRENT_DATE()
      ORDER BY sr.ScheduledStart ASC
    `;
    const [rows] = await db.query(query, [employeeId, employeeId, employeeId, employeeId, employeeId]);
    return rows;
  },

  findUpcomingJobs: async (employeeId) => {
    const query = `
      SELECT sr.*, s.RefNo, s.PropertyType, s.AddressLine AS ServiceAddressLine, s.City AS ServiceCity, s.PostCode AS ServicePostCode,
             c_p.FirstName AS CustomerFirstName, c_p.SureName AS CustomerSureName,
             a.Name AS AgencyName
      FROM ServiceRecord sr
      JOIN Service s ON sr.ServiceID = s.ServiceID
      LEFT JOIN Customer c ON s.CustomerID = c.CustomerID
      LEFT JOIN Person c_p ON c.PersonID = c_p.PersonID
      LEFT JOIN Agency a ON s.AgencyID = a.AgencyID
      WHERE (
        s.ServiceID IN (
          SELECT ss.ServiceID 
          FROM ServiceSchedule ss 
          JOIN ServiceScheduleEmployee sse ON ss.ServiceScheduleID = sse.ServiceScheduleID 
          WHERE sse.EmployeeID = ?
        )
      )
      AND sr.ScheduledDate > CURRENT_DATE()
      AND sr.Status = 'scheduled'
      ORDER BY sr.ScheduledDate ASC, sr.ScheduledStart ASC
      LIMIT 5
    `;
    const [rows] = await db.query(query, [employeeId]);
    return rows;
  },

  findAssignedCleaners: async (serviceId, currentEmployeeId) => {
    const query = `
      SELECT p.FirstName, p.SureName
      FROM ServiceSchedule ss
      JOIN ServiceScheduleEmployee sse ON ss.ServiceScheduleID = sse.ServiceScheduleID
      JOIN Employee e ON sse.EmployeeID = e.EmployeeID
      JOIN Person p ON e.PersonID = p.PersonID
      WHERE ss.ServiceID = ? AND sse.EmployeeID != ? AND ss.IsActive = 1
    `;
    const [rows] = await db.query(query, [serviceId, currentEmployeeId]);
    return rows;
  }
};

module.exports = CleanerModel;
