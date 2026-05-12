const bcrypt = require('bcrypt');
const { randomUUID } = require('crypto');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const db = require('../../config/db');
const { client: redisClient } = require('../../config/redis');
const { sendOTP } = require('../../utils/mailer');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const register = async (userData) => {
  const name = userData.name;
  const email = userData.email?.trim();

  if (!name || !email) {
    throw new Error('Name and email are required');
  }

  // Step 1: Format Check
  const nitcEmailRegex = /^[a-zA-Z]+_[a-zA-Z0-9]+@nitc\.ac\.in$/i;
  if (!nitcEmailRegex.test(email)) {
    throw new Error('Please enter a valid NITC email ID (e.g. name_b240314cs@nitc.ac.in)');
  }

  // Step 2: Check if email already registered
  const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existingUser.rows.length > 0) {
    throw new Error('This email is already registered. Please login instead.');
  }

  const id = randomUUID();
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Increased to 10 mins for reliability

  const payload = { id, name, email };

  // Step 3: Store OTP in Database (UPSERT)
  try {
    await db.query(
      'INSERT INTO otps (email, otp, expires_at, user_data) VALUES ($1, $2, $3, $4) ON DUPLICATE KEY UPDATE otp = VALUES(otp), expires_at = VALUES(expires_at), user_data = VALUES(user_data)',
      [email, otp, expiresAt, JSON.stringify(payload)]
    );
  } catch (dbErr) {
    console.error('Database Error during OTP storage:', dbErr);
    throw new Error('System busy. Please try again in a moment.');
  }

  // Step 4: Send OTP in background (DON'T AWAIT)
  // This makes the frontend respond instantly
  sendOTP(email, otp).catch(e => {
    console.error('⚠️ Background OTP Send Failed:', e.message);
  });

  return { 
    message: 'OTP sent! Please check your NITC email (and Spam folder).', 
    requiresOTP: true, 
    email 
  };
};

const verifyEmail = async (email, otp) => {
  const result = await db.query(
    'SELECT otp, expires_at, user_data FROM otps WHERE email = $1',
    [email]
  );
  
  const record = result.rows[0];

  if (!record || record.otp !== otp || new Date(record.expires_at) < new Date()) {
    throw new Error('Invalid or expired OTP. Please try again.');
  }

  const userData = record.user_data ? (typeof record.user_data === 'string' ? JSON.parse(record.user_data) : record.user_data) : null;

  // Delete OTP record immediately
  await db.query('DELETE FROM otps WHERE email = $1', [email]);

  const type = userData ? 'register' : 'reset_password';
  const token = jwt.sign(
    { email, type, user_data: userData },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  return { message: 'OTP verified successfully', token, type };
};

const setupPassword = async (token, password, additionalData) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'register' || !decoded.user_data) {
      throw new Error('Invalid token type');
    }

    const userData = decoded.user_data;
    const { gender, hostel, room_number, phone } = additionalData || {};
    const passwordHash = await bcrypt.hash(password, 12);

    await db.query(
      `INSERT INTO users (id, name, email, password_hash, hostel, room_number, phone, gender, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)`,
      [userData.id, userData.name, userData.email, passwordHash, hostel, room_number, phone, gender]
    );

    return { message: 'Registration complete! You can now login.' };
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new Error('Session expired. Please try registering again.');
    }
    throw new Error('Failed to setup password: ' + err.message);
  }
};

const forgotPassword = async (email) => {
  const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existingUser.rows.length === 0) {
    throw new Error('Email does not exist. Please enter your registered email ID');
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  // Store OTP in DB first
  await db.query(
    'INSERT INTO otps (email, otp, expires_at, user_data) VALUES ($1, $2, $3, NULL) ON DUPLICATE KEY UPDATE otp = VALUES(otp), expires_at = VALUES(expires_at), user_data = NULL',
    [email, otp, expiresAt]
  );

  // Send OTP in background
  sendOTP(email, otp).catch(e => {
    console.error('⚠️ Background ForgotPassword OTP Failed:', e.message);
  });

  return { message: 'Password reset OTP sent! Please check your email.' };
};

const resetPassword = async (token, password) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'reset_password') {
      throw new Error('Invalid token type');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await db.query('UPDATE users SET password_hash = $1 WHERE email = $2', [passwordHash, decoded.email]);

    return { message: 'Password reset successful. Please login with your new password.' };
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new Error('Session expired. Please try resetting your password again.');
    }
    throw new Error('Failed to reset password: ' + err.message);
  }
};



const login = async (email, password) => {
  const trimmedEmail = email?.trim();
  
  // Step 1 — Pattern Check
  const nitcEmailRegex = /^[a-zA-Z]+_[a-zA-Z0-9]+@nitc\.ac\.in$/i;
  if (!nitcEmailRegex.test(trimmedEmail)) {
    throw new Error('Please enter a valid NITC email ID');
  }

  console.log(`🔑 Attempting login for: ${trimmedEmail}`);
  
  // Step 2 — Check if email exists in database
  const result = await db.query('SELECT * FROM users WHERE email = $1', [trimmedEmail]);
  const user = result.rows[0];

  if (!user) {
    console.log('❌ User not found');
    throw new Error('No account found with this email. Please register first.');
  }

  console.log('⏳ Checking password hash...');
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    console.log('❌ Password mismatch');
    throw new Error('Invalid email or password');
  }


  if (!user.is_verified) {
    throw new Error('Please verify your email first');
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return { 
    token, 
    user: { 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      role: user.role,
      hostel: user.hostel,
      gender: user.gender
    } 
  };
};

const getMe = async (userId) => {
  const result = await db.query(
    'SELECT id, name, email, role, hostel, room_number, phone, gender, is_verified FROM users WHERE id = $1',
    [userId]
  );

  return result.rows[0];
};

const getUserById = async (userId) => {
  const result = await db.query(
    'SELECT id, name, hostel FROM users WHERE id = $1',
    [userId]
  );
  if (result.rows.length === 0) throw new Error('User not found');
  return result.rows[0];
};

module.exports = {
  register,
  verifyEmail,
  setupPassword,
  forgotPassword,
  resetPassword,
  login,
  getMe,
  getUserById
};
