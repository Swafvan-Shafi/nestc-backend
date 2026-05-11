const db = require('../../config/db');
const { randomUUID } = require('crypto');

const getListings = async (filters) => {
  const { category, type, urgent, sellerId, status } = filters;
  
  let statusFilter = status;
  if (!statusFilter) {
    statusFilter = sellerId ? 'all' : 'active';
  }
  
  let query = "SELECT l.*, CASE WHEN l.is_urgent = 1 AND l.created_at >= NOW() - INTERVAL 24 HOUR THEN 1 ELSE 0 END AS is_urgent, u.name as seller_name, u.hostel as seller_hostel FROM listings l JOIN users u ON l.seller_id = u.id WHERE 1=1";
  const params = [];

  if (statusFilter === 'active') {
    query += " AND l.status = 'active'";
  } else if (statusFilter === 'sold' || statusFilter === 'traded') {
    query += " AND l.status = 'traded'";
  } else if (statusFilter === 'all') {
    query += " AND (l.status = 'active' OR l.status = 'traded')";
  }

  if (category && category !== 'All') {
    params.push(category.toLowerCase());
    query += " AND l.category = ?";
  }

  if (type) {
    params.push(type.toLowerCase());
    query += " AND l.type = ?";
  }

  if (urgent === 'true') {
    query += ' AND l.is_urgent = 1';
  }

  if (sellerId) {
    params.push(sellerId);
    query += " AND l.seller_id = ?";
  }

  query += ' ORDER BY l.created_at DESC';

  const result = await db.query(query, params);
  const rows = result.rows || result || [];
  
  for (let listing of rows) {
    const photosRes = await db.query('SELECT photo_url FROM listing_photos WHERE listing_id = ? ORDER BY display_order ASC', [listing.id]);
    const photoRows = photosRes.rows || photosRes || [];
    listing.photos = photoRows.map(p => p.photo_url);
  }

  return rows;
};

const createListing = async (listingData, sellerId) => {
  const { title, description, category, type, price, is_urgent, is_free, photo } = listingData;
  const listingId = randomUUID();

  try {
    const isUrgentBool = is_urgent === 'true' || is_urgent === true;

    if (isUrgentBool) {
      const checkUrgent = await db.query(
        "SELECT id FROM listings WHERE seller_id = ? AND is_urgent = 1 AND status = 'active' AND created_at >= NOW() - INTERVAL 24 HOUR",
        [sellerId]
      );
      const checkRows = checkUrgent.rows || checkUrgent || [];
      if (checkRows.length > 0) {
        throw new Error('You already have one active urgent listing. Please wait until it expires or remove it.');
      }
    }

    let dbCategory = (category || 'other').toLowerCase();
    const validCategories = ['books', 'stationery', 'electronics', 'lab', 'clothes', 'cycles', 'other'];
    if (dbCategory.includes('cloth')) dbCategory = 'clothes';
    if (!validCategories.includes(dbCategory)) dbCategory = 'other';

    const dbType = (type || 'have').toLowerCase();

    await db.query(
      `INSERT INTO listings (id, seller_id, title, description, category, type, price, is_urgent, is_free, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        listingId, 
        sellerId, 
        title || 'Untitled Listing', 
        description || '', 
        dbCategory, 
        dbType, 
        parseFloat(price) || 0, 
        isUrgentBool ? 1 : 0, 
        is_free === 'true' || is_free === true ? 1 : 0
      ]
    );

    if (photo) {
      await db.query(
        'INSERT INTO listing_photos (id, listing_id, photo_url, display_order) VALUES (?, ?, ?, ?)',
        [randomUUID(), listingId, photo, 0]
      );
    }

    return { id: listingId, ...listingData, seller_id: sellerId };
  } catch (err) {
    console.error('Database Error in createListing:', err);
    throw err;
  }
};

const getListingById = async (id) => {
  const result = await db.query(
    "SELECT l.*, CASE WHEN l.is_urgent = 1 AND l.created_at >= NOW() - INTERVAL 24 HOUR THEN 1 ELSE 0 END AS is_urgent, u.name as seller_name, u.hostel as seller_hostel FROM listings l JOIN users u ON l.seller_id = u.id WHERE l.id = ?",
    [id]
  );
  const rows = result.rows || result || [];
  if (rows.length === 0) throw new Error('Listing not found');

  const listing = rows[0];
  const photosRes = await db.query('SELECT photo_url FROM listing_photos WHERE listing_id = ? ORDER BY display_order ASC', [id]);
  const photoRows = photosRes.rows || photosRes || [];
  listing.photos = photoRows.map(p => p.photo_url);

  await db.query('UPDATE listings SET views_count = views_count + 1 WHERE id = ?', [id]);

  return listing;
};

const updateStatus = async (id, sellerId, status) => {
  await db.query(
    "UPDATE listings SET status = ?, traded_at = NOW() WHERE id = ? AND seller_id = ?",
    [status, id, sellerId]
  );
  return { message: `Item marked as ${status.toUpperCase()}` };
};

const deleteListing = async (id, sellerId) => {
  await db.query(
    'DELETE FROM listings WHERE id = ? AND seller_id = ?',
    [id, sellerId]
  );
  return { message: 'Listing permanently removed' };
};

module.exports = {
  getListings,
  createListing,
  getListingById,
  updateStatus,
  deleteListing
};
