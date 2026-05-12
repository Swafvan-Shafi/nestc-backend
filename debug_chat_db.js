const db = require('./src/config/db');

async function debugChatData() {
  try {
    console.log('--- ALL CHATS ---');
    const chats = await db.query('SELECT * FROM chats');
    console.table(chats.rows);

    console.log('--- ALL MESSAGES ---');
    const messages = await db.query('SELECT * FROM chat_messages');
    console.table(messages.rows);

    console.log('--- RECENT USERS ---');
    const users = await db.query('SELECT id, name, email FROM users LIMIT 5');
    console.table(users.rows);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

debugChatData();
