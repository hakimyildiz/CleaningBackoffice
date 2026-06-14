const AuthService = require('./auth.service');
const { sendSuccess, sendError } = require('../../utils/response');

const AuthController = {
  login: async (req, res, next) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return sendError(res, 'Username and password are required.', 400);
      }

      const result = await AuthService.login(username, password);

      // Set refresh token cookie (httpOnly, secure in prod, sameSite lax, 7d duration)
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      return sendSuccess(res, {
        accessToken: result.accessToken,
        user: result.user
      }, 200);
    } catch (err) {
      return sendError(res, err.message, 401);
    }
  },

  refresh: async (req, res, next) => {
    try {
      const { refreshToken } = req.cookies;
      if (!refreshToken) {
        return sendError(res, 'Session token missing. Please log in again.', 401);
      }

      const result = await AuthService.refresh(refreshToken);

      return sendSuccess(res, {
        accessToken: result.accessToken,
        user: result.user
      }, 200);
    } catch (err) {
      return sendError(res, err.message, 401);
    }
  },

  logout: async (req, res, next) => {
    try {
      const { refreshToken } = req.cookies;
      if (refreshToken) {
        await AuthService.logout(refreshToken);
      }

      // Clear the refresh token cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });

      return sendSuccess(res, { message: 'Logged out successfully.' }, 200);
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  },

  me: async (req, res, next) => {
    try {
      // req.user has been injected by verifyAccessToken middleware
      const userId = req.user.UserID;
      const user = await AuthService.getCurrentUser(userId);

      return sendSuccess(res, {
        user: {
          UserID: user.UserID,
          Username: user.Username,
          Role: user.Role,
          FirstName: user.FirstName,
          SureName: user.SureName,
          Email: user.Email,
          Title: user.Title,
          MobilePhone: user.MobilePhone
        }
      }, 200);
    } catch (err) {
      return sendError(res, err.message, 401);
    }
  }
};

module.exports = AuthController;
