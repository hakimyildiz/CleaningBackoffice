const db = require('../../config/db');

const AgencyModel = {
  findList: async ({ limit, offset, search, isActive, sortBy, sortOrder }) => {
    let query = `
      FROM Agency a
      LEFT JOIN User u ON a.PrimaryContactUserID = u.UserID
      LEFT JOIN Person p ON u.PersonID = p.PersonID
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ' AND (a.Name LIKE ? OR a.Email LIKE ? OR a.CompanyNo LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    if (isActive !== undefined && isActive !== null) {
      query += ' AND a.IsActive = ?';
      params.push(isActive === 'true' || isActive === true ? 1 : 0);
    }

    // Get Total Count
    const countQuery = `SELECT COUNT(*) AS total ${query}`;
    const [countRows] = await db.query(countQuery, params);
    const total = countRows[0].total;

    // Sorting Whitelist
    const allowedSortFields = {
      'Name': 'a.Name',
      'CompanyNo': 'a.CompanyNo',
      'Email': 'a.Email',
      'Phone': 'a.Phone',
      'IsActive': 'a.IsActive'
    };
    const sortColumn = allowedSortFields[sortBy] || 'a.Name';
    const order = sortOrder && sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Get Data
    const dataQuery = `
      SELECT a.*, 
             p.FirstName AS ContactFirstName, 
             p.SureName AS ContactSureName, 
             u.Username AS ContactUsername
      ${query}
      ORDER BY ${sortColumn} ${order}
      LIMIT ? OFFSET ?
    `;
    const dataParams = [...params, parseInt(limit, 10), parseInt(offset, 10)];
    const [rows] = await db.query(dataQuery, dataParams);

    return { rows, total };
  },

  findById: async (id) => {
    const query = `
      SELECT a.*, 
             p.FirstName AS ContactFirstName, 
             p.SureName AS ContactSureName, 
             u.Username AS ContactUsername
      FROM Agency a
      LEFT JOIN User u ON a.PrimaryContactUserID = u.UserID
      LEFT JOIN Person p ON u.PersonID = p.PersonID
      WHERE a.AgencyID = ?
    `;
    const [rows] = await db.query(query, [id]);
    return rows[0] || null;
  },

  findStaff: async (agencyId) => {
    const query = `
      SELECT asf.AgencyStaffID, asf.Role, u.UserID, u.Username, p.FirstName, p.SureName, p.Email
      FROM AgencyStaff asf
      JOIN Person p ON asf.PersonID = p.PersonID
      JOIN User u ON u.PersonID = p.PersonID
      WHERE asf.AgencyID = ? AND asf.IsActive = 1
      ORDER BY p.FirstName ASC, p.SureName ASC
    `;
    const [rows] = await db.query(query, [agencyId]);
    return rows;
  },

  verifyStaffMember: async (agencyId, userId) => {
    const query = `
      SELECT asf.AgencyStaffID
      FROM AgencyStaff asf
      JOIN User u ON asf.PersonID = u.PersonID
      WHERE asf.AgencyID = ? AND u.UserID = ?
    `;
    const [rows] = await db.query(query, [agencyId, userId]);
    return rows.length > 0;
  },

  create: async ({ Name, CompanyNo, Email, Phone, AddressLine, City, PostCode, Rate, Note, BankType, BankName, SortCode, AccountNo, IBAN }, connection) => {
    const activeConn = connection || db;
    const rateVal = Rate ? parseFloat(Rate) : null;

    const query = `
      INSERT INTO Agency (Name, CompanyNo, Email, Phone, AddressLine, City, PostCode, Rate, Note, IsActive, PrimaryContactUserID, BankType, BankName, SortCode, AccountNo, IBAN)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NULL, ?, ?, ?, ?, ?)
    `;
    const params = [
      Name, CompanyNo || null, Email || null, Phone || null, AddressLine || null, City || null, PostCode || null, rateVal, Note || null,
      BankType || null, BankName || null, SortCode || null, AccountNo || null, IBAN || null
    ];
    const [result] = await activeConn.query(query, params);
    return result.insertId;
  },

  update: async (id, { Name, CompanyNo, Email, Phone, AddressLine, City, PostCode, Rate, Note, PrimaryContactUserID, BankType, BankName, SortCode, AccountNo, IBAN }, connection) => {
    const activeConn = connection || db;
    const rateVal = Rate ? parseFloat(Rate) : null;
    const contactIdVal = PrimaryContactUserID ? parseInt(PrimaryContactUserID, 10) : null;

    const query = `
      UPDATE Agency
      SET Name = ?, CompanyNo = ?, Email = ?, Phone = ?, AddressLine = ?, City = ?, PostCode = ?, Rate = ?, Note = ?, PrimaryContactUserID = ?,
          BankType = ?, BankName = ?, SortCode = ?, AccountNo = ?, IBAN = ?
      WHERE AgencyID = ?
    `;
    const params = [
      Name, CompanyNo || null, Email || null, Phone || null, AddressLine || null, City || null, PostCode || null, rateVal, Note || null, contactIdVal,
      BankType || null, BankName || null, SortCode || null, AccountNo || null, IBAN || null, id
    ];
    await activeConn.query(query, params);
  },

  updateStatus: async (id, isActive, connection) => {
    const activeConn = connection || db;
    const statusVal = isActive ? 1 : 0;
    const query = 'UPDATE Agency SET IsActive = ? WHERE AgencyID = ?';
    await activeConn.query(query, [statusVal, id]);
  }
};

module.exports = AgencyModel;
