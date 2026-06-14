const db = require('../../config/db');

const ServicePhotoModel = {
  create: async ({ ServiceRecordID, EmployeeID, PhotoType, DriveFileID, DriveURL }, connection) => {
    const activeConn = connection || db;
    const query = `
      INSERT INTO ServicePhoto (ServiceRecordID, EmployeeID, PhotoType, DriveFileID, DriveURL)
      VALUES (?, ?, ?, ?, ?)
    `;
    const params = [
      ServiceRecordID, EmployeeID || null, PhotoType || 'after', DriveFileID, DriveURL
    ];
    const [result] = await activeConn.query(query, params);
    return result.insertId;
  },

  findByRecordId: async (recordId) => {
    const query = 'SELECT * FROM ServicePhoto WHERE ServiceRecordID = ? ORDER BY UploadedAt ASC';
    const [rows] = await db.query(query, [recordId]);
    return rows;
  },

  findById: async (photoId) => {
    const query = 'SELECT * FROM ServicePhoto WHERE ServicePhotoID = ?';
    const [rows] = await db.query(query, [photoId]);
    return rows[0] || null;
  },

  delete: async (photoId, connection) => {
    const activeConn = connection || db;
    const query = 'DELETE FROM ServicePhoto WHERE ServicePhotoID = ?';
    await activeConn.query(query, [photoId]);
  }
};

module.exports = ServicePhotoModel;
