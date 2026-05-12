const db = require('./src/config/db');

async function unifyExistingChats() {
  try {
    console.log('Starting chat unification script...');
    
    // 1. Get all chats
    const result = await db.query('SELECT * FROM chats');
    const chats = result.rows;
    
    const processedPairs = new Set();
    
    for (const chat of chats) {
      const buyerId = chat.buyer_id;
      const sellerId = chat.seller_id;
      
      const pairKey = [buyerId, sellerId].sort().join(':');
      if (processedPairs.has(pairKey)) continue;
      processedPairs.add(pairKey);
      
      const ids = [buyerId, sellerId].sort();
      const unifiedId = `p2p_${ids[0].substring(0, 8)}_${ids[1].substring(0, 8)}`;
      
      console.log(`Processing pair: ${pairKey} -> Target Unified ID: ${unifiedId}`);
      
      // Find all chats for this pair
      const pairChats = await db.query(
        'SELECT id FROM chats WHERE (buyer_id = $1 AND seller_id = $2) OR (buyer_id = $2 AND seller_id = $1)',
        [buyerId, sellerId]
      );
      
      const otherChatIds = pairChats.rows.map(r => r.id).filter(id => id !== unifiedId);
      
      if (otherChatIds.length > 0) {
        console.log(`Found ${otherChatIds.length} duplicate/old chats for this pair. Merging...`);
        
        // Ensure unified chat exists
        const existingUnified = await db.query('SELECT id FROM chats WHERE id = $1', [unifiedId]);
        if (existingUnified.rows.length === 0) {
          console.log(`Creating unified chat record: ${unifiedId}`);
          await db.query(
            'INSERT INTO chats (id, buyer_id, seller_id, listing_id, is_active) VALUES ($1, $2, $3, $4, 1)',
            [unifiedId, buyerId, sellerId, chat.listing_id]
          );
        }
        
        // Move messages
        for (const oldId of otherChatIds) {
          console.log(`Moving messages from ${oldId} to ${unifiedId}`);
          await db.query('UPDATE chat_messages SET chat_id = $1 WHERE chat_id = $2', [unifiedId, oldId]);
          // Delete old chat record
          await db.query('DELETE FROM chats WHERE id = $1', [oldId]);
        }
      }
    }
    
    console.log('Unification complete!');
    process.exit(0);
  } catch (error) {
    console.error('Unification failed:', error);
    process.exit(1);
  }
}

unifyExistingChats();
