const express = require('express');
const path = require('path');

// Multer removed as images are handled by /upload route separately

const listingController = require('./listing.controller');
const authMiddleware = require('../../middleware/auth.middleware');

const router = express.Router();

router.get('/', authMiddleware, listingController.getListings);
router.post('/', authMiddleware, listingController.createListing);
router.get('/:id', authMiddleware, listingController.getListingById);
router.patch('/:id/status', authMiddleware, listingController.updateStatus);
router.delete('/:id', authMiddleware, listingController.deleteListing);

module.exports = router;
