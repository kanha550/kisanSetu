const User = require('../model/User');
const Crop = require('../model/Crop');
const Order = require('../model/Order');
const Report = require('../model/Report');

const mockAdmin = {
  name: 'KisanSetu Admin',
  email: 'admin@kisansetu.com',
  password: 'password123',
  role: 'admin',
  phone: '9999999999',
  location: 'Noida, Uttar Pradesh'
};

const seedDatabase = async () => {
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.log('Mongoose is not connected. Skipping MongoDB Cloud seeder. Memory database fallback is fully active.');
      return;
    }
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('Database already populated, skipping seeding...');
      return;
    }

    console.log('Database is empty! Initiating automatic seeding (Clean Slate)...');
    
    // Create Admin Only
    const admin = await User.create(mockAdmin);
    console.log('Admin account created:', admin.email);
    console.log('Automatic database seeding complete (Admin Only)!');
  } catch (err) {
    console.error('Error seeding database:', err);
  }
};

module.exports = { seedDatabase };
