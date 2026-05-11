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
            (SELECT created_at FROM chat_messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
            (SELECT COUNT(*) FROM chat_messages WHERE chat_id = c.id AND sender_id != $1 AND is_read = 0) as unread_count
     FROM chats c
     JOIN users u ON (u.id = c.buyer_id OR u.id = c.seller_id) AND u.id != $1
     WHERE c.buyer_id = $1 OR c.seller_id = $1
     ORDER BY last_message_time DESC`,
    [userId]
  );
  return result.rows || [];
};

const markAsRead = async (chatId, userId) => {
  await db.query(
    'UPDATE chat_messages SET is_read = 1 WHERE chat_id = $1 AND sender_id != $2',
    [chatId, userId]
  );
  return { success: true };
};

const getUnreadMessages = async (userId) => {
  const result = await db.query(
    `SELECT m.*, u.name as sender_name, c.listing_id, l.title as product_title
     FROM chat_messages m
     JOIN chats c ON m.chat_id = c.id
     JOIN users u ON m.sender_id = u.id
     LEFT JOIN listings l ON m.listing_id = l.id
     WHERE (c.buyer_id = $1 OR c.seller_id = $1)
     AND m.sender_id != $1
     AND m.is_read = 0
     ORDER BY m.created_at DESC`,
    [userId]
  );
  return result.rows || [];
};

module.exports = {
  getMessages,
  getConversations,
  markAsRead,
  getUnreadMessages
};
