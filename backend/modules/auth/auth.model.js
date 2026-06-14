const db = require('../../config/db');

const AuthModel = {
  findByUsername: async (username) => {
    const query = `
      SELECT u.*, p.FirstName, p.SureName, p.Email 
      FROM User u 
      JOIN Person p ON u.PersonID = p.PersonID 
      WHERE u.Username = ?
    `;
    const [rows] = await db.query(query, [username]);
    return rows[0] || null;
  },

  findById: async (userId) => {
    const query = `
      SELECT u.UserID, u.PersonID, u.Username, u.Role, u.IsActive, u.CreatedAt, u.LastLoginAt,
             p.Title, p.FirstName, p.SureName, p.Email, p.MobilePhone
      FROM User u
      JOIN Person p ON u.PersonID = p.PersonID
      WHERE u.UserID = ?
    `;
    const [rows] = await db.query(query, [userId]);
    return rows[0] || null;
  },

  updateLastLogin: async (userId) => {
    const query = 'UPDATE User SET LastLoginAt = NOW() WHERE UserID = ?';
    await db.query(query, [userId]);
  },

  saveRefreshToken: async (userId, token, expiresAt) => {
    const query = 'INSERT INTO RefreshToken (UserID, Token, ExpiresAt) VALUES (?, ?, ?)';
    await db.query(query, [userId, token, expiresAt]);
  },

  findRefreshToken: async (token) => {
    const query = 'SELECT * FROM RefreshToken WHERE Token = ? AND ExpiresAt > NOW()';
    const [rows] = await db.query(query, [token]);
    return rows[0] || null;
  },

  deleteRefreshToken: async (token) => {
    const query = 'DELETE FROM RefreshToken WHERE Token = ?';
    await db.query(query, [token]);
  }
};

module.exports = AuthModel;
