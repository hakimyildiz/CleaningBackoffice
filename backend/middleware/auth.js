const { verifyAccessToken } = require('../utils/jwt');
const { sendError } = require('../utils/response');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Access denied. No token provided.', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded; // Payload contains UserID, Username, Role
    next();
  } catch (err) {
    return sendError(res, 'Invalid or expired access token.', 401);
  }
};

module.exports = verifyToken;
