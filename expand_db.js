const db = require('./src/config/db');

async function fixDatabase() {
  console.log('🚀 Starting Unlocked Database Expansion...');
  try {
    // 1. Temporarily disable foreign key checks
    console.log('🔹 Unlocking database constraints...');
    await db.query('SET FOREIGN_KEY_CHECKS = 0');

    // 2. Expand columns
    console.log('🔹 Expanding chat_id columns...');
    await db.query('ALTER TABLE chats MODIFY id VARCHAR(100)');
    await db.query('ALTER TABLE chat_messages MODIFY chat_id VARCHAR(100)');
    await db.query('ALTER TABLE chat_messages MODIFY id VARCHAR(100)');
    
    // 3. Re-enable checks
    console.log('🔹 Re-locking database constraints...');
    await db.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('✅ DATABASE EXPANDED SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error expanding database:', err.message);
    process.exit(1);
  }
}

fixDatabase();
