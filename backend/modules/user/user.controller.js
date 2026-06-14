const UserService = require('./user.service');
const { sendSuccess, sendError } = require('../../utils/response');

const UserController = {
  getUsers: async (req, res, next) => {
    try {
      const { page, limit } = req.query;
      const result = await UserService.getUsers({ page, limit });
      return res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  },

  toggleUserStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      if (isActive === undefined) {
        return sendError(res, 'Missing required field: isActive', 400);
      }
      
      const user = await UserService.toggleUserStatus(id, isActive);
      return sendSuccess(res, user, 200);
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  },

  resetPassword: async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await UserService.resetPassword(id);
      
      return res.status(200).json({
        success: true,
        data: {
          username: result.username,
          tempPassword: result.tempPassword
        },
        warning: result.warning || undefined
      });
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  }
};

module.exports = UserController;
