const db = require('./src/config/db');

async function listTables() {
  try {
    console.log('--- DATABASE TABLES ---');
    const tables = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()");
    console.table(tables.rows || tables);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

listTables();
