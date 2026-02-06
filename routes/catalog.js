const express = require('express');
const router = express.Router();
const Service = require('../models/Service');

// Middleware to check admin
const requireAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Get all active services (public)
router.get('/', async (req, res) => {
  try {
    const services = await Service.find({ status: 'active' }).sort({ createdAt: 1 });
    res.json({ success: true, services });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Get all services (admin - including inactive)
router.get('/all', requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};
    if (status) filter.status = status;

    const services = await Service.find(filter).sort({ createdAt: 1 });
    res.json({ success: true, services });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Get single service
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    res.json({ success: true, service });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch service' });
  }
});

// Create new service (admin only)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, description, price, category, duration, icon, status, notes } = req.body;

    // Validate required fields
    if (!name || !description || price === undefined || !duration) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    // Check for duplicate name
    const existingService = await Service.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
    if (existingService) {
      return res.status(400).json({ error: 'Service with this name already exists' });
    }

    // Validate price and duration
    if (price < 0 || price > 10000) {
      return res.status(400).json({ error: 'Price must be between 0 and 10,000 SAR' });
    }
    if (duration < 0.5 || duration > 8) {
      return res.status(400).json({ error: 'Duration must be between 0.5 and 8 hours' });
    }

    const service = new Service({
      name,
      description,
      price,
      category: category || 'cleaning',
      duration,
      icon: icon || '🔧',
      status: status || 'active',
      notes: notes || ''
    });

    await service.save();
    res.status(201).json({ success: true, service });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ error: error.message || 'Failed to create service' });
  }
});

// Update service (admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { name, description, price, category, duration, icon, status, notes } = req.body;

    // Check for duplicate name if name is being changed
    if (name) {
      const existingService = await Service.findOne({
        _id: { $ne: req.params.id },
        name: { $regex: `^${name}$`, $options: 'i' }
      });
      if (existingService) {
        return res.status(400).json({ error: 'Service with this name already exists' });
      }
    }

    // Validate price if provided
    if (price !== undefined && (price < 0 || price > 10000)) {
      return res.status(400).json({ error: 'Price must be between 0 and 10,000 SAR' });
    }

    // Validate duration if provided
    if (duration !== undefined && (duration < 0.5 || duration > 8)) {
      return res.status(400).json({ error: 'Duration must be between 0.5 and 8 hours' });
    }

    const updateData = { updatedAt: Date.now() };
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (category) updateData.category = category;
    if (duration !== undefined) updateData.duration = duration;
    if (icon) updateData.icon = icon;
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const service = await Service.findByIdAndUpdate(req.params.id, updateData, { new: true });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json({ success: true, service });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// Delete service (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    res.json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

// Bulk status update (admin only)
router.post('/bulk/status', requireAdmin, async (req, res) => {
  try {
    const { serviceIds, status } = req.body;

    if (!Array.isArray(serviceIds) || !status) {
      return res.status(400).json({ error: 'Please provide serviceIds array and status' });
    }

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Status must be active or inactive' });
    }

    const result = await Service.updateMany(
      { _id: { $in: serviceIds } },
      { status, updatedAt: Date.now() }
    );

    res.json({ success: true, updated: result.modifiedCount });
  } catch (error) {
    console.error('Error updating services:', error);
    res.status(500).json({ error: 'Failed to update services' });
  }
});

module.exports = router;
