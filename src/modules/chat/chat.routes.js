const express = require('express');
const chatController = require('./chat.controller');
const authMiddleware = require('../../middleware/auth.middleware');

const router = express.Router();

router.get('/conversations', authMiddleware, chatController.getConversations);
router.get('/messages/:chatId', authMiddleware, chatController.getMessages);

module.exports = router;
