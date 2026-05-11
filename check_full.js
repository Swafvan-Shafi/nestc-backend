const db = require('./src/config/db');

async function checkFull() {
  try {
    const cols = await db.query("DESCRIBE chat_messages");
    cols.rows.forEach(col => {
      console.log(`Field: ${col.Field}, Type: ${col.Type}`);
    });
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkFull();
