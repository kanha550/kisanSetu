const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema({
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  category: { 
    type: String, 
    required: true, 
    enum: ['Grains', 'Vegetables', 'Fruits', 'Pulses', 'Oilseeds'] 
  },
  quantity: { type: Number, required: true }, // in kg
  price: { type: Number, required: true }, // per kg
  location: { type: String, required: true },
  description: { type: String },
  image: { type: String, default: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5' }, // default wheat image
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Crop', cropSchema);
