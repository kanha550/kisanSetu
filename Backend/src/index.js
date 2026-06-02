require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const dbConnect = require('./config/db');
const { seedDatabase } = require('./utils/seeder');

// Route imports
const authRoutes = require('./route/authRoutes');
const cropRoutes = require('./route/cropRoutes');
const orderRoutes = require('./route/orderRoutes');
const adminRoutes = require('./route/adminRoutes');
const uploadRoutes = require('./route/uploadRoutes');
const chatRoutes = require('./route/chatRoutes'); // NEW CHAT ROUTE
const http = require('http'); // REQUIRED FOR SOCKET.IO
const { Server } = require('socket.io'); // SOCKET.IO
const jwt = require('jsonwebtoken'); // FOR SOCKET AUTH
const Conversation = require('./model/Conversation');
const Message = require('./model/Message');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", // allow all origins for dev
    methods: ["GET", "POST"]
  }
});

// Socket.IO Middleware for Authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Authentication error"));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'kisansetu_secret_key');
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error("Authentication error"));
  }
});

// Global set of online user IDs
const onlineUsers = new Set();

io.on('connection', (socket) => {
  const userId = socket.user.id;
  onlineUsers.add(userId);
  
  // Broadcast that this user is online
  io.emit('user_status_change', { userId, status: 'online' });
  
  // Allow clients to request online status of multiple users
  socket.on('check_online_status', (userIds) => {
    const statuses = {};
    userIds.forEach(id => {
      statuses[id] = onlineUsers.has(id) ? 'online' : 'offline';
    });
    socket.emit('online_status_response', statuses);
  });

  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
  });

  socket.on('send_message', async (data) => {
    try {
      const { conversationId, text } = data;
      const mongoose = require('mongoose');
      const isDbConnected = mongoose.connection.readyState === 1;

      let populatedMessage;

      if (isDbConnected) {
        // Find recipient to check if online
        const conversation = await Conversation.findById(conversationId);
        const recipientId = conversation?.participants.find(p => p.toString() !== userId.toString());
        const isRecipientOnline = recipientId && onlineUsers.has(recipientId.toString());

        // Save message to DB
        const message = new Message({
          conversation: conversationId,
          sender: userId,
          text,
          status: isRecipientOnline ? 'delivered' : 'sent'
        });
        await message.save();
        
        // Populate sender name for frontend UI
        await message.populate('sender', 'name');
        populatedMessage = message;

        // Update conversation lastMessage
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: text,
          lastMessageAt: Date.now()
        });
      } else {
        const memoryStore = require('./utils/memoryStore');
        const conv = memoryStore.conversations.find(c => c._id.toString() === conversationId.toString());
        const recipient = conv?.participants.find(p => p._id.toString() !== userId.toString());
        const isRecipientOnline = recipient && onlineUsers.has(recipient._id.toString());

        const senderObj = memoryStore.users.find(u => u._id.toString() === userId.toString()) || { _id: userId, name: 'User' };
        populatedMessage = {
          _id: 'mem_msg_' + Date.now(),
          conversation: conversationId,
          sender: { _id: senderObj._id, name: senderObj.name },
          text,
          status: isRecipientOnline ? 'delivered' : 'sent',
          createdAt: new Date()
        };
        memoryStore.messages.push(populatedMessage);
        
        if (conv) {
          conv.lastMessage = text;
          conv.lastMessageAt = new Date();
        }
      }

      // Broadcast message to everyone in the conversation room
      io.to(conversationId).emit('receive_message', populatedMessage);
    } catch (error) {
      console.error('Socket send_message error:', error);
    }
  });

  socket.on('mark_read', async ({ conversationId }) => {
    try {
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState === 1) {
        await Message.updateMany(
          { conversation: conversationId, sender: { $ne: userId }, status: { $ne: 'read' } },
          { $set: { status: 'read' } }
        );
      } else {
        const memoryStore = require('./utils/memoryStore');
        memoryStore.messages.forEach(m => {
          if (m.conversation.toString() === conversationId.toString() && m.sender._id.toString() !== userId.toString()) {
            m.status = 'read';
          }
        });
      }
      
      // Notify the sender that their messages were read
      socket.to(conversationId).emit('message_status_update', { conversationId, status: 'read' });
    } catch (error) {
      console.error('Socket mark_read error:', error);
    }
  });

  socket.on('disconnect', () => {
    // Check if user has no other active sockets
    let stillOnline = false;
    io.sockets.sockets.forEach(s => {
      if (s.user && s.user.id === userId && s.id !== socket.id) {
        stillOnline = true;
      }
    });
    
    if (!stillOnline) {
      onlineUsers.delete(userId);
      io.emit('user_status_change', { userId, status: 'offline' });
    }
  });
});

// Middlewares
app.use(cors());
app.use(express.json());

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/chat', chatRoutes); // MOUNT CHAT ROUTE

// Base route for connectivity check
app.get('/', (req, res) => {
  res.json({ success: true, message: 'KisanSetu Backend API is running successfully!' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(err.status || 500).json({ 
    success: false, 
    message: err.message || 'Internal Server Error' 
  });
});

const PORT = process.env.PORT || 550;

dbConnect().then(async () => {
  // Execute auto-seeding
  await seedDatabase();

  server.listen(PORT, () => {
    console.log(`Server (HTTP + Socket.IO) is running at: http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database connection:', err);
});