const db = require('./src/config/db');

async function inspectDB() {
  try {
    console.log('--- DATABASE INSPECTION ---');
    
    console.log('\n🔹 Recent Chats:');
    const chats = await db.query('SELECT id, buyer_id, seller_id, created_at FROM chats ORDER BY created_at DESC LIMIT 5');
    console.table(chats.rows || chats);

    console.log('\n🔹 Recent Messages:');
    const messages = await db.query('SELECT id, chat_id, content, created_at FROM chat_messages ORDER BY created_at DESC LIMIT 5');
    console.table(messages.rows || messages);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

inspectDB();
