const express = require('express');
const multer = require('multer');
const uploadController = require('./upload.controller');
const authMiddleware = require('../../middleware/auth.middleware');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

router.post('/', authMiddleware, upload.single('image'), uploadController.uploadImage);

module.exports = router;
