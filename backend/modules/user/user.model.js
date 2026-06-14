const db = require('../../config/db');

const UserModel = {
  findList: async ({ limit, offset }) => {
    const countQuery = 'SELECT COUNT(*) AS total FROM User';
    const [countRows] = await db.query(countQuery);
    const total = countRows[0].total;

    const dataQuery = `
      SELECT u.UserID, u.PersonID, u.Username, u.Role, u.IsActive, u.CreatedAt, u.LastLoginAt,
             p.FirstName, p.SureName, p.Email, p.MobilePhone
      FROM User u
      JOIN Person p ON u.PersonID = p.PersonID
      ORDER BY u.CreatedAt DESC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await db.query(dataQuery, [parseInt(limit, 10), parseInt(offset, 10)]);

    return { rows, total };
  },

  findById: async (userId) => {
    const query = `
      SELECT u.UserID, u.PersonID, u.Username, u.Role, u.IsActive, u.CreatedAt, u.LastLoginAt,
             p.FirstName, p.SureName, p.Email, p.MobilePhone
      FROM User u
      JOIN Person p ON u.PersonID = p.PersonID
      WHERE u.UserID = ?
    `;
    const [rows] = await db.query(query, [userId]);
    return rows[0] || null;
  },

  updateStatus: async (userId, isActive) => {
    const query = 'UPDATE User SET IsActive = ? WHERE UserID = ?';
    await db.query(query, [isActive ? 1 : 0, userId]);
  },

  updatePassword: async (userId, hashedPassword) => {
    const query = 'UPDATE User SET Password = ? WHERE UserID = ?';
    await db.query(query, [hashedPassword, userId]);
  }
};

module.exports = UserModel;
