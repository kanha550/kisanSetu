const bcrypt = require('bcryptjs');

// In-Memory Data Collections
const users = [];
const crops = [];
const orders = [];
const reports = [];
const conversations = [];
const messages = [];

// Prepopulate only the secure Admin profile for sandbox moderation testing
const seedMemoryDb = () => {
  if (users.length > 0) return;

  console.log('Initializing KisanSetu In-Memory Fallback Database (Clean Slate)...');

  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync('password123', salt);

  // Seed Admin Profile Only
  const admin = {
    _id: 'mem_admin_id',
    name: 'KisanSetu Admin',
    email: 'admin@kisansetu.com',
    password: hashedPassword,
    role: 'admin',
    phone: '9999999999',
    location: 'Noida, Uttar Pradesh',
    createdAt: new Date()
  };

  users.push(admin);

  console.log('In-Memory Fallback Seeded with Admin only (Clean Slate)!');
};

// Auto run seeder
seedMemoryDb();

module.exports = {
  users,
  crops,
  orders,
  reports,
  conversations,
  messages,
  seedMemoryDb
};
