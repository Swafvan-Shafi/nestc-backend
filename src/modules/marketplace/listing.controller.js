const listingService = require('./listing.service');

const getListings = async (req, res) => {
  try {
    const listings = await listingService.getListings(req.query);
    res.json(listings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createListing = async (req, res) => {
  console.log('--- CONTROLLER: createListing START ---');
  try {
    console.log('--- CREATE LISTING REQUEST ---');
    console.log('User:', req.user);
    console.log('Body:', req.body);
    console.log('File:', req.file);

    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'Empty request body' });
    }

    console.log('User ID:', req.user.id);
    console.log('Body:', JSON.stringify(req.body));

    const listingData = { ...req.body };
    if (req.body.photo) {
      listingData.photo = req.body.photo;
    } else if (req.body.imageUrl) {
      listingData.photo = req.body.imageUrl;
    }

    const listing = await listingService.createListing(listingData, req.user.id);
    console.log('Listing created successfully');
    res.status(201).json(listing);
  } catch (err) {
    console.error('--- CONTROLLER ERROR ---');
    console.error(err);
    
    const statusCode = err.message.includes('authenticated') || err.message.includes('token') ? 401 : 500;
    
    res.status(statusCode).json({
      error: 'Failed to create listing',
      details: err.message,
      type: err.name,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

const getListingById = async (req, res) => {
  try {
    const listing = await listingService.getListingById(req.params.id);
    res.json(listing);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['sold', 'purchased'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const result = await listingService.updateStatus(req.params.id, req.user.id, status);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const deleteListing = async (req, res) => {
  try {
    const result = await listingService.deleteListing(req.params.id, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = {
  getListings,
  createListing,
  getListingById,
  updateStatus,
  deleteListing
};