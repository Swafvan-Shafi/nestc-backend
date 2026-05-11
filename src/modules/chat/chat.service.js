const db = require('../../config/db');
const { randomUUID } = require('crypto');

const getMessages = async (chatId) => {
  const result = await db.query(
    'SELECT * FROM chat_messages WHERE chat_id = ? ORDER BY created_at ASC',
    [chatId]
  );
  // Support both result and result.rows depending on DB driver
  return Array.isArray(result) ? result : (result.rows || []);
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
            (SELECT COUNT(*) FROM chat_messages WHERE chat_id = c.id AND sender_id != ? AND is_read = 0) as unread_count
     FROM chats c
     JOIN users u ON (u.id = c.buyer_id OR u.id = c.seller_id) AND u.id != ?
     WHERE c.buyer_id = ? OR c.seller_id = ?
     ORDER BY last_message_time DESC`,
    [userId, userId, userId, userId]
  );
  return Array.isArray(result) ? result : (result.rows || []);
};

const markAsRead = async (chatId, userId) => {
  await db.query(
    'UPDATE chat_messages SET is_read = 1 WHERE chat_id = ? AND sender_id != ?',
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
     LEFT JOIN listings l ON c.listing_id = l.id
     WHERE (c.buyer_id = ? OR c.seller_id = ?)
     AND m.sender_id != ?
     AND m.is_read = 0
     ORDER BY m.created_at DESC`,
    [userId, userId, userId]
  );
  return Array.isArray(result) ? result : (result.rows || []);
};

const getOrCreateConversation = async (buyerId, sellerId, listingId) => {
  const ids = [buyerId, sellerId].sort();
  const baseId = `p2p_${ids[0].substring(0, 8)}_${ids[1].substring(0, 8)}`;
  const finalChatId = listingId ? `${baseId}_${listingId.substring(0, 8)}` : baseId;

  const existing = await db.query('SELECT * FROM chats WHERE id = ?', [finalChatId]);
  const rows = Array.isArray(existing) ? existing : (existing.rows || []);
  if (rows.length > 0) return rows[0];

  // Create new
  await db.query(
    'INSERT INTO chats (id, buyer_id, seller_id, listing_id, is_active) VALUES (?, ?, ?, ?, 1)',
    [finalChatId, buyerId, sellerId, listingId || null]
  );
  
  const created = await db.query('SELECT * FROM chats WHERE id = ?', [finalChatId]);
  const finalRows = Array.isArray(created) ? created : (created.rows || []);
  return finalRows[0];
};

module.exports = {
  getMessages,
  getConversations,
  markAsRead,
  getUnreadMessages,
  getOrCreateConversation
};
