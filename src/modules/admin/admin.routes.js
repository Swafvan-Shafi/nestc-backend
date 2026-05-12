const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const { isAdmin } = authMiddleware;

// Apply auth and admin check to all routes
router.use(authMiddleware);
router.use(isAdmin);

// User Routes
router.get('/users', adminController.getAllUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Driver Routes
router.get('/drivers', adminController.getAllDrivers);
router.post('/drivers', adminController.createDriver);
router.put('/drivers/:id', adminController.updateDriver);
router.delete('/drivers/:id', adminController.deleteDriver);

module.exports = router;
