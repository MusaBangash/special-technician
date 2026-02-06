const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Service name is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Service name must be at least 3 characters'],
    maxlength: [50, 'Service name cannot exceed 50 characters']
  },
  
  description: {
    type: String,
    required: [true, 'Service description is required'],
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
    max: [10000, 'Price cannot exceed 10,000 SAR']
  },
  
  category: {
    type: String,
    enum: {
      values: ['cleaning', 'repair', 'maintenance', 'installation', 'inspection'],
      message: 'Category must be: cleaning, repair, maintenance, installation, or inspection'
    },
    default: 'cleaning'
  },
  
  duration: {
    type: Number,
    required: [true, 'Service duration (in hours) is required'],
    min: [0.5, 'Duration must be at least 0.5 hours'],
    max: [8, 'Duration cannot exceed 8 hours']
  },
  
  icon: {
    type: String,
    default: '🔧',
    description: 'Emoji or icon representing the service'
  },
  
  status: {
    type: String,
    enum: {
      values: ['active', 'inactive'],
      message: 'Status must be active or inactive'
    },
    default: 'active'
  },
  
  notes: {
    type: String,
    maxlength: [200, 'Notes cannot exceed 200 characters'],
    default: ''
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamps before saving
serviceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Service', serviceSchema);
