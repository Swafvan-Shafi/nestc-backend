const express = require('express');
const authController = require('./auth.controller');
const authMiddleware = require('../../middleware/auth.middleware');

const router = express.Router();

router.post('/register', authController.register);
router.post('/verify-email', authController.verifyEmail);
router.post('/setup-password', authController.setupPassword);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.getMe);

// Added public user profile route for Chat system
router.get('/users/:id', authMiddleware, authController.getUserById);

module.exports = router;
