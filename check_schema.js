const db = require('./src/config/db');

async function checkSchema() {
  try {
    const [rows] = await db.pool.query('DESCRIBE bookings');
    console.log('--- BOOKINGS SCHEMA ---');
    console.log(JSON.stringify(rows, null, 2));
    console.log('-----------------------');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkSchema();
