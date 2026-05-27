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

const app = express();

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

  app.listen(PORT, () => {
    console.log(`Server is running at: http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database connection:', err);
});