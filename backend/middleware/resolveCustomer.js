const db = require('../config/db');

const resolveCustomer = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT c.CustomerID FROM Customer c
       JOIN Person p ON c.PersonID = p.PersonID
       JOIN User u ON u.PersonID = p.PersonID
       WHERE u.UserID = ? AND c.IsActive = 1`,
      [req.user.UserID]
    );
    if (!rows.length) {
      return res.status(403).json({ success: false, message: 'Customer record not found.' });
    }
    req.customerId = rows[0].CustomerID;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = resolveCustomer;
