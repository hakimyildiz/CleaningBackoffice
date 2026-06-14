import express from 'express';
import bcrypt from 'bcryptjs';
import { query, queryOne, insert } from '../lib/db.js';
import { authMiddleware, generateToken } from '../middleware/auth.js';
import { generateUUID } from '../lib/db.js';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, role = 'customer' } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existingUser = await queryOne(
      'SELECT * FROM UserLogin WHERE Email = ?',
      [email]
    );

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = generateUUID();

    await insert(
      `INSERT INTO UserLogin (UserID, Username, UserPassword, Email, Role, IsActive)
       VALUES (?, ?, ?, ?, ?, TRUE)`,
      [userId, email, hashedPassword, email, role]
    );

    const user = await queryOne('SELECT * FROM UserLogin WHERE UserID = ?', [userId]);
    const token = generateToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    }).status(201).json({
      user: {
        userId: user.UserID,
        email: user.Email,
        role: user.Role,
        entityId: user.EntityID,
      },
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await queryOne(
      'SELECT * FROM UserLogin WHERE Email = ? AND IsActive = TRUE',
      [email]
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.UserPassword);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    }).json({
      user: {
        userId: user.UserID,
        email: user.Email,
        role: user.Role,
        entityId: user.EntityID,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token').json({ message: 'Logged out successfully' });
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await queryOne('SELECT * FROM UserLogin WHERE UserID = ?', [req.user.userId]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        userId: user.UserID,
        email: user.Email,
        role: user.Role,
        entityId: user.EntityID,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Update password
router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    const user = await queryOne('SELECT * FROM UserLogin WHERE UserID = ?', [req.user.userId]);

    const isValidPassword = await bcrypt.compare(currentPassword, user.UserPassword);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await query('UPDATE UserLogin SET UserPassword = ? WHERE UserID = ?', [hashedPassword, req.user.userId]);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

export default router;
