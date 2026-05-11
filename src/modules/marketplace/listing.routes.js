const express = require('express');
const { upload } = require('../../config/cloudinary');
const listingController = require('./listing.controller');
const authMiddleware = require('../../middleware/auth.middleware');

const router = express.Router();

router.get('/', authMiddleware, listingController.getListings);
router.post('/', authMiddleware, upload.single('photo'), listingController.createListing);
router.get('/:id', authMiddleware, listingController.getListingById);
router.patch('/:id/status', authMiddleware, listingController.updateStatus);
router.delete('/:id', authMiddleware, listingController.deleteListing);

module.exports = router;