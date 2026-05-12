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
    const { chatId, senderId, receiverId, content, listingId, productContext } = data;
    
    try {
      // Always use deterministic ID to ensure sync with frontend
      const ids = [senderId, receiverId].sort();
      const baseId = `p2p_${ids[0].substring(0, 8)}_${ids[1].substring(0, 8)}`;
      let finalChatId = listingId ? `${baseId}_listing${listingId}` : baseId;
      
      const messageId = randomUUID();
      let isFirstMessage = false;

      const existingChat = await db.query('SELECT id FROM chats WHERE id = $1', [finalChatId]);
      if (!existingChat.rows || existingChat.rows.length === 0) {
        await db.query(
          'INSERT INTO chats (id, buyer_id, seller_id, listing_id, is_active) VALUES ($1, $2, $3, $4, 1)',
          [finalChatId, senderId, receiverId, listingId || null]
        );
        isFirstMessage = true;
      } else if (listingId) {
        await db.query('UPDATE chats SET listing_id = $1 WHERE id = $2 AND (listing_id IS NULL OR listing_id = "")', [listingId, finalChatId]);
      }

      const pContextStr = productContext ? JSON.stringify(productContext) : null;

      await db.query(
        'INSERT INTO chat_messages (id, chat_id, sender_id, content, listing_id, product_context) VALUES ($1, $2, $3, $4, $5, $6)',
        [messageId, finalChatId, senderId, content, listingId || null, pContextStr]
      );
      
      const message = {
        id: messageId,
        chat_id: finalChatId,
        sender_id: senderId,
        content: content,
        listing_id: listingId || null,
        product_context: productContext || null,
        created_at: new Date(),
        is_read: false
      };
      
      // Emit to the deterministic room
      io.to(finalChatId).emit('new_message', { chatId: finalChatId, message });

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

        // Send email if it's the first message in this thread
        if (isFirstMessage) {
           console.log(`📧 Attempting to send enquiry email to receiver ${receiverId}`);
           try {
             const recipientRes = await db.query('SELECT name, email FROM users WHERE id = $1', [receiverId]);
             const senderRes = await db.query('SELECT name FROM users WHERE id = $1', [senderId]);
             
             if (recipientRes.rows && recipientRes.rows[0] && senderRes.rows && senderRes.rows[0]) {
               let productInfo = null;
               if (listingId) {
                 const listingRes = await db.query('SELECT title, price FROM listings WHERE id = $1', [listingId]);
                 productInfo = listingRes.rows[0];
               }

               console.log(`📧 Sending mail to ${recipientRes.rows[0].email}...`);
               await sendChatNotification(
                 recipientRes.rows[0].email, 
                 senderRes.rows[0].name, 
                 displayBody,
                 productInfo,
                 finalChatId
               );
             } else {
               console.warn('⚠️ Could not find recipient or sender info for email');
             }
           } catch (e) {
             console.error('❌ Email Notification Error:', e.message);
           }
        }
      }
    } catch (err) {
      console.error('❌ Socket Message Delivery Error:', err.message);
    }
  });

  socket.on('mark_read', async (data) => {
    const { chatId, userId } = data;
    try {
      await db.query('UPDATE chat_messages SET is_read = 1 WHERE chat_id = $1 AND sender_id != $2', [chatId, userId]);
      io.to(chatId).emit('chat_read', { chatId });
    } catch (err) {
      console.error('Error marking chat read:', err.message);
    }
  });
};

module.exports = registerChatHandlers;
