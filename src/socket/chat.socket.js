const db = require('../config/db');
const { randomUUID } = require('crypto');
const { sendChatNotification } = require('../utils/mailer');

const registerChatHandlers = (io, socket) => {
  socket.on('register_user', (userId) => {
    socket.userId = userId;
    socket.join(`user_${userId}`);
    console.log(`📡 User ${userId} registered for global notifications`);
  });

  socket.on('join_chat', async (chatId) => {
    socket.join(chatId);
    if (socket.userId) {
      try {
        await db.query('UPDATE chat_messages SET is_delivered = 1, is_read = 1 WHERE chat_id = $1 AND sender_id != $2', [chatId, socket.userId]);
        io.to(chatId).emit('messages_delivered', { chatId });
        // Emit 'messages_read' to clear notifications on other devices/windows
        io.to(`user_${socket.userId}`).emit('messages_read', { chatId });
      } catch (err) {
        console.error('Error marking messages as delivered:', err);
      }
    }
  });

  socket.on('send_message', async (data, callback) => {
    console.log('📬 Socket Received send_message:', JSON.stringify(data, null, 2));
    const { chatId, senderId, receiverId, content, listingId, productContext } = data;
    
    try {
      if (!senderId || !receiverId) {
        if (callback) callback({ success: false, error: 'Missing IDs' });
        return;
      }

      // 1. Determine Deterministic Chat ID (Unified P2P)
      const ids = [senderId, receiverId].sort();
      const finalChatId = `p2p_${ids[0].substring(0, 8)}_${ids[1].substring(0, 8)}`;
      
      const messageId = randomUUID();

      // 2. Ensure Chat record exists
      const existingChat = await db.query('SELECT id FROM chats WHERE id = $1', [finalChatId]);
      if (!existingChat.rows || existingChat.rows.length === 0) {
        await db.query(
          'INSERT INTO chats (id, buyer_id, seller_id, listing_id, is_active) VALUES ($1, $2, $3, $4, 1)',
          [finalChatId, senderId, receiverId, listingId || null]
        );
      }

      // 3. Check for First Message (for email logic)
      const msgCountRes = await db.query('SELECT COUNT(*) as count FROM chat_messages WHERE chat_id = $1', [finalChatId]);
      const isFirstMessage = parseInt(msgCountRes.rows[0].count) === 0;

      // 4. Save Message
      const pContextStr = productContext ? JSON.stringify(productContext) : null;
      const room = io.sockets.adapter.rooms.get(finalChatId);
      const isDelivered = (room && room.size > 1) ? 1 : 0;
      
      await db.query(
        'INSERT INTO chat_messages (id, chat_id, sender_id, content, listing_id, product_context, is_delivered) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [messageId, finalChatId, senderId, content, listingId || null, pContextStr, isDelivered]
      );

      const message = {
        id: messageId,
        chat_id: finalChatId,
        sender_id: senderId,
        content: content,
        listing_id: listingId || null,
        product_context: productContext || null,
        created_at: new Date(),
        is_read: false,
        is_delivered: !!isDelivered
      };
      
      // 5. Acknowledge Sender (Triggers Single Tick)
      if (callback) callback({ success: true, message });

      // 6. Broadcast
      io.to(finalChatId).emit('new_message', { chatId: finalChatId, message });
      if (receiverId) {
        io.to(`user_${receiverId}`).emit('new_message', { chatId: finalChatId, message });
        
        // 7. Emit 'notification' for the Dropdown
        const senderRes = await db.query('SELECT name FROM users WHERE id = $1', [senderId]);
        const senderName = senderRes.rows?.[0]?.name || 'Student';
        
        io.to(`user_${receiverId}`).emit('notification', {
          id: messageId,
          type: 'chat',
          title: `Message from ${senderName}`,
          body: content,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: false,
          chatId: finalChatId
        });
        
        // 7. First Message Email Logic
        if (isFirstMessage && productContext) {
            console.log(`📧 Sending first-message inquiry email for ${finalChatId}`);
            try {
              const recipientRes = await db.query('SELECT name, email FROM users WHERE id = $1', [receiverId]);
              const senderRes = await db.query('SELECT name FROM users WHERE id = $1', [senderId]);
              
              if (recipientRes.rows?.[0] && senderRes.rows?.[0]) {
                let productInfo = null;
                if (listingId) {
                  const listingRes = await db.query('SELECT title, price FROM listings WHERE id = $1', [listingId]);
                  productInfo = listingRes.rows?.[0];
                }

                await sendChatNotification(
                  recipientRes.rows[0].email, 
                  senderRes.rows[0].name, 
                  content,
                  productInfo,
                  finalChatId
                );
              }
            } catch (e) { console.error('❌ Email Error:', e.message); }
        }
      }
    } catch (err) {
      console.error('❌ Send Message Error:', err.message);
      if (callback) callback({ success: false, error: err.message });
    }
  });

  socket.on('mark_read', async ({ chatId, userId }) => {
    try {
      await db.query('UPDATE chat_messages SET is_read = 1 WHERE chat_id = $1 AND sender_id != $2', [chatId, userId]);
      io.to(chatId).emit('chat_read', { chatId });
    } catch (err) { console.error('Error marking chat read:', err.message); }
  });
};

module.exports = registerChatHandlers;
