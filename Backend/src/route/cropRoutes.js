const express = require('express');
const router = express.Router();
const {
  getCrops,
  getFarmerCrops,
  getCropById,
  createCrop,
  updateCrop,
  deleteCrop
} = require('../controller/cropController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', getCrops);
router.get('/farmer', protect, authorize('farmer'), getFarmerCrops);
router.get('/:id', getCropById);
router.post('/', protect, authorize('farmer'), createCrop);
router.put('/:id', protect, authorize('farmer', 'admin'), updateCrop);
router.delete('/:id', protect, authorize('farmer', 'admin'), deleteCrop);

module.exports = router;
