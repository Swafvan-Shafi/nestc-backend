const db = require('../../config/db');

const getMessages = async (chatId) => {
  const result = await db.query(
    'SELECT * FROM chat_messages WHERE chat_id = $1 ORDER BY created_at ASC',
    [chatId]
  );
  return result.rows || [];
};

const getConversations = async (userId) => {
  const result = await db.query(
    `SELECT c.*, 
            u.name as other_user_name,
            u.id as other_user_id,
            c.listing_id,
            c.seller_id as chat_seller_id,
            (SELECT content FROM chat_messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
            (SELECT created_at FROM chat_messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time
     FROM chats c
     JOIN users u ON (u.id = c.buyer_id OR u.id = c.seller_id) AND u.id != $1
     WHERE c.buyer_id = $1 OR c.seller_id = $1
     ORDER BY last_message_time DESC`,
    [userId]
  );
  return result.rows || [];
};

module.exports = {
  getMessages,
  getConversations
};
