const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  serviceRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceRequest',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  comment: {
    type: String,
    required: true,
    maxlength: 500
  },
  quality: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  response: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  technician: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  pricing: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  verified: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
