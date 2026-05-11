const bookingService = require('./booking.service');

const createBooking = async (req, res) => {
  try {
    const result = await bookingService.createBooking(req.body, req.user.id);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const acceptBooking = async (req, res) => {
  try {
    const { id } = req.params; // Using booking code as id
    const { driverId } = req.body;
    const result = await bookingService.acceptBooking(id, driverId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const getMyBookings = async (req, res) => {
  try {
    const bookings = await bookingService.getMyBookings(req.user.id);
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getActivePasses = async (req, res) => {
  try {
    const passes = await bookingService.getActivePasses();
    res.json(passes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const markReached = async (req, res) => {
  try {
    const result = await bookingService.markReached(req.params.id, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const rejectBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { driverId } = req.body;
    const result = await bookingService.rejectBooking(id, driverId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const updateDriverStatus = async (req, res) => {
  try {
    const { driverId, status } = req.body;
    const result = await bookingService.updateDriverStatus(driverId, status);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = {
  createBooking,
  acceptBooking,
  rejectBooking,
  getMyBookings,
  getActivePasses,
  markReached,
  updateDriverStatus
};
