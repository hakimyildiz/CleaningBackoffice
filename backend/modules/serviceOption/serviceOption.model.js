const db = require('../../config/db');

const ServiceOptionModel = {
  findActive: async () => {
    const query = 'SELECT * FROM ServiceOption WHERE IsActive = 1 ORDER BY Name ASC';
    const [rows] = await db.query(query);
    return rows;
  },

  findList: async ({ limit, offset, search, isActive, sortBy, sortOrder }) => {
    let query = 'FROM ServiceOption WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND Name LIKE ?';
      params.push(`%${search}%`);
    }

    if (isActive !== undefined && isActive !== null) {
      query += ' AND IsActive = ?';
      params.push(isActive === 'true' || isActive === true ? 1 : 0);
    }

    // Get Total Count
    const countQuery = `SELECT COUNT(*) AS total ${query}`;
    const [countRows] = await db.query(countQuery, params);
    const total = countRows[0].total;

    // Sorting Whitelist
    const allowedSortFields = {
      'Name': 'Name',
      'Fee': 'Fee',
      'IsChargeable': 'IsChargeable',
      'IsActive': 'IsActive'
    };
    const sortColumn = allowedSortFields[sortBy] || 'Name';
    const order = sortOrder && sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Get Data
    const dataQuery = `
      SELECT * 
      ${query}
      ORDER BY ${sortColumn} ${order}
      LIMIT ? OFFSET ?
    `;
    const dataParams = [...params, parseInt(limit, 10), parseInt(offset, 10)];
    const [rows] = await db.query(dataQuery, dataParams);

    return { rows, total };
  },

  findById: async (id) => {
    const query = 'SELECT * FROM ServiceOption WHERE ServiceOptionID = ?';
    const [rows] = await db.query(query, [id]);
    return rows[0] || null;
  },

  create: async ({ Name, IsChargeable, Fee }, connection) => {
    const activeConn = connection || db;
    const isChargeableVal = IsChargeable === 'true' || IsChargeable === true || IsChargeable === 1 ? 1 : 0;
    const feeVal = isChargeableVal ? parseFloat(Fee || 0) : 0.00;

    const query = `
      INSERT INTO ServiceOption (Name, IsChargeable, Fee, IsActive)
      VALUES (?, ?, ?, 1)
    `;
    const [result] = await activeConn.query(query, [Name, isChargeableVal, feeVal]);
    return result.insertId;
  },

  update: async (id, { Name, IsChargeable, Fee }, connection) => {
    const activeConn = connection || db;
    const isChargeableVal = IsChargeable === 'true' || IsChargeable === true || IsChargeable === 1 ? 1 : 0;
    const feeVal = isChargeableVal ? parseFloat(Fee || 0) : 0.00;

    const query = `
      UPDATE ServiceOption 
      SET Name = ?, IsChargeable = ?, Fee = ?
      WHERE ServiceOptionID = ?
    `;
    await activeConn.query(query, [Name, isChargeableVal, feeVal, id]);
  },

  updateStatus: async (id, isActive, connection) => {
    const activeConn = connection || db;
    const statusVal = isActive === 'true' || isActive === true || isActive === 1 ? 1 : 0;

    const query = 'UPDATE ServiceOption SET IsActive = ? WHERE ServiceOptionID = ?';
    await activeConn.query(query, [statusVal, id]);
  }
};

module.exports = ServiceOptionModel;
