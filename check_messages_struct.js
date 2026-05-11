const db = require('./src/config/db');

async function checkMessages() {
  try {
    console.log('--- CHAT_MESSAGES STRUCTURE ---');
    const cols = await db.query("DESCRIBE chat_messages");
    console.table(cols.rows || cols);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkMessages();
