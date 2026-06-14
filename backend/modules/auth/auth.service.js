const bcrypt = require('bcrypt');
const AuthModel = require('./auth.model');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../../utils/jwt');

const AuthService = {
  login: async (username, password) => {
    // 1. Find user in database
    const user = await AuthModel.findByUsername(username);
    if (!user) {
      throw new Error('Invalid username or password.');
    }

    // 2. Check if user is active
    if (!user.IsActive) {
      throw new Error('Your account is inactive. Please contact an administrator.');
    }

    // 3. Verify password
    const isPasswordValid = await bcrypt.compare(password, user.Password);
    if (!isPasswordValid) {
      throw new Error('Invalid username or password.');
    }

    // 4. Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // 5. Update user's last login
    await AuthModel.updateLastLogin(user.UserID);

    // 6. Save refresh token in DB (Expires in 7 days)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await AuthModel.saveRefreshToken(user.UserID, refreshToken, expiresAt);

    return {
      accessToken,
      refreshToken,
      user: {
        UserID: user.UserID,
        Username: user.Username,
        Role: user.Role,
        FirstName: user.FirstName,
        SureName: user.SureName,
        Email: user.Email
      }
    };
  },

  refresh: async (token) => {
    // 1. Verify token signature
    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (err) {
      throw new Error('Invalid or expired refresh token.');
    }

    // 2. Verify token exists in database (not blacklisted/deleted)
    const dbToken = await AuthModel.findRefreshToken(token);
    if (!dbToken) {
      throw new Error('Session has expired or logout has been performed.');
    }

    // 3. Find user
    const user = await AuthModel.findById(decoded.UserID);
    if (!user || !user.IsActive) {
      throw new Error('User not found or is inactive.');
    }

    // 4. Generate new access token
    const newAccessToken = generateAccessToken(user);

    return {
      accessToken: newAccessToken,
      user: {
        UserID: user.UserID,
        Username: user.Username,
        Role: user.Role,
        FirstName: user.FirstName,
        SureName: user.SureName,
        Email: user.Email
      }
    };
  },

  logout: async (token) => {
    // Remove the refresh token from DB
    await AuthModel.deleteRefreshToken(token);
  },

  getCurrentUser: async (userId) => {
    const user = await AuthModel.findById(userId);
    if (!user) {
      throw new Error('User not found.');
    }
    if (!user.IsActive) {
      throw new Error('User is inactive.');
    }
    return user;
  }
};

module.exports = AuthService;
