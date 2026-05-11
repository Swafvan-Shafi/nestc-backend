const chatService = require('./chat.service');

const getMessages = async (req, res) => {
  try {
    const messages = await chatService.getMessages(req.params.chatId);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getConversations = async (req, res) => {
  try {
    const conversations = await chatService.getConversations(req.user.id);
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getUnreadMessages = async (req, res) => {
  try {
    const unread = await chatService.getUnreadMessages(req.user.id);
    res.json(unread);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const result = await chatService.markAsRead(req.params.chatId, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createConversation = async (req, res) => {
  try {
    const { sellerId, listingId } = req.body;
    const conversation = await chatService.getOrCreateConversation(req.user.id, sellerId, listingId);
    res.json(conversation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getMessages,
  getConversations,
  getUnreadMessages,
  markAsRead,
  createConversation
};
