const db = require('../../config/db');
const { randomUUID } = require('crypto');

const getMessages = async (chatId) => {
  const result = await db.query(
    'SELECT * FROM chat_messages WHERE chat_id = $1 ORDER BY created_at ASC',
    [chatId]
  );
  return (result.rows || []).map(msg => ({
    ...msg,
    product_context: typeof msg.product_context === 'string' ? JSON.parse(msg.product_context) : msg.product_context
  }));
};

const getConversations = async (userId) => {
  const result = await db.query(
    `SELECT c.*, 
            u.name as other_user_name,
            u.id as other_user_id,
            u.email as other_user_email,
            l.title as product_name,
            l.photo as product_image,
            l.price as product_price,
            (SELECT content FROM chat_messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
            (SELECT created_at FROM chat_messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
            (SELECT COUNT(*) FROM chat_messages WHERE chat_id = c.id AND sender_id != $1 AND is_read = 0) as unread_count
     FROM chats c
     JOIN users u ON u.id = (CASE WHEN c.buyer_id = $1 THEN c.seller_id ELSE c.buyer_id END)
     LEFT JOIN listings l ON c.listing_id = l.id
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
    `SELECT m.*, m.chat_id, u.name as sender_name, c.listing_id, l.title as product_title
     FROM chat_messages m
     JOIN chats c ON m.chat_id = c.id
     JOIN users u ON m.sender_id = u.id
     LEFT JOIN listings l ON c.listing_id = l.id
     WHERE (c.buyer_id = $1 OR c.seller_id = $1)
     AND m.sender_id != $1
     AND m.is_read = 0
     ORDER BY m.created_at DESC`,
    [userId]
  );
  return result.rows || [];
};

const getOrCreateConversation = async (buyerId, sellerId, listingId) => {
  const ids = [buyerId, sellerId].sort();
  const baseId = `p2p_${ids[0].substring(0, 8)}_${ids[1].substring(0, 8)}`;
  const finalChatId = listingId ? `${baseId}_listing${listingId}` : baseId;

  const existing = await db.query('SELECT * FROM chats WHERE id = $1', [finalChatId]);
  if (existing.rows && existing.rows.length > 0) return existing.rows[0];

  // Create new
  await db.query(
    'INSERT INTO chats (id, buyer_id, seller_id, listing_id, is_active) VALUES ($1, $2, $3, $4, 1)',
    [finalChatId, buyerId, sellerId, listingId || null]
  );
  
  const created = await db.query('SELECT * FROM chats WHERE id = $1', [finalChatId]);
  return created.rows[0];
};

module.exports = {
  getMessages,
  getConversations,
  markAsRead,
  getUnreadMessages,
  getOrCreateConversation
};
