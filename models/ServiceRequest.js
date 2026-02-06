const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerPhone: {
    type: String,
    required: true,
    index: true
  },
  customerName: {
    type: String,
    default: 'Customer'
  },
  service: {
    type: String,
    required: true
  },
  description: String,
  scheduledDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  assignedStaff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  price: Number,
  location: String,
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

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);