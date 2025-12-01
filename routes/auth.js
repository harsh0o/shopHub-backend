const express = require('express');
const router = express.Router();
const { login, register, refreshToken, logout, getMe } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { loginValidation, registerValidation } = require('../middleware/validation');

// Public Routes
router.post('/login', loginValidation, login);
router.post('/register', registerValidation, register);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);

// Protected Routes
router.get('/me', authenticate, getMe);

module.exports = router;
