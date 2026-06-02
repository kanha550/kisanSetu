const Conversation = require('../model/Conversation');
const Message = require('../model/Message');
const mongoose = require('mongoose');
const memoryStore = require('../utils/memoryStore');

exports.getOrCreateConversation = async (req, res) => {
  try {
    const { partnerId, orderId } = req.body;
    const userId = req.user._id.toString();
    const partnerIdStr = partnerId.toString();

    if (!partnerId) {
      return res.status(400).json({ success: false, message: 'Partner ID is required' });
    }

    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      let conversation = await Conversation.findOne({
        participants: { $all: [userId, partnerId] },
        ...(orderId && { order: orderId })
      }).populate('participants', 'name role image');

      if (!conversation) {
        conversation = new Conversation({
          participants: [userId, partnerId],
          order: orderId || null
        });
        await conversation.save();
        conversation = await conversation.populate('participants', 'name role image');
      }

      return res.status(200).json({ success: true, conversation });
    } else {
      // IN-MEMORY FALLBACK
      let conv = memoryStore.conversations.find(c => 
        c.participants.some(p => p._id.toString() === userId) && 
        c.participants.some(p => p._id.toString() === partnerIdStr) &&
        (orderId ? c.order?._id?.toString() === orderId.toString() : true)
      );

      if (!conv) {
        const partner = memoryStore.users.find(u => u._id.toString() === partnerIdStr) || { _id: partnerIdStr, name: 'Unknown User' };
        const me = memoryStore.users.find(u => u._id.toString() === userId) || req.user;
        
        let orderObj = null;
        if (orderId) {
          orderObj = memoryStore.orders.find(o => o._id.toString() === orderId.toString());
        }

        conv = {
          _id: 'mem_conv_' + Date.now(),
          participants: [
            { _id: me._id, name: me.name, role: me.role, image: me.image },
            { _id: partner._id, name: partner.name, role: partner.role, image: partner.image }
          ],
          order: orderObj,
          lastMessage: '',
          lastMessageAt: new Date(),
          createdAt: new Date()
        };
        memoryStore.conversations.push(conv);
      }
      return res.status(200).json({ success: true, conversation: conv });
    }
  } catch (error) {
    console.error('Error in getOrCreateConversation:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

exports.getMyConversations = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const conversations = await Conversation.find({ participants: userId })
        .populate('participants', 'name role image')
        .populate({
          path: 'order',
          select: 'crop quantity status',
          populate: { path: 'crop', select: 'name' }
        })
        .sort({ lastMessageAt: -1 });

      const conversationsWithUnread = await Promise.all(
        conversations.map(async (conv) => {
          const unreadCount = await Message.countDocuments({
            conversation: conv._id,
            sender: { $ne: userId },
            status: { $ne: 'read' }
          });
          return { ...conv.toObject(), unreadCount };
        })
      );

      return res.status(200).json({ success: true, conversations: conversationsWithUnread });
    } else {
      // IN-MEMORY FALLBACK
      let convs = memoryStore.conversations
        .filter(c => c.participants.some(p => p._id.toString() === userId))
        .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

      const conversationsWithUnread = convs.map(conv => {
        const unreadCount = memoryStore.messages.filter(m => 
          m.conversation.toString() === conv._id.toString() && 
          m.sender._id.toString() !== userId && 
          m.status !== 'read'
        ).length;
        return { ...conv, unreadCount };
      });

      return res.status(200).json({ success: true, conversations: conversationsWithUnread });
    }
  } catch (error) {
    console.error('Error in getMyConversations:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const messages = await Message.find({ conversation: conversationId })
        .populate('sender', 'name')
        .sort({ createdAt: 1 });

      return res.status(200).json({ success: true, messages });
    } else {
      // IN-MEMORY FALLBACK
      const messages = memoryStore.messages
        .filter(m => m.conversation.toString() === conversationId.toString())
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      return res.status(200).json({ success: true, messages });
    }
  } catch (error) {
    console.error('Error in getMessages:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.markMessagesRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id.toString();
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      await Message.updateMany(
        { conversation: conversationId, sender: { $ne: userId }, status: { $ne: 'read' } },
        { $set: { status: 'read' } }
      );
    } else {
      // IN-MEMORY FALLBACK
      memoryStore.messages.forEach(m => {
        if (m.conversation.toString() === conversationId.toString() && m.sender._id.toString() !== userId) {
          m.status = 'read';
        }
      });
    }
    res.status(200).json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error in markMessagesRead:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text } = req.body;
    const senderId = req.user._id.toString();

    if (!text) {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }

    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const message = new Message({ conversation: conversationId, sender: senderId, text });
      await message.save();

      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: text,
        lastMessageAt: Date.now()
      });

      await message.populate('sender', 'name');
      return res.status(201).json({ success: true, message });
    } else {
      // IN-MEMORY FALLBACK
      const senderObj = memoryStore.users.find(u => u._id.toString() === senderId) || req.user;
      
      const message = {
        _id: 'mem_msg_' + Date.now(),
        conversation: conversationId,
        sender: { _id: senderObj._id, name: senderObj.name },
        text,
        status: 'sent',
        createdAt: new Date()
      };
      
      memoryStore.messages.push(message);
      
      const conv = memoryStore.conversations.find(c => c._id.toString() === conversationId.toString());
      if (conv) {
        conv.lastMessage = text;
        conv.lastMessageAt = new Date();
      }

      return res.status(201).json({ success: true, message });
    }
  } catch (error) {
    console.error('Error in sendMessage:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
