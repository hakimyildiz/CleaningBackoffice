const db = require('../../config/db');

const EmployeeModel = {
  findList: async ({ limit, offset, search, isActive, role, sortBy, sortOrder }) => {
    let query = `
      FROM Employee e
      JOIN Person p ON e.PersonID = p.PersonID
      JOIN User u ON u.PersonID = p.PersonID
      WHERE 1=1
    `;
    const params = [];

    // Search filter (FirstName, SureName, Email, MobilePhone)
    if (search) {
      query += ` AND (p.FirstName LIKE ? OR p.SureName LIKE ? OR p.Email LIKE ? OR p.MobilePhone LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    // IsActive filter
    if (isActive !== undefined && isActive !== null) {
      query += ` AND e.IsActive = ?`;
      params.push(isActive === 'true' || isActive === true ? 1 : 0);
    }

    // Role filter
    if (role) {
      query += ` AND u.Role = ?`;
      params.push(role);
    }

    // Get Total Count
    const countQuery = `SELECT COUNT(*) AS total ${query}`;
    const [countRows] = await db.query(countQuery, params);
    const total = countRows[0].total;

    // Sorting Whitelist to protect against SQL injection
    const allowedSortFields = {
      'SureName': 'p.SureName',
      'FirstName': 'p.FirstName',
      'Email': 'p.Email',
      'Rate': 'e.Rate',
      'Role': 'u.Role',
      'IsActive': 'e.IsActive'
    };
    const sortColumn = allowedSortFields[sortBy] || 'p.SureName';
    const order = sortOrder && sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Get Data
    const dataQuery = `
      SELECT 
        e.EmployeeID, e.WorkPhone, e.RegisterDate, e.NINo, e.Rate, e.IsActive,
        e.BankType, e.BankName, e.SortCode, e.AccountNo, e.IBAN,
        p.PersonID, p.Title, p.FirstName, p.SureName, p.Email, p.HomePhone, p.MobilePhone, p.BirthDate, p.Gender, p.AddressLine, p.City, p.PostCode, p.Note,
        u.UserID, u.Username, u.Role, u.LastLoginAt
      ${query}
      ORDER BY ${sortColumn} ${order}
      LIMIT ? OFFSET ?
    `;
    
    // Add pagination params (must be integers, not strings)
    const dataParams = [...params, parseInt(limit, 10), parseInt(offset, 10)];
    const [rows] = await db.query(dataQuery, dataParams);

    return { rows, total };
  },

  findById: async (employeeId) => {
    const query = `
      SELECT 
        e.EmployeeID, e.WorkPhone, e.RegisterDate, e.NINo, e.Rate, e.IsActive,
        e.BankType, e.BankName, e.SortCode, e.AccountNo, e.IBAN,
        p.PersonID, p.Title, p.FirstName, p.SureName, p.Email, p.HomePhone, p.MobilePhone, p.BirthDate, p.Gender, p.AddressLine, p.City, p.PostCode, p.Note,
        u.UserID, u.Username, u.Role, u.LastLoginAt
      FROM Employee e
      JOIN Person p ON e.PersonID = p.PersonID
      JOIN User u ON u.PersonID = p.PersonID
      WHERE e.EmployeeID = ?
    `;
    const [rows] = await db.query(query, [employeeId]);
    return rows[0] || null;
  },

  create: async ({ personData, employeeData, userData }, connection) => {
    const activeConn = connection || db;

    // 1. Insert into Person
    const personQuery = `
      INSERT INTO Person (Title, FirstName, SureName, Email, HomePhone, MobilePhone, BirthDate, Gender, AddressLine, City, PostCode, Note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const personParams = [
      personData.Title, personData.FirstName, personData.SureName, personData.Email,
      personData.HomePhone, personData.MobilePhone, personData.BirthDate || null, personData.Gender,
      personData.AddressLine, personData.City, personData.PostCode, personData.Note
    ];
    const [personResult] = await activeConn.query(personQuery, personParams);
    const personId = personResult.insertId;

    // 2. Insert into Employee using new PersonID
    const employeeQuery = `
      INSERT INTO Employee (PersonID, WorkPhone, RegisterDate, NINo, BankType, BankName, SortCode, AccountNo, IBAN, Rate, IsActive)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const employeeParams = [
      personId, employeeData.WorkPhone, employeeData.RegisterDate || null, employeeData.NINo,
      employeeData.BankType, employeeData.BankName, employeeData.SortCode, employeeData.AccountNo,
      employeeData.IBAN, employeeData.Rate || null, 1
    ];
    const [employeeResult] = await activeConn.query(employeeQuery, employeeParams);
    const employeeId = employeeResult.insertId;

    // 3. Insert into User using new PersonID
    const userQuery = `
      INSERT INTO User (PersonID, Username, Password, Role, IsActive)
      VALUES (?, ?, ?, ?, ?)
    `;
    const userParams = [
      personId, userData.Username, userData.Password, userData.Role, 1
    ];
    await activeConn.query(userQuery, userParams);

    return { employeeId, personId };
  },

  update: async (employeeId, { personData, employeeData }, connection) => {
    const activeConn = connection || db;

    // 1. Get PersonID of the employee
    const getPersonQuery = 'SELECT PersonID FROM Employee WHERE EmployeeID = ?';
    const [rows] = await activeConn.query(getPersonQuery, [employeeId]);
    if (rows.length === 0) {
      throw new Error('Employee record not found.');
    }
    const personId = rows[0].PersonID;

    // 2. Update Person
    const personUpdateQuery = `
      UPDATE Person SET 
        Title = ?, FirstName = ?, SureName = ?, Email = ?, HomePhone = ?, MobilePhone = ?, 
        BirthDate = ?, Gender = ?, AddressLine = ?, City = ?, PostCode = ?, Note = ?
      WHERE PersonID = ?
    `;
    const personParams = [
      personData.Title, personData.FirstName, personData.SureName, personData.Email,
      personData.HomePhone, personData.MobilePhone, personData.BirthDate || null, personData.Gender,
      personData.AddressLine, personData.City, personData.PostCode, personData.Note,
      personId
    ];
    await activeConn.query(personUpdateQuery, personParams);

    // 3. Update Employee
    const employeeUpdateQuery = `
      UPDATE Employee SET 
        WorkPhone = ?, RegisterDate = ?, NINo = ?, BankType = ?, BankName = ?, 
        SortCode = ?, AccountNo = ?, IBAN = ?, Rate = ?
      WHERE EmployeeID = ?
    `;
    const employeeParams = [
      employeeData.WorkPhone, employeeData.RegisterDate || null, employeeData.NINo, employeeData.BankType,
      employeeData.BankName, employeeData.SortCode, employeeData.AccountNo, employeeData.IBAN,
      employeeData.Rate || null, employeeId
    ];
    await activeConn.query(employeeUpdateQuery, employeeParams);

    return { employeeId, personId };
  },

  updateStatus: async (employeeId, isActive, connection) => {
    const activeConn = connection || db;
    const activeStatus = isActive ? 1 : 0;

    // 1. Get PersonID
    const getPersonQuery = 'SELECT PersonID FROM Employee WHERE EmployeeID = ?';
    const [rows] = await activeConn.query(getPersonQuery, [employeeId]);
    if (rows.length === 0) {
      throw new Error('Employee record not found.');
    }
    const personId = rows[0].PersonID;

    // 2. Update Employee
    await activeConn.query('UPDATE Employee SET IsActive = ? WHERE EmployeeID = ?', [activeStatus, employeeId]);

    // 3. Update User
    await activeConn.query('UPDATE User SET IsActive = ? WHERE PersonID = ?', [activeStatus, personId]);
  },

  checkEmailExists: async (email, excludePersonId = null) => {
    let query = 'SELECT PersonID FROM Person WHERE Email = ?';
    const params = [email];
    if (excludePersonId) {
      query += ' AND PersonID != ?';
      params.push(excludePersonId);
    }
    const [rows] = await db.query(query, params);
    return rows.length > 0;
  },

  checkUsernameExists: async (username) => {
    const query = 'SELECT UserID FROM User WHERE Username = ?';
    const [rows] = await db.query(query, [username]);
    return rows.length > 0;
  }
};

module.exports = EmployeeModel;
