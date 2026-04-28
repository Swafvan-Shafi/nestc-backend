const express = require('express');
const vendingController = require('./vending.controller');
const authMiddleware = require('../../middleware/auth.middleware');

const router = express.Router();

router.get('/hostels', authMiddleware, vendingController.getHostels);
router.get('/hostels/:id/machines', authMiddleware, vendingController.getMachinesByHostel);
router.get('/machines/:id/items', authMiddleware, vendingController.getMachineItems);
router.patch('/machines/:id/items/:itemId', authMiddleware, vendingController.updateStock);
router.post('/machines/:id/subscribe', authMiddleware, vendingController.subscribe);

module.exports = router;
