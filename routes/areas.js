const express = require('express');
const router = express.Router();
const ServiceArea = require('../models/ServiceArea');

// Middleware to check admin authentication
const requireAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Get all service areas (public)
router.get('/areas', async (req, res) => {
  try {
    const areas = await ServiceArea.find({ status: 'active' }).sort('cityName');
    res.json({ areas });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch areas' });
  }
});

// Get all service areas with filters (admin)
router.get('/areas/all', requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const areas = await ServiceArea.find(filter).sort('-createdAt');
    res.json({ areas });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch areas' });
  }
});

// Get single service area
router.get('/areas/:id', async (req, res) => {
  try {
    const area = await ServiceArea.findById(req.params.id);
    if (!area) {
      return res.status(404).json({ error: 'Area not found' });
    }
    res.json({ area });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch area' });
  }
});

// Create new service area (admin)
router.post('/areas', requireAdmin, async (req, res) => {
  const { cityName, arabicName, status, deliveryTime, notes } = req.body;

  // Validation
  if (!cityName || !arabicName) {
    return res.status(400).json({ error: 'City name and Arabic name are required' });
  }

  try {
    // Check for duplicates
    const existing = await ServiceArea.findOne({ cityName: new RegExp(`^${cityName}$`, 'i') });
    if (existing) {
      return res.status(400).json({ error: 'City already exists' });
    }

    const area = new ServiceArea({
      cityName,
      arabicName,
      status: status || 'active',
      deliveryTime: deliveryTime || 24,
      notes
    });

    await area.save();
    res.status(201).json({ success: true, area });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create area' });
  }
});

// Update service area (admin)
router.put('/areas/:id', requireAdmin, async (req, res) => {
  const { cityName, arabicName, status, deliveryTime, notes } = req.body;

  try {
    const area = await ServiceArea.findById(req.params.id);
    if (!area) {
      return res.status(404).json({ error: 'Area not found' });
    }

    // Check for duplicate city name (excluding current)
    if (cityName && cityName !== area.cityName) {
      const existing = await ServiceArea.findOne({ 
        cityName: new RegExp(`^${cityName}$`, 'i'),
        _id: { $ne: req.params.id }
      });
      if (existing) {
        return res.status(400).json({ error: 'City name already exists' });
      }
    }

    // Update fields
    area.cityName = cityName || area.cityName;
    area.arabicName = arabicName || area.arabicName;
    area.status = status || area.status;
    area.deliveryTime = deliveryTime !== undefined ? deliveryTime : area.deliveryTime;
    area.notes = notes !== undefined ? notes : area.notes;
    area.updatedAt = new Date();

    await area.save();
    res.json({ success: true, area });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update area' });
  }
});

// Delete service area (admin)
router.delete('/areas/:id', requireAdmin, async (req, res) => {
  try {
    const area = await ServiceArea.findByIdAndDelete(req.params.id);
    if (!area) {
      return res.status(404).json({ error: 'Area not found' });
    }
    res.json({ success: true, message: 'Area deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete area' });
  }
});

// Bulk update status (admin)
router.post('/areas/bulk/status', requireAdmin, async (req, res) => {
  const { areaIds, status } = req.body;

  if (!areaIds || !Array.isArray(areaIds) || !status) {
    return res.status(400).json({ error: 'areaIds and status are required' });
  }

  try {
    const result = await ServiceArea.updateMany(
      { _id: { $in: areaIds } },
      { status, updatedAt: new Date() }
    );
    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update areas' });
  }
});

module.exports = router;
