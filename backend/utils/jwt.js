const jwt = require('jsonwebtoken');
const env = require('../config/env');

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      UserID: user.UserID,
      Username: user.Username,
      role: user.Role
    },
    env.JWT.accessSecret,
    { expiresIn: env.JWT.accessExpiresIn }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      UserID: user.UserID,
      Username: user.Username
    },
    env.JWT.refreshSecret,
    { expiresIn: env.JWT.refreshExpiresIn }
  );
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, env.JWT.accessSecret);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.JWT.refreshSecret);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
