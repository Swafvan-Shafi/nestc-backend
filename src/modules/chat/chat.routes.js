const express = require('express');
const chatController = require('./chat.controller');
const authMiddleware = require('../../middleware/auth.middleware');

const router = express.Router();

router.post('/conversations', authMiddleware, chatController.createConversation);
router.get('/conversations', authMiddleware, chatController.getConversations);
router.get('/messages/:chatId', authMiddleware, chatController.getMessages);
router.get('/unread', authMiddleware, chatController.getUnreadMessages);
router.post('/read/:chatId', authMiddleware, chatController.markAsRead);
router.delete('/conversations/:chatId', authMiddleware, chatController.deleteConversation);

module.exports = router;
