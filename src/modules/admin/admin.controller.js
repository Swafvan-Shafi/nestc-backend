const db = require('../../config/db');
const bcrypt = require('bcrypt');
const { randomUUID } = require('crypto');

// User Management
const getAllUsers = async (req, res) => {
  try {
    const { gender } = req.query;
    let query = 'SELECT id, name, email, role, hostel, room_number, phone, gender, is_verified, created_at FROM users';
    let params = [];

    if (gender && gender !== 'all') {
      query += ' WHERE gender = $1';
      params.push(gender);
    }

    query += ' ORDER BY created_at DESC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, role, hostel, room_number, phone, gender } = req.body;
    const id = randomUUID();
    const passwordHash = await bcrypt.hash(password, 12);

    await db.query(
      `INSERT INTO users (id, name, email, password_hash, role, hostel, room_number, phone, gender, is_verified) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)`,
      [id, name, email, passwordHash, role || 'student', hostel, room_number, phone, gender]
    );
    res.status(201).json({ message: 'User created successfully', id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, hostel, room_number, phone, gender } = req.body;

    await db.query(
      `UPDATE users SET name = $1, role = $2, hostel = $3, room_number = $4, phone = $5, gender = $6 WHERE id = $7`,
      [name, role, hostel, room_number, phone, gender, id]
    );
    res.json({ message: 'User updated successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Driver Management
const getAllDrivers = async (req, res) => {
  try {
    const { type } = req.query;
    let query = 'SELECT * FROM drivers';
    let params = [];

    if (type && type !== 'all') {
      query += ' WHERE vehicle_type = $1';
      params.push(type);
    }

    query += ' ORDER BY created_at DESC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createDriver = async (req, res) => {
  try {
    const { name, phone, vehicle_number, vehicle_type } = req.body;
    const id = randomUUID();
    await db.query(
      `INSERT INTO drivers (id, name, phone, vehicle_number, vehicle_type, status, is_approved) 
       VALUES ($1, $2, $3, $4, $5, 'offline', true)`,
      [id, name, phone, vehicle_number, vehicle_type]
    );
    res.status(201).json({ message: 'Driver added successfully', id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const updateDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, vehicle_number, vehicle_type, status } = req.body;
    await db.query(
      `UPDATE drivers SET name = $1, phone = $2, vehicle_number = $3, vehicle_type = $4, status = $5 WHERE id = $6`,
      [name, phone, vehicle_number, vehicle_type, status, id]
    );
    res.json({ message: 'Driver updated successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const deleteDriver = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM drivers WHERE id = $1', [id]);
    res.json({ message: 'Driver deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getAllDrivers,
  createDriver,
  updateDriver,
  deleteDriver
};
