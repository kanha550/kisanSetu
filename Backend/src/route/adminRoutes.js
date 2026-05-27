const express = require('express');
const router = express.Router();
const {
  getStats,
  getUsers,
  deleteUser,
  getReports,
  createReport,
  updateReportStatus
} = require('../controller/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Report creation is available to any authenticated user (e.g., buyer filing dispute)
router.post('/reports', protect, createReport);

// All other operations are strictly limited to Admin accounts
router.get('/stats', protect, authorize('admin'), getStats);
router.get('/users', protect, authorize('admin'), getUsers);
router.delete('/users/:id', protect, authorize('admin'), deleteUser);
router.get('/reports', protect, authorize('admin'), getReports);
router.put('/reports/:id', protect, authorize('admin'), updateReportStatus);

module.exports = router;
