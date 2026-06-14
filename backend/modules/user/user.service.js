const UserModel = require('./user.model');
const bcrypt = require('bcrypt');
const { sendMail } = require('../../utils/mailer');
const env = require('../../config/env');
const logger = require('../../utils/logger');

const generateTempPassword = () => {
  const uppers = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowers = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const symbols = '!@#$%^&*()';
  
  let password = '';
  password += uppers[Math.floor(Math.random() * uppers.length)];
  password += lowers[Math.floor(Math.random() * lowers.length)];
  password += digits[Math.floor(Math.random() * digits.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  const all = uppers + lowers + digits + symbols;
  for (let i = 0; i < 8; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }
  
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

const UserService = {
  getUsers: async ({ page = 1, limit = 20 }) => {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 20, 100);
    const offset = (pageNum - 1) * limitNum;

    const { rows, total } = await UserModel.findList({
      limit: limitNum,
      offset
    });

    const totalPages = Math.ceil(total / limitNum);

    return {
      data: rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    };
  },

  toggleUserStatus: async (userId, isActive) => {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('User not found.');
    }
    
    await UserModel.updateStatus(userId, isActive);
    return UserModel.findById(userId);
  },

  resetPassword: async (userId) => {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('User not found.');
    }

    const newPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await UserModel.updatePassword(userId, hashedPassword);

    let warning = null;
    try {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 8px;">
          <h2 style="color: #1C2541;">Mopsy Password Reset</h2>
          <p>Hi ${user.FirstName},</p>
          <p>Your Mopsy password has been reset by an administrator.</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Login URL:</strong> <a href="${env.APP_URL}/login" style="color: #00B4D8; text-decoration: none;">${env.APP_URL}/login</a></p>
            <p style="margin: 5px 0;"><strong>Username:</strong> ${user.Username}</p>
            <p style="margin: 5px 0;"><strong>New Temporary Password:</strong> <code style="background-color: #eee; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${newPassword}</code></p>
          </div>
          <p style="color: #666; font-size: 13px;">Please log in and update your password at your earliest convenience.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #999;">If you did not request this, please contact your administrator immediately.<br />— The Mopsy Team</p>
        </div>
      `;

      await sendMail({
        to: user.Email,
        subject: 'Mopsy — Your password has been reset',
        html: emailHtml
      });
    } catch (mailErr) {
      logger.error(`Failed to send password reset email to user <${user.Email}>: ${mailErr.message}`);
      warning = 'Password was reset in database, but notification email could not be sent.';
    }

    return { 
      username: user.Username, 
      tempPassword: newPassword,
      warning 
    };
  }
};

module.exports = UserService;
