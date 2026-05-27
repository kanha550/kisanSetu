const User = require('../model/User');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const memoryStore = require('../utils/memoryStore');

// Helper to generate token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'kisansetu_secret_key', {
    expiresIn: '30d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password, role, phone, location } = req.body;

    if (!name || !email || !password || !phone || !location) {
      return res.status(400).json({ success: false, message: 'Please fill in all fields' });
    }

    const emailLower = email.toLowerCase();
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const userExists = await User.findOne({ email: emailLower });
      if (userExists) {
        return res.status(400).json({ success: false, message: 'User already exists with this email' });
      }

      const user = await User.create({
        name,
        email: emailLower,
        password,
        role: role || 'buyer',
        phone,
        location
      });

      return res.status(201).json({
        success: true,
        token: generateToken(user._id),
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          location: user.location
        }
      });
    } else {
      // IN-MEMORY FALLBACK MODE
      console.log('Database is offline. Running registration in In-Memory Fallback Mode.');
      const userExists = memoryStore.users.find(u => u.email === emailLower);
      if (userExists) {
        return res.status(400).json({ success: false, message: 'User already exists with this email' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = {
        _id: 'mem_' + Date.now(),
        name,
        email: emailLower,
        password: hashedPassword,
        role: role || 'buyer',
        phone,
        location,
        createdAt: new Date()
      };

      memoryStore.users.push(newUser);

      return res.status(201).json({
        success: true,
        token: generateToken(newUser._id),
        user: {
          _id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          phone: newUser.phone,
          location: newUser.location
        }
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error: ' + err.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const emailLower = email.toLowerCase();
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const user = await User.findOne({ email: emailLower });
      if (user && (await user.comparePassword(password))) {
        return res.json({
          success: true,
          token: generateToken(user._id),
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            location: user.location
          }
        });
      }
    } else {
      // IN-MEMORY FALLBACK MODE
      console.log('Database is offline. Running login in In-Memory Fallback Mode.');
      const user = memoryStore.users.find(u => u.email === emailLower);
      if (user && (await bcrypt.compare(password, user.password))) {
        return res.json({
          success: true,
          token: generateToken(user._id),
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            location: user.location
          }
        });
      }
    }

    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error: ' + err.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    if (isDbConnected) {
      const user = await User.findById(req.user._id).select('-password');
      if (user) {
        return res.json({ success: true, user });
      }
    } else {
      // IN-MEMORY FALLBACK MODE
      const user = memoryStore.users.find(u => u._id.toString() === req.user._id.toString());
      if (user) {
        const { password, ...userWithoutPassword } = user;
        return res.json({ success: true, user: userWithoutPassword });
      }
    }
    res.status(404).json({ success: false, message: 'User not found' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error: ' + err.message });
  }
};

module.exports = { register, login, getMe };
