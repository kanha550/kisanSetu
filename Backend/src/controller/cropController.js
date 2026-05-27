const Crop = require('../model/Crop');
const mongoose = require('mongoose');
const memoryStore = require('../utils/memoryStore');

// @desc    Get all crops with filtering and search
// @route   GET /api/crops
// @access  Public
const getCrops = async (req, res) => {
  try {
    const { category, location, search } = req.query;
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      let query = {};
      if (category && category !== 'All') {
        query.category = category;
      }
      if (location) {
        query.location = { $regex: location, $options: 'i' };
      }
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      const crops = await Crop.find(query).populate('farmer', 'name email phone location');
      return res.json({ success: true, count: crops.length, crops });
    } else {
      // IN-MEMORY FALLBACK MODE
      console.log('Database is offline. Fetching crops in In-Memory Fallback Mode.');
      let filteredCrops = [...memoryStore.crops];

      if (category && category !== 'All') {
        filteredCrops = filteredCrops.filter(c => c.category === category);
      }

      if (location) {
        const locLower = location.toLowerCase();
        filteredCrops = filteredCrops.filter(c => c.location && c.location.toLowerCase().includes(locLower));
      }

      if (search) {
        const queryLower = search.toLowerCase();
        filteredCrops = filteredCrops.filter(c => 
          (c.name && c.name.toLowerCase().includes(queryLower)) ||
          (c.description && c.description.toLowerCase().includes(queryLower))
        );
      }

      return res.json({ success: true, count: filteredCrops.length, crops: filteredCrops });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error: ' + err.message });
  }
};

// @desc    Get crops of logged in farmer
// @route   GET /api/crops/farmer
// @access  Private (Farmer only)
const getFarmerCrops = async (req, res) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const crops = await Crop.find({ farmer: req.user._id });
      return res.json({ success: true, count: crops.length, crops });
    } else {
      // IN-MEMORY FALLBACK MODE
      console.log('Database is offline. Fetching farmer crops in In-Memory Fallback Mode.');
      const crops = memoryStore.crops.filter(c => c.farmer && c.farmer._id.toString() === req.user._id.toString());
      return res.json({ success: true, count: crops.length, crops });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error: ' + err.message });
  }
};

// @desc    Get single crop by ID
// @route   GET /api/crops/:id
// @access  Public
const getCropById = async (req, res) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const crop = await Crop.findById(req.params.id).populate('farmer', 'name email phone location');
      if (!crop) {
        return res.status(404).json({ success: false, message: 'Crop not found' });
      }
      return res.json({ success: true, crop });
    } else {
      // IN-MEMORY FALLBACK MODE
      const crop = memoryStore.crops.find(c => c._id.toString() === req.params.id.toString());
      if (!crop) {
        return res.status(404).json({ success: false, message: 'Crop not found (Memory Mode)' });
      }
      return res.json({ success: true, crop });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error: ' + err.message });
  }
};

// @desc    Create a new crop listing
// @route   POST /api/crops
// @access  Private (Farmer only)
const createCrop = async (req, res) => {
  try {
    const { name, category, quantity, price, location, description, image } = req.body;

    if (!name || !category || !quantity || !price || !location) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const crop = await Crop.create({
        farmer: req.user._id,
        name,
        category,
        quantity,
        price,
        location,
        description,
        image
      });
      return res.status(201).json({ success: true, crop });
    } else {
      // IN-MEMORY FALLBACK MODE
      console.log('Database is offline. Listing new crop in In-Memory Fallback Mode.');
      const newCrop = {
        _id: 'mem_crop_' + Date.now(),
        farmer: {
          _id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          phone: req.user.phone,
          location: req.user.location
        },
        name,
        category,
        quantity: parseInt(quantity),
        price: parseFloat(price),
        location,
        description,
        image: image || 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5',
        createdAt: new Date()
      };

      memoryStore.crops.push(newCrop);
      return res.status(201).json({ success: true, crop: newCrop });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error: ' + err.message });
  }
};

// @desc    Update a crop listing
// @route   PUT /api/crops/:id
// @access  Private (Farmer only)
const updateCrop = async (req, res) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      let crop = await Crop.findById(req.params.id);
      if (!crop) {
        return res.status(404).json({ success: false, message: 'Crop not found' });
      }

      if (crop.farmer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(401).json({ success: false, message: 'Not authorized to update this crop' });
      }

      crop = await Crop.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
      });
      return res.json({ success: true, crop });
    } else {
      // IN-MEMORY FALLBACK MODE
      const cropIdx = memoryStore.crops.findIndex(c => c._id.toString() === req.params.id.toString());
      if (cropIdx === -1) {
        return res.status(404).json({ success: false, message: 'Crop not found' });
      }

      const crop = memoryStore.crops[cropIdx];
      const cropFarmerId = crop.farmer && crop.farmer._id ? crop.farmer._id.toString() : '';

      if (cropFarmerId !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(401).json({ success: false, message: 'Not authorized to update this crop' });
      }

      const updatedCrop = {
        ...crop,
        ...req.body,
        quantity: req.body.quantity !== undefined ? parseInt(req.body.quantity) : crop.quantity,
        price: req.body.price !== undefined ? parseFloat(req.body.price) : crop.price
      };

      memoryStore.crops[cropIdx] = updatedCrop;
      return res.json({ success: true, crop: updatedCrop });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error: ' + err.message });
  }
};

// @desc    Delete a crop listing
// @route   DELETE /api/crops/:id
// @access  Private (Farmer & Admin)
const deleteCrop = async (req, res) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const crop = await Crop.findById(req.params.id);
      if (!crop) {
        return res.status(404).json({ success: false, message: 'Crop not found' });
      }

      if (crop.farmer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(401).json({ success: false, message: 'Not authorized to delete this crop' });
      }

      await Crop.findByIdAndDelete(req.params.id);
      return res.json({ success: true, message: 'Crop listing removed successfully' });
    } else {
      // IN-MEMORY FALLBACK MODE
      const cropIdx = memoryStore.crops.findIndex(c => c._id.toString() === req.params.id.toString());
      if (cropIdx === -1) {
        return res.status(404).json({ success: false, message: 'Crop not found' });
      }

      const crop = memoryStore.crops[cropIdx];
      const cropFarmerId = crop.farmer && crop.farmer._id ? crop.farmer._id.toString() : '';

      if (cropFarmerId !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(401).json({ success: false, message: 'Not authorized to delete this crop' });
      }

      memoryStore.crops.splice(cropIdx, 1);
      return res.json({ success: true, message: 'Crop listing removed successfully' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error: ' + err.message });
  }
};

module.exports = {
  getCrops,
  getFarmerCrops,
  getCropById,
  createCrop,
  updateCrop,
  deleteCrop
};
