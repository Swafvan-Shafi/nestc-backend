const db = require('../../config/db');
const { client: redisClient } = require('../../config/redis');
const { calculateDistance } = require('../../utils/distance');
const crypto = require('crypto');

const NITC_LAT = 11.3218;
const NITC_LNG = 75.9310;

const createBooking = async (bookingData, studentId) => {
  const { vehicle_type, pickup_location, destination, hostel, scheduled_time, pickup_lat, pickup_lng } = bookingData;
  const booking_code = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  const id = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');

  const startLat = parseFloat(pickup_lat) || NITC_LAT;
  const startLng = parseFloat(pickup_lng) || NITC_LNG;

  try {
    console.log(`[DISPATCH] New ride request: ${id}`);
    
    await db.pool.query(
      'INSERT INTO bookings (id, student_id, vehicle_type, pickup_location, destination, hostel, scheduled_time, booking_code, status, pickup_lat, pickup_lng) VALUES (?, ?, ?, ?, ?, ?, ?, ?, "pending", ?, ?)',
      [id, studentId, vehicle_type, pickup_location, destination, hostel, scheduled_time, booking_code, startLat, startLng]
    );

    // Get all free drivers
    const [freeDrivers] = await db.pool.query(
      'SELECT id, name, phone FROM drivers WHERE status = "available" AND is_approved = true AND vehicle_type = ?',
      [vehicle_type]
    );

    if (freeDrivers.length === 0) {
      throw new Error('No drivers are currently Free. Please try again in a few minutes.');
    }

    // Mock sending WhatsApp message to all free drivers
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    freeDrivers.forEach(driver => {
      const acceptLink = `${frontendUrl}/ride/accept/${booking_code}/${driver.id}`;
      console.log(`\n[WHATSAPP MOCK] To ${driver.name} (${driver.phone}):
      NEW RIDE REQUEST!
      From: ${pickup_location}
      To: ${destination}
      Accept Ride: ${acceptLink}\n`);
    });

    const [bookingRows] = await db.pool.query('SELECT * FROM bookings WHERE id = ?', [id]);
    
    return { booking: bookingRows[0], notifiedDriversCount: freeDrivers.length };
  } catch (err) {
    console.error('Create Booking Error Details:', err);
    throw err;
  }
};

const acceptBooking = async (bookingCode, driverId) => {
  try {
    // Attempt atomic update to prevent race conditions
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const gatePassUrl = `${frontendUrl}/gate-pass/${bookingCode}`;

    const [updateResult] = await db.pool.query(
      'UPDATE bookings SET driver_id = ?, status = "accepted", accepted_at = NOW(), gate_pass_url = ?, gate_pass_expires_at = DATE_ADD(NOW(), INTERVAL 30 MINUTE) WHERE booking_code = ? AND status = "pending"',
      [driverId, gatePassUrl, bookingCode]
    );

    if (updateResult.affectedRows === 0) {
      // Check why it failed
      const [check] = await db.pool.query('SELECT status FROM bookings WHERE booking_code = ?', [bookingCode]);
      if (check.length === 0) throw new Error('Booking not found');
      if (check[0].status !== 'pending') throw new Error('This ride has already been accepted by another driver.');
      throw new Error('Failed to accept booking');
    }

    // Mark driver as busy
    await db.pool.query('UPDATE drivers SET status = "busy" WHERE id = ?', [driverId]);

    const [updatedRows] = await db.pool.query('SELECT * FROM bookings WHERE booking_code = ?', [bookingCode]);
    return updatedRows[0];
  } catch (err) {
    console.error('Accept Booking Error Details:', err);
    throw err;
  }
};

const updateDriverStatus = async (driverId, status) => {
  if (!['available', 'busy'].includes(status)) throw new Error('Invalid status');
  await db.pool.query('UPDATE drivers SET status = ? WHERE id = ?', [status, driverId]);
  return { message: `Driver status updated to ${status}` };
};

const getMyBookings = async (studentId) => {
  const [rows] = await db.pool.query(
    'SELECT b.*, d.name as driver_name, d.vehicle_number, d.phone as driver_phone FROM bookings b LEFT JOIN drivers d ON b.driver_id = d.id WHERE b.student_id = ? AND b.created_at > DATE_SUB(NOW(), INTERVAL 30 DAY) ORDER BY b.created_at DESC',
    [studentId]
  );
  return rows;
};

const getActivePasses = async () => {
  const [rows] = await db.pool.query(
    'SELECT b.*, u.name as student_name, d.name as driver_name, d.vehicle_number FROM bookings b JOIN users u ON b.student_id = u.id LEFT JOIN drivers d ON b.driver_id = d.id WHERE b.status IN ("accepted", "arrived") AND b.gate_pass_expires_at > NOW() ORDER BY b.gate_pass_expires_at ASC'
  );
  return rows;
};

const markReached = async (bookingId, studentId) => {
  try {
    const [bookingRows] = await db.pool.query('SELECT driver_id FROM bookings WHERE id = ? AND student_id = ?', [bookingId, studentId]);
    if (bookingRows.length === 0) throw new Error('Booking not found');

    const driverId = bookingRows[0].driver_id;

    await db.pool.query('UPDATE bookings SET status = "completed", completed_at = NOW() WHERE id = ?', [bookingId]);

    if (driverId) {
      await db.pool.query('UPDATE drivers SET status = "available", total_trips = total_trips + 1 WHERE id = ?', [driverId]);
    }

    return { message: 'Booking marked as completed' };
  } catch (err) {
    throw err;
  }
};

const rejectBooking = async (bookingId, driverId) => {
  try {
    const [bookingCheck] = await db.pool.query('SELECT status FROM bookings WHERE id = ?', [bookingId]);
    if (bookingCheck.length === 0) throw new Error('Booking not found');
    
    // We update the driver_response to rejected
    await db.pool.query(
      'UPDATE bookings SET driver_response = "rejected" WHERE id = ?',
      [bookingId]
    );

    return { message: 'Booking rejected by driver' };
  } catch (err) {
    console.error('Reject Booking Error Details:', err);
    throw err;
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
