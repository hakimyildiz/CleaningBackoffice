const db = require('../../config/db');

const CustomerModel = {
  findList: async ({ limit, offset, search, isActive, sortBy, sortOrder }) => {
    let query = `
      FROM Customer c
      JOIN Person p ON c.PersonID = p.PersonID
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
      query += ` AND c.IsActive = ?`;
      params.push(isActive === 'true' || isActive === true ? 1 : 0);
    }

    // Get Total Count
    const countQuery = `SELECT COUNT(*) AS total ${query}`;
    const [countRows] = await db.query(countQuery, params);
    const total = countRows[0].total;

    // Sorting Whitelist
    const allowedSortFields = {
      'SureName': 'p.SureName',
      'FirstName': 'p.FirstName',
      'Email': 'p.Email',
      'Rate': 'c.Rate',
      'IsActive': 'c.IsActive'
    };
    const sortColumn = allowedSortFields[sortBy] || 'p.SureName';
    const order = sortOrder && sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Get Data (including COALESCE expression for EffectiveRate)
    const dataQuery = `
      SELECT 
        c.CustomerID, c.WorkPhone, c.Occupation, c.RegisterDate, c.Rate, c.IsActive,
        c.BankType, c.BankName, c.SortCode, c.AccountNo, c.IBAN,
        COALESCE(c.Rate, (SELECT Rate FROM DefaultRate ORDER BY ValidFrom DESC LIMIT 1)) AS EffectiveRate,
        p.PersonID, p.Title, p.FirstName, p.SureName, p.Email, p.HomePhone, p.MobilePhone, p.BirthDate, p.Gender, p.AddressLine, p.City, p.PostCode, p.Note,
        u.UserID, u.Username, u.Role, u.LastLoginAt
      ${query}
      ORDER BY ${sortColumn} ${order}
      LIMIT ? OFFSET ?
    `;
    
    const dataParams = [...params, parseInt(limit, 10), parseInt(offset, 10)];
    const [rows] = await db.query(dataQuery, dataParams);

    return { rows, total };
  },

  findById: async (customerId) => {
    const query = `
      SELECT 
        c.CustomerID, c.WorkPhone, c.Occupation, c.RegisterDate, c.Rate, c.IsActive,
        c.BankType, c.BankName, c.SortCode, c.AccountNo, c.IBAN,
        COALESCE(c.Rate, (SELECT Rate FROM DefaultRate ORDER BY ValidFrom DESC LIMIT 1)) AS EffectiveRate,
        p.PersonID, p.Title, p.FirstName, p.SureName, p.Email, p.HomePhone, p.MobilePhone, p.BirthDate, p.Gender, p.AddressLine, p.City, p.PostCode, p.Note,
        u.UserID, u.Username, u.Role, u.LastLoginAt
      FROM Customer c
      JOIN Person p ON c.PersonID = p.PersonID
      JOIN User u ON u.PersonID = p.PersonID
      WHERE c.CustomerID = ?
    `;
    const [rows] = await db.query(query, [customerId]);
    return rows[0] || null;
  },

  create: async ({ personData, customerData, userData }, connection) => {
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

    // 2. Insert into Customer using PersonID
    const customerQuery = `
      INSERT INTO Customer (PersonID, WorkPhone, Occupation, RegisterDate, Rate, BankType, BankName, SortCode, AccountNo, IBAN, IsActive)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const customerParams = [
      personId, customerData.WorkPhone, customerData.Occupation, customerData.RegisterDate || null,
      customerData.Rate || null, customerData.BankType, customerData.BankName, customerData.SortCode,
      customerData.AccountNo, customerData.IBAN, 1
    ];
    const [customerResult] = await activeConn.query(customerQuery, customerParams);
    const customerId = customerResult.insertId;

    // 3. Insert into User using PersonID (Role is 'customer')
    const userQuery = `
      INSERT INTO User (PersonID, Username, Password, Role, IsActive)
      VALUES (?, ?, ?, ?, ?)
    `;
    const userParams = [
      personId, userData.Username, userData.Password, 'customer', 1
    ];
    await activeConn.query(userQuery, userParams);

    return { customerId, personId };
  },

  update: async (customerId, { personData, customerData }, connection) => {
    const activeConn = connection || db;

    // 1. Get PersonID
    const getPersonQuery = 'SELECT PersonID FROM Customer WHERE CustomerID = ?';
    const [rows] = await activeConn.query(getPersonQuery, [customerId]);
    if (rows.length === 0) {
      throw new Error('Customer record not found.');
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

    // 3. Update Customer
    const customerUpdateQuery = `
      UPDATE Customer SET 
        WorkPhone = ?, Occupation = ?, RegisterDate = ?, Rate = ?, BankType = ?, BankName = ?, 
        SortCode = ?, AccountNo = ?, IBAN = ?
      WHERE CustomerID = ?
    `;
    const customerParams = [
      customerData.WorkPhone, customerData.Occupation, customerData.RegisterDate || null,
      customerData.Rate || null, customerData.BankType, customerData.BankName, customerData.SortCode,
      customerData.AccountNo, customerData.IBAN, customerId
    ];
    await activeConn.query(customerUpdateQuery, customerParams);

    return { customerId, personId };
  },

  updateStatus: async (customerId, isActive, connection) => {
    const activeConn = connection || db;
    const activeStatus = isActive ? 1 : 0;

    // 1. Get PersonID
    const getPersonQuery = 'SELECT PersonID FROM Customer WHERE CustomerID = ?';
    const [rows] = await activeConn.query(getPersonQuery, [customerId]);
    if (rows.length === 0) {
      throw new Error('Customer record not found.');
    }
    const personId = rows[0].PersonID;

    // 2. Update Customer
    await activeConn.query('UPDATE Customer SET IsActive = ? WHERE CustomerID = ?', [activeStatus, customerId]);

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

module.exports = CustomerModel;
