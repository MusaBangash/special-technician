const mongoose = require('mongoose');

const serviceAreaSchema = new mongoose.Schema({
  cityName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  arabicName: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  deliveryTime: {
    type: Number,
    default: 24,
    description: 'Delivery time in hours'
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ServiceArea', serviceAreaSchema);
