const User = require('../model/User');
const Crop = require('../model/Crop');
const Order = require('../model/Order');
const Report = require('../model/Report');
const mongoose = require('mongoose');
const memoryStore = require('../utils/memoryStore');

// @desc    Get dashboard summary statistics
// @route   GET /api/admin/stats
// @access  Private (Admin only)
const getStats = async (req, res) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const totalUsers = await User.countDocuments();
      const totalFarmers = await User.countDocuments({ role: 'farmer' });
      const totalBuyers = await User.countDocuments({ role: 'buyer' });
      const totalCrops = await Crop.countDocuments();
      const totalOrders = await Order.countDocuments();
      
      const orders = await Order.find({ status: { $ne: 'Cancelled' } });
      const grossGMV = orders.reduce((sum, order) => sum + order.totalPrice, 0);

      const pendingDisputes = await Report.countDocuments({ status: 'Pending' });

      return res.json({
        success: true,
        stats: {
          totalUsers,
          totalFarmers,
          totalBuyers,
          totalCrops,
          totalOrders,
          grossGMV,
          pendingDisputes
        }
      });
    } else {
      // IN-MEMORY FALLBACK MODE
      console.log('Database is offline. Fetching admin stats in In-Memory Fallback Mode.');
      const totalUsers = memoryStore.users.length;
      const totalFarmers = memoryStore.users.filter(u => u.role === 'farmer').length;
      const totalBuyers = memoryStore.users.filter(u => u.role === 'buyer').length;
      const totalCrops = memoryStore.crops.length;
      const totalOrders = memoryStore.orders.length;

      const nonCancelledOrders = memoryStore.orders.filter(o => o.status !== 'Cancelled');
      const grossGMV = nonCancelledOrders.reduce((sum, o) => sum + o.totalPrice, 0);

      const pendingDisputes = memoryStore.reports.filter(r => r.status === 'Pending').length;

      return res.json({
        success: true,
        stats: {
          totalUsers,
          totalFarmers,
          totalBuyers,
          totalCrops,
          totalOrders,
          grossGMV,
          pendingDisputes
        }
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error: ' + err.message });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getUsers = async (req, res) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const users = await User.find().select('-password').sort({ createdAt: -1 });
      return res.json({ success: true, count: users.length, users });
    } else {
      // IN-MEMORY FALLBACK MODE
      console.log('Database is offline. Fetching all users in In-Memory Fallback Mode.');
      const users = memoryStore.users.map(u => {
        const { password, ...userWithoutPassword } = u;
        return userWithoutPassword;
      });
      return res.json({ success: true, count: users.length, users });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error: ' + err.message });
  }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
const deleteUser = async (req, res) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (user.role === 'admin') {
        return res.status(400).json({ success: false, message: 'Cannot delete admin account' });
      }

      await Crop.deleteMany({ farmer: req.params.id });
      await Order.deleteMany({ $or: [{ buyer: req.params.id }, { farmer: req.params.id }] });
      await User.findByIdAndDelete(req.params.id);

      return res.json({ success: true, message: 'User and all associated data deleted successfully' });
    } else {
      // IN-MEMORY FALLBACK MODE
      console.log('Database is offline. Suspending user in In-Memory Fallback Mode.');
      const userIdx = memoryStore.users.findIndex(u => u._id.toString() === req.params.id.toString());
      if (userIdx === -1) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const user = memoryStore.users[userIdx];
      if (user.role === 'admin') {
        return res.status(400).json({ success: false, message: 'Cannot delete admin account' });
      }

      // Cascading cleanups in memory
      memoryStore.crops = memoryStore.crops.filter(c => c.farmer && c.farmer._id.toString() !== req.params.id.toString());
      memoryStore.orders = memoryStore.orders.filter(o => 
        (o.buyer && o.buyer._id.toString() !== req.params.id.toString()) &&
        (o.farmer && o.farmer._id.toString() !== req.params.id.toString())
      );
      
      memoryStore.users.splice(userIdx, 1);
      return res.json({ success: true, message: 'User and all associated data deleted successfully (Memory Mode)' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error: ' + err.message });
  }
};

// @desc    Get all reports/disputes
// @route   GET /api/admin/reports
// @access  Private (Admin only)
const getReports = async (req, res) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const reports = await Report.find()
        .populate('reportedBy', 'name email role')
        .populate('targetUser', 'name email role')
        .populate({
          path: 'order',
          populate: { path: 'crop', select: 'name price' }
        })
        .sort({ createdAt: -1 });

      return res.json({ success: true, count: reports.length, reports });
    } else {
      // IN-MEMORY FALLBACK MODE
      console.log('Database is offline. Fetching all disputes in In-Memory Fallback Mode.');
      const reports = [...memoryStore.reports].sort((a, b) => b.createdAt - a.createdAt);
      return res.json({ success: true, count: reports.length, reports });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error: ' + err.message });
  }
};

// @desc    Create a report (Escalate dispute)
// @route   POST /api/admin/reports
// @access  Private (Any logged in user can report disputes)
const createReport = async (req, res) => {
  try {
    const { targetUserId, orderId, reason, description } = req.body;

    if (!targetUserId || !reason || !description) {
      return res.status(400).json({ success: false, message: 'Please provide target user, reason and description' });
    }

    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const report = await Report.create({
        reportedBy: req.user._id,
        targetUser: targetUserId,
        order: orderId,
        reason,
        description
      });

      return res.status(201).json({ success: true, report });
    } else {
      // IN-MEMORY FALLBACK MODE
      console.log('Database is offline. Logging dispute ticket in In-Memory Fallback Mode.');
      const targetUser = memoryStore.users.find(u => u._id.toString() === targetUserId.toString());
      const order = memoryStore.orders.find(o => o._id.toString() === orderId.toString());

      const newReport = {
        _id: 'mem_report_' + Date.now(),
        reportedBy: {
          _id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role
        },
        targetUser: targetUser ? {
          _id: targetUser._id,
          name: targetUser.name,
          email: targetUser.email,
          role: targetUser.role
        } : { _id: targetUserId, name: 'Sourced Farmer', email: '', role: 'farmer' },
        order: order ? {
          _id: order._id,
          crop: { ...order.crop }
        } : undefined,
        reason,
        description,
        status: 'Pending',
        createdAt: new Date()
      };

      memoryStore.reports.push(newReport);
      return res.status(201).json({ success: true, report: newReport });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error: ' + err.message });
  }
};

// @desc    Update report status
// @route   PUT /api/admin/reports/:id
// @access  Private (Admin only)
const updateReportStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['Pending', 'Resolved', 'Dismissed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Please provide valid status' });
    }

    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const report = await Report.findById(req.params.id);
      if (!report) {
        return res.status(404).json({ success: false, message: 'Report not found' });
      }

      report.status = status;
      await report.save();

      return res.json({ success: true, report });
    } else {
      // IN-MEMORY FALLBACK MODE
      const reportIdx = memoryStore.reports.findIndex(r => r._id.toString() === req.params.id.toString());
      if (reportIdx === -1) {
        return res.status(404).json({ success: false, message: 'Report not found' });
      }

      const report = memoryStore.reports[reportIdx];
      report.status = status;
      memoryStore.reports[reportIdx] = report;

      return res.json({ success: true, report });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error: ' + err.message });
  }
};

module.exports = {
  getStats,
  getUsers,
  deleteUser,
  getReports,
  createReport,
  updateReportStatus
};
