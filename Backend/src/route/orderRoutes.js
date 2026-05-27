const express = require('express');
const router = express.Router();
const {
  createOrder,
  getBuyerOrders,
  getFarmerOrders,
  updateOrderStatus
} = require('../controller/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('buyer'), createOrder);
router.get('/buyer', protect, authorize('buyer'), getBuyerOrders);
router.get('/farmer', protect, authorize('farmer'), getFarmerOrders);
router.put('/:id/status', protect, updateOrderStatus);

module.exports = router;
