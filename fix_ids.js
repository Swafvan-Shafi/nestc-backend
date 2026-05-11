const db = require('./src/config/db');

async function fixAutoIncrement() {
  try {
    console.log('🚀 Fixing Table IDs...');
    await db.query('SET FOREIGN_KEY_CHECKS = 0');

    // 1. Check if we need to add auto_increment or use UUIDs
    // Since id is varchar(100), we can't easily use AUTO_INCREMENT without changing type.
    // However, we can change it to INT AUTO_INCREMENT or just generate UUIDs in code.
    
    // Better yet, let's make the column have a default UUID if possible, 
    // or just ensure the socket code generates it.
    
    // Let's change the columns to be more flexible
    await db.query('ALTER TABLE chat_messages MODIFY listing_id VARCHAR(100)');
    await db.query('ALTER TABLE chats MODIFY listing_id VARCHAR(100)');

    // If 'id' is a primary key and NOT auto-increment, let's fix it.
    // For varchar(100), it's better to just ensure the code sends a UUID.
    
    await db.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Columns Expanded.');

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

fixAutoIncrement();
