const db = require('../config/db');

const resolveAgency = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT a.AgencyStaffID, a.AgencyID, a.Role FROM AgencyStaff a
       JOIN Person p ON a.PersonID = p.PersonID
       JOIN User u ON u.PersonID = p.PersonID
       WHERE u.UserID = ? AND a.IsActive = 1`,
      [req.user.UserID]
    );
    if (!rows.length) {
      return res.status(403).json({ success: false, message: 'Agency staff record not found.' });
    }
    req.agencyId = rows[0].AgencyID;
    req.agencyStaffId = rows[0].AgencyStaffID;
    req.agencyRole = rows[0].Role;  // 'agency_manager' | 'agency_bookkeeper' | 'agency_staff'
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = resolveAgency;
