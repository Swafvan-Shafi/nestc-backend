const authService = require('./auth.service');

const register = async (req, res) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const result = await authService.verifyEmail(email, otp);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const setupPassword = async (req, res) => {
  try {
    const { token, password, gender, hostel, room_number, phone } = req.body;
    const result = await authService.setupPassword(token, password, { gender, hostel, room_number, phone });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    const result = await authService.resetPassword(token, password);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await authService.getMe(req.user.id);
    res.json(user);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await authService.getUserById(req.params.id);
    res.json(user);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
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
