const express = require('express');
const bookingController = require('./booking.controller');
const authMiddleware = require('../../middleware/auth.middleware');

const router = express.Router();

router.post('/', authMiddleware, bookingController.createBooking);
router.get('/my', authMiddleware, bookingController.getMyBookings);
router.get('/active', authMiddleware, bookingController.getActivePasses); // Role security would be checked in a separate middleware
router.post('/:id/accept', bookingController.acceptBooking); // Public for driver acceptance
router.post('/:id/reject', bookingController.rejectBooking); // Public for driver rejection
router.patch('/:id/reached', authMiddleware, bookingController.markReached);

module.exports = router;
