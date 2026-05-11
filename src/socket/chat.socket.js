const db = require('../config/db');
const { randomUUID } = require('crypto');
const { sendChatNotification } = require('../utils/mailer');

const registerChatHandlers = (io, socket) => {
  socket.on('register_user', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`📡 User ${userId} registered for global notifications`);
  });

  socket.on('join_chat', (chatId) => {
    socket.join(chatId);
  });

  socket.on('send_message', async (data) => {
    const { chatId, senderId, receiverId, content, listingId } = data;
    
    try {
      // Always use deterministic ID to ensure sync with frontend
      const ids = [senderId, receiverId].sort();
      const baseId = `p2p_${ids[0].substring(0, 8)}_${ids[1].substring(0, 8)}`;
      let finalChatId = listingId ? `${baseId}_${listingId.substring(0, 8)}` : baseId;
      
      const messageId = randomUUID();
      let isFirstMessage = false;

      const existingChat = await db.query('SELECT id FROM chats WHERE id = ?', [finalChatId]);
      if (existingChat.length === 0 || !existingChat[0]) {
        await db.query(
          'INSERT INTO chats (id, buyer_id, seller_id, listing_id, is_active) VALUES (?, ?, ?, ?, 1)',
          [finalChatId, senderId, receiverId, listingId || null]
        );
        isFirstMessage = true;
      } else if (listingId) {
        await db.query('UPDATE chats SET listing_id = ? WHERE id = ? AND (listing_id IS NULL OR listing_id = "")', [listingId, finalChatId]);
      }

      await db.query(
        'INSERT INTO chat_messages (id, chat_id, sender_id, content, listing_id) VALUES (?, ?, ?, ?, ?)',
        [messageId, finalChatId, senderId, content, listingId || null]
      );
      
      const message = {
        id: messageId,
        chat_id: finalChatId,
        sender_id: senderId,
        content: content,
        listing_id: listingId || null,
        created_at: new Date(),
        is_read: false
      };
      
      io.to(finalChatId).emit('new_message', { chatId: finalChatId, message });
      io.to(chatId).emit('new_message', { chatId: finalChatId, message });

      if (receiverId) {
        io.to(`user_${receiverId}`).emit('new_message', { chatId: finalChatId, message });
        
        let displayBody = content;
        if (content.startsWith('data:image')) displayBody = '📷 Sent a photo';
        
        const isProductEnquiry = content.startsWith('PRODUCT_ENQUIRY:');
        if (isProductEnquiry) displayBody = '📦 New Product Enquiry';

        io.to(`user_${receiverId}`).emit('notification', {
          id: messageId,
          type: 'chat',
          title: 'New Message',
          body: displayBody,
          time: 'Just now',
          read: false,
          chatId: finalChatId
        });

        if (isFirstMessage) {
           try {
             const recipientRes = await db.query('SELECT name, email FROM users WHERE id = ?', [receiverId]);
             const senderRes = await db.query('SELECT name FROM users WHERE id = ?', [senderId]);
             
             const recipient = recipientRes[0] || (recipientRes.rows ? recipientRes.rows[0] : null);
             const sender = senderRes[0] || (senderRes.rows ? senderRes.rows[0] : null);

             if (recipient && sender) {
               let productInfo = null;
               if (listingId) {
                 const listingRes = await db.query('SELECT title, price FROM listings WHERE id = ?', [listingId]);
                 productInfo = listingRes[0] || (listingRes.rows ? listingRes.rows[0] : null);
               }

               await sendChatNotification(
                 recipient.email, 
                 sender.name, 
                 displayBody,
                 productInfo,
                 finalChatId
               );
             }
           } catch (e) {
             console.error('Email Error:', e.message);
           }
        }
      }
    } catch (err) {
      console.error('❌ Delivery Error:', err.message);
    }
  });

  socket.on('mark_read', async (data) => {
    const { chatId, userId } = data;
    try {
      await db.query('UPDATE chat_messages SET is_read = 1 WHERE chat_id = ? AND sender_id != ?', [chatId, userId]);
      io.to(chatId).emit('chat_read', { chatId });
    } catch (err) {
      console.error('Error marking chat read:', err.message);
    }
  });
};

module.exports = registerChatHandlers;
