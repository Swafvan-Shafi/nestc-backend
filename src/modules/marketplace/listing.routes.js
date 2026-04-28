const express = require('express');
const listingController = require('./listing.controller');
const authMiddleware = require('../../middleware/auth.middleware');

const router = express.Router();

router.get('/', authMiddleware, listingController.getListings);
router.post('/', authMiddleware, listingController.createListing);
router.get('/:id', authMiddleware, listingController.getListingById);
router.patch('/:id/traded', authMiddleware, listingController.markTraded);
router.delete('/:id', authMiddleware, listingController.deleteListing);

module.exports = router;
