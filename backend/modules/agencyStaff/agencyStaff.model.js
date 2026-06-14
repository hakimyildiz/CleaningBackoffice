const db = require('../../config/db');

const AgencyStaffModel = {
  findList: async ({ limit, offset, search, isActive, agencyId, role, sortBy, sortOrder }) => {
    let query = `
      FROM AgencyStaff ast
      JOIN Person p ON ast.PersonID = p.PersonID
      JOIN User u ON u.PersonID = p.PersonID
      JOIN Agency a ON ast.AgencyID = a.AgencyID
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
      query += ` AND ast.IsActive = ?`;
      params.push(isActive === 'true' || isActive === true ? 1 : 0);
    }

    // Agency ID filter
    if (agencyId) {
      query += ` AND ast.AgencyID = ?`;
      params.push(parseInt(agencyId, 10));
    }

    // Role filter
    if (role) {
      query += ` AND ast.Role = ?`;
      params.push(role);
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
      'AgencyName': 'a.Name',
      'IsActive': 'ast.IsActive'
    };
    const sortColumn = allowedSortFields[sortBy] || 'p.SureName';
    const order = sortOrder && sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Get Data
    const dataQuery = `
      SELECT 
        ast.AgencyStaffID, ast.AgencyID, ast.WorkPhone, ast.RegisterDate, ast.AgencyCode, ast.Role, ast.IsActive, ast.Note AS StaffNote,
        a.Name AS AgencyName,
        p.PersonID, p.Title, p.FirstName, p.SureName, p.Email, p.HomePhone, p.MobilePhone, p.BirthDate, p.Gender, p.AddressLine, p.City, p.PostCode, p.Note,
        u.UserID, u.Username, u.Role AS UserRole, u.LastLoginAt
      ${query}
      ORDER BY ${sortColumn} ${order}
      LIMIT ? OFFSET ?
    `;
    
    const dataParams = [...params, parseInt(limit, 10), parseInt(offset, 10)];
    const [rows] = await db.query(dataQuery, dataParams);

    return { rows, total };
  },

  findById: async (agencyStaffId) => {
    const query = `
      SELECT 
        ast.AgencyStaffID, ast.AgencyID, ast.WorkPhone, ast.RegisterDate, ast.AgencyCode, ast.Role, ast.IsActive, ast.Note AS StaffNote,
        a.Name AS AgencyName,
        p.PersonID, p.Title, p.FirstName, p.SureName, p.Email, p.HomePhone, p.MobilePhone, p.BirthDate, p.Gender, p.AddressLine, p.City, p.PostCode, p.Note,
        u.UserID, u.Username, u.Role AS UserRole, u.LastLoginAt
      FROM AgencyStaff ast
      JOIN Person p ON ast.PersonID = p.PersonID
      JOIN User u ON u.PersonID = p.PersonID
      JOIN Agency a ON ast.AgencyID = a.AgencyID
      WHERE ast.AgencyStaffID = ?
    `;
    const [rows] = await db.query(query, [agencyStaffId]);
    return rows[0] || null;
  },

  create: async ({ personData, agencyStaffData, userData }, connection) => {
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

    // 2. Insert into AgencyStaff using PersonID
    const staffQuery = `
      INSERT INTO AgencyStaff (AgencyID, PersonID, WorkPhone, RegisterDate, AgencyCode, Role, IsActive, Note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const staffParams = [
      agencyStaffData.AgencyID, personId, agencyStaffData.WorkPhone, agencyStaffData.RegisterDate || null,
      agencyStaffData.AgencyCode, agencyStaffData.Role, 1, agencyStaffData.Note
    ];
    const [staffResult] = await activeConn.query(staffQuery, staffParams);
    const agencyStaffId = staffResult.insertId;

    // 3. Insert into User using PersonID (Role is the agency role)
    const userQuery = `
      INSERT INTO User (PersonID, Username, Password, Role, IsActive)
      VALUES (?, ?, ?, ?, ?)
    `;
    const userParams = [
      personId, userData.Username, userData.Password, userData.Role, 1
    ];
    await activeConn.query(userQuery, userParams);

    return { agencyStaffId, personId };
  },

  update: async (agencyStaffId, { personData, agencyStaffData }, connection) => {
    const activeConn = connection || db;

    // 1. Get PersonID
    const getPersonQuery = 'SELECT PersonID FROM AgencyStaff WHERE AgencyStaffID = ?';
    const [rows] = await activeConn.query(getPersonQuery, [agencyStaffId]);
    if (rows.length === 0) {
      throw new Error('Agency staff record not found.');
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

    // 3. Update AgencyStaff
    const staffUpdateQuery = `
      UPDATE AgencyStaff SET 
        AgencyID = ?, WorkPhone = ?, RegisterDate = ?, AgencyCode = ?, Role = ?, Note = ?
      WHERE AgencyStaffID = ?
    `;
    const staffParams = [
      agencyStaffData.AgencyID, agencyStaffData.WorkPhone, agencyStaffData.RegisterDate || null,
      agencyStaffData.AgencyCode, agencyStaffData.Role, agencyStaffData.Note, agencyStaffId
    ];
    await activeConn.query(staffUpdateQuery, staffParams);

    return { agencyStaffId, personId };
  },

  updateStatus: async (agencyStaffId, isActive, connection) => {
    const activeConn = connection || db;
    const activeStatus = isActive ? 1 : 0;

    // 1. Get PersonID
    const getPersonQuery = 'SELECT PersonID FROM AgencyStaff WHERE AgencyStaffID = ?';
    const [rows] = await activeConn.query(getPersonQuery, [agencyStaffId]);
    if (rows.length === 0) {
      throw new Error('Agency staff record not found.');
    }
    const personId = rows[0].PersonID;

    // 2. Update AgencyStaff
    await activeConn.query('UPDATE AgencyStaff SET IsActive = ? WHERE AgencyStaffID = ?', [activeStatus, agencyStaffId]);

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

module.exports = AgencyStaffModel;
