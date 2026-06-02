const express = require('express');
const router = express.Router();
const { 
  getOrCreateConversation, 
  getMyConversations, 
  getMessages, 
  sendMessage, 
  markMessagesRead 
} = require('../controller/chatController');
const { protect } = require('../middleware/authMiddleware');

// All chat routes require authentication
router.use(protect);

router.post('/conversation', getOrCreateConversation);
router.get('/conversations', getMyConversations);
router.get('/messages/:conversationId', getMessages);
router.post('/messages/:conversationId', sendMessage);
router.put('/messages/:conversationId/read', markMessagesRead);

module.exports = router;
