const express = require('express');
const router = express.Router();
const AuthController = require('./auth.controller');
const verifyToken = require('../../middleware/auth');

router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);
router.get('/me', verifyToken, AuthController.me);

module.exports = router;
