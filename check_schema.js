const db = require('./src/config/db');

async function checkSchema() {
  try {
    console.log('--- CHATS SCHEMA ---');
    const chats = await db.query('DESCRIBE chats');
    console.table(chats.rows);

    console.log('--- MESSAGES SCHEMA ---');
    const messages = await db.query('DESCRIBE chat_messages');
    console.table(messages.rows);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkSchema();
