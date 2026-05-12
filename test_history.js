const db = require('./src/config/db');
async function test() {
  try {
    const u = await db.query('SELECT id FROM users LIMIT 2');
    if (u.rows.length < 2) return console.log('Need at least 2 users');
    const bid = u.rows[0].id;
    const sid = u.rows[1].id;
    const cid = 'test_chat_123';
    
    // Cleanup first
    await db.query('DELETE FROM chat_messages WHERE chat_id = $1', [cid]);
    await db.query('DELETE FROM chats WHERE id = $1', [cid]);
    
    await db.query('INSERT INTO chats (id, buyer_id, seller_id, is_active) VALUES ($1, $2, $3, 1)', [cid, bid, sid]);
    await db.query('INSERT INTO chat_messages (id, chat_id, sender_id, content) VALUES ($1, $2, $3, $4)', ['test_msg_1', cid, bid, 'Hello history test']);
    
    console.log('Insert successful');
    
    const conversations = await db.query(`
      SELECT c.*, 
             u.name as other_user_name,
             u.id as other_user_id
      FROM chats c
      LEFT JOIN users u ON u.id = (CASE WHEN c.buyer_id = $1 THEN c.seller_id ELSE c.buyer_id END)
      WHERE c.buyer_id = $1 OR c.seller_id = $1
    `, [bid]);
    
    console.log('Fetched conversations:', JSON.stringify(conversations.rows));
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}
test();
