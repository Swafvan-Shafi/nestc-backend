const db = require('./src/config/db');

async function checkStructure() {
  try {
    console.log('--- CHAT_MESSAGES STRUCTURE ---');
    const cols = await db.query("DESCRIBE chat_messages");
    console.table(cols.rows || cols);

    console.log('\n--- CHATS STRUCTURE ---');
    const cols2 = await db.query("DESCRIBE chats");
    console.table(cols2.rows || cols2);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkStructure();
