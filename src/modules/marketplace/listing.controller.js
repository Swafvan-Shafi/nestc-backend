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
    if (!req.user || !req.user.id) {
      return res.status(400).json({ error: 'User not identified in request' });
    }
    
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'Empty request body' });
    }

    console.log('User ID:', req.user.id);
    console.log('Body:', JSON.stringify(req.body));

    const listingData = { ...req.body };
    if (req.file) {
      listingData.photo = `http://localhost:5000/uploads/${req.file.filename}`;
    }

    const listing = await listingService.createListing(listingData, req.user.id);
    console.log('Listing created successfully');
    res.status(201).json(listing);
  } catch (err) {
    console.error('--- CONTROLLER ERROR ---');
    console.error(err);
    res.status(400).json({ 
      error: 'Controller level failure', 
      details: err.message,
      type: err.name
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

const markTraded = async (req, res) => {
  try {
    const result = await listingService.markTraded(req.params.id, req.user.id);
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
  markTraded,
  deleteListing
};
