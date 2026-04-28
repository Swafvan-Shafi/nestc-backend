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
    console.log(`[DISPATCH] Student Location: ${startLat}, ${startLng}`);
    
    await db.pool.query(
      'INSERT INTO bookings (id, student_id, vehicle_type, pickup_location, destination, hostel, scheduled_time, booking_code, status, pickup_lat, pickup_lng) VALUES (?, ?, ?, ?, ?, ?, ?, ?, "pending", ?, ?)',
      [id, studentId, vehicle_type, pickup_location, destination, hostel, scheduled_time, booking_code, startLat, startLng]
    );

    // Filter free drivers
    const [driversResult] = await db.pool.query(
      'SELECT id, name, last_latitude, last_longitude, phone FROM drivers WHERE status = "available" AND is_approved = true AND vehicle_type = ?',
      [vehicle_type]
    );

    let driversWithDistance = driversResult.map(driver => {
      const dLat = parseFloat(driver.last_latitude);
      const dLng = parseFloat(driver.last_longitude);
      // Distance from pickup point
      const pickupDist = calculateDistance(startLat, startLng, dLat, dLng);
      // Distance from NITC Center
      const centerDist = calculateDistance(NITC_LAT, NITC_LNG, dLat, dLng);
      return { ...driver, distance: pickupDist, centerDist };
    });

    // FILTER: Only drivers within 2km of NITC campus
    let filteredDrivers = driversWithDistance.filter(d => d.centerDist <= 2.0);

    // SORT: By distance to pickup point
    filteredDrivers.sort((a, b) => a.distance - b.distance);
    
    console.log(`[DISPATCH] Found ${filteredDrivers.length} drivers within 2km of NITC`);

    const [bookingRows] = await db.pool.query('SELECT * FROM bookings WHERE id = ?', [id]);
    
    if (filteredDrivers.length === 0) {
      throw new Error('No drivers available nearby. Please try again in a few minutes.');
    }

    // REAL FLOW: Do NOT auto-accept. Wait for the real WhatsApp link to be clicked.
    return { booking: bookingRows[0], suggestedDrivers: filteredDrivers.slice(0, 5) };
  } catch (err) {
    console.error('Create Booking Error Details:', err);
    throw err;
  }
};

const acceptBooking = async (bookingId, driverId, location) => {
  const { lat, lng } = location;

  try {
    const [bookingCheck] = await db.pool.query('SELECT status FROM bookings WHERE id = ?', [bookingId]);
    if (bookingCheck.length === 0) throw new Error('Booking not found');
    if (bookingCheck[0].status !== 'pending') throw new Error('Booking already taken or cancelled');

    await db.pool.query(
      'UPDATE bookings SET driver_id = ?, status = "accepted", accepted_at = NOW(), gate_pass_url = ?, gate_pass_expires_at = DATE_ADD(NOW(), INTERVAL 35 MINUTE) WHERE id = ?',
      [driverId, `http://localhost:3000/gate-pass/${bookingId}`, bookingId]
    );

    await db.pool.query('UPDATE drivers SET status = "busy", last_latitude = ?, last_longitude = ?, location_updated_at = NOW() WHERE id = ?', [lat, lng, driverId]);

    const [updatedRows] = await db.pool.query('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    return updatedRows[0];
  } catch (err) {
    console.error('Accept Booking Error Details:', err);
    throw err;
  }
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
  markReached
};
