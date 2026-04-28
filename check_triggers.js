const db = require('./src/config/db');

async function checkTriggers() {
  try {
    const [rows] = await db.pool.query('SHOW TRIGGERS');
    console.log('--- TRIGGERS ---');
    console.log(JSON.stringify(rows, null, 2));
    console.log('----------------');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkTriggers();
