const db = require('./src/config/db');

async function checkListings() {
  try {
    console.log('--- LISTINGS CHECK ---');
    const listings = await db.query("SELECT id, title FROM listings LIMIT 5");
    console.table(listings.rows || listings);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkListings();
