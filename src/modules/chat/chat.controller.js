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

module.exports = {
  getMessages,
  getConversations
};
