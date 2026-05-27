const Order = require('../model/Order');
const Crop = require('../model/Crop');
const mongoose = require('mongoose');
const memoryStore = require('../utils/memoryStore');

// @desc    Create a new order
// @route   POST /api/orders
// @access  Private (Buyer only)
const createOrder = async (req, res) => {
  try {
    const { cropId, quantity, shippingAddress, paymentMethod } = req.body;

    if (!cropId || !quantity || !shippingAddress) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const crop = await Crop.findById(cropId);
      if (!crop) {
        return res.status(404).json({ success: false, message: 'Crop listing not found' });
      }

      if (crop.quantity < quantity) {
        return res.status(400).json({ success: false, message: `Only ${crop.quantity}kg available in stock` });
      }

      const totalPrice = crop.price * quantity;

      const order = await Order.create({
        buyer: req.user._id,
        farmer: crop.farmer,
        crop: cropId,
        quantity,
        totalPrice,
        shippingAddress,
        paymentMethod: paymentMethod || 'Cash on Delivery'
      });

      crop.quantity -= quantity;
      await crop.save();

      return res.status(201).json({ success: true, order });
    } else {
      // IN-MEMORY FALLBACK MODE
      console.log('Database is offline. Placing order in In-Memory Fallback Mode.');
      const cropIdx = memoryStore.crops.findIndex(c => c._id.toString() === cropId.toString());
      if (cropIdx === -1) {
        return res.status(404).json({ success: false, message: 'Crop listing not found' });
      }

      const crop = memoryStore.crops[cropIdx];
      if (crop.quantity < quantity) {
        return res.status(400).json({ success: false, message: `Only ${crop.quantity}kg available in stock` });
      }

      const totalPrice = crop.price * quantity;
      
      const newOrder = {
        _id: 'mem_order_' + Date.now(),
        buyer: {
          _id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          phone: req.user.phone,
          location: req.user.location
        },
        farmer: { ...crop.farmer },
        crop: {
          _id: crop._id,
          name: crop.name,
          category: crop.category,
          price: crop.price,
          image: crop.image
        },
        quantity: parseInt(quantity),
        totalPrice,
        status: 'Pending',
        shippingAddress,
        paymentMethod: paymentMethod || 'Cash on Delivery',
        createdAt: new Date()
      };

      // Deduct stock in memory
      crop.quantity -= parseInt(quantity);
      
      memoryStore.orders.push(newOrder);
      return res.status(201).json({ success: true, order: newOrder });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error: ' + err.message });
  }
};

// @desc    Get order history of logged in buyer
// @route   GET /api/orders/buyer
// @access  Private (Buyer only)
const getBuyerOrders = async (req, res) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const orders = await Order.find({ buyer: req.user._id })
        .populate('crop', 'name category price image')
        .populate('farmer', 'name email phone location')
        .sort({ createdAt: -1 });

      return res.json({ success: true, count: orders.length, orders });
    } else {
      // IN-MEMORY FALLBACK MODE
      console.log('Database is offline. Fetching buyer orders in In-Memory Fallback Mode.');
      const orders = memoryStore.orders
        .filter(o => o.buyer && o.buyer._id.toString() === req.user._id.toString())
        .sort((a, b) => b.createdAt - a.createdAt);

      return res.json({ success: true, count: orders.length, orders });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error: ' + err.message });
  }
};

// @desc    Get orders received by logged in farmer
// @route   GET /api/orders/farmer
// @access  Private (Farmer only)
const getFarmerOrders = async (req, res) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const orders = await Order.find({ farmer: req.user._id })
        .populate('crop', 'name category price image')
        .populate('buyer', 'name email phone location')
        .sort({ createdAt: -1 });

      return res.json({ success: true, count: orders.length, orders });
    } else {
      // IN-MEMORY FALLBACK MODE
      console.log('Database is offline. Fetching farmer orders in In-Memory Fallback Mode.');
      const orders = memoryStore.orders
        .filter(o => o.farmer && o.farmer._id.toString() === req.user._id.toString())
        .sort((a, b) => b.createdAt - a.createdAt);

      return res.json({ success: true, count: orders.length, orders });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error: ' + err.message });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Please provide status' });
    }

    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const order = await Order.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      const isFarmerOfOrder = order.farmer.toString() === req.user._id.toString();
      const isBuyerOfOrder = order.buyer.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';

      if (!isFarmerOfOrder && !isBuyerOfOrder && !isAdmin) {
        return res.status(401).json({ success: false, message: 'Not authorized to change this order status' });
      }

      if (isBuyerOfOrder && status !== 'Cancelled') {
        return res.status(400).json({ success: false, message: 'Buyers can only cancel their own orders' });
      }

      if (isBuyerOfOrder && order.status !== 'Pending') {
        return res.status(400).json({ success: false, message: 'Orders can only be cancelled while pending' });
      }

      if (status === 'Cancelled' && order.status !== 'Cancelled') {
        const crop = await Crop.findById(order.crop);
        if (crop) {
          crop.quantity += order.quantity;
          await crop.save();
        }
      }

      order.status = status;
      await order.save();

      return res.json({ success: true, order });
    } else {
      // IN-MEMORY FALLBACK MODE
      const orderIdx = memoryStore.orders.findIndex(o => o._id.toString() === req.params.id.toString());
      if (orderIdx === -1) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      const order = memoryStore.orders[orderIdx];
      const orderFarmerId = order.farmer && order.farmer._id ? order.farmer._id.toString() : '';
      const orderBuyerId = order.buyer && order.buyer._id ? order.buyer._id.toString() : '';
      const isAdmin = req.user.role === 'admin';

      if (orderFarmerId !== req.user._id.toString() && orderBuyerId !== req.user._id.toString() && !isAdmin) {
        return res.status(401).json({ success: false, message: 'Not authorized to change this order status' });
      }

      if (orderBuyerId === req.user._id.toString() && status !== 'Cancelled') {
        return res.status(400).json({ success: false, message: 'Buyers can only cancel their own orders' });
      }

      if (orderBuyerId === req.user._id.toString() && order.status !== 'Pending') {
        return res.status(400).json({ success: false, message: 'Orders can only be cancelled while pending' });
      }

      // If order is cancelled, return the stock to crop inventory in memory
      if (status === 'Cancelled' && order.status !== 'Cancelled') {
        const cropIdx = memoryStore.crops.findIndex(c => c._id.toString() === order.crop._id.toString());
        if (cropIdx !== -1) {
          memoryStore.crops[cropIdx].quantity += order.quantity;
        }
      }

      order.status = status;
      memoryStore.orders[orderIdx] = order;

      return res.json({ success: true, order });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error: ' + err.message });
  }
};

module.exports = {
  createOrder,
  getBuyerOrders,
  getFarmerOrders,
  updateOrderStatus
};
