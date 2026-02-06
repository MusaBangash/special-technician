const express = require('express');
const router = express.Router();
const ServiceRequest = require('../models/ServiceRequest');
const User = require('../models/User');

// Middleware to check admin
const requireAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Get all requests with filtering
router.get('/requests', requireAdmin, async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    let filter = {};

    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.scheduledDate = {};
      if (startDate) filter.scheduledDate.$gte = new Date(startDate);
      if (endDate) filter.scheduledDate.$lte = new Date(endDate);
    }

    const requests = await ServiceRequest.find(filter)
      .populate('customer assignedStaff')
      .sort({ scheduledDate: -1 })
      .limit(100);
    
    res.json({ success: true, requests });
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// Get single request details
router.get('/requests/:id', requireAdmin, async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id)
      .populate('customer assignedStaff');
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    res.json({ success: true, request });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch request' });
  }
});

// Update request status and details
router.put('/requests/:id', requireAdmin, async (req, res) => {
  const { status, assignedStaff, notes, price } = req.body;
  
  try {
    if (status && !['pending', 'assigned', 'in-progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateData = { updatedAt: Date.now() };
    if (status) updateData.status = status;
    if (assignedStaff) updateData.assignedStaff = assignedStaff;
    if (notes !== undefined) updateData.notes = notes;
    if (price !== undefined) updateData.price = price;

    const request = await ServiceRequest.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('customer assignedStaff');

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json({ success: true, request });
  } catch (error) {
    console.error('Error updating request:', error);
    res.status(500).json({ error: 'Failed to update request' });
  }
});

// Export reports (production-grade CSV)
router.get('/export', requireAdmin, async (req, res) => {
  try {
    const requests = await ServiceRequest.find().populate('customer assignedStaff').sort({ createdAt: -1 });
    
    if (requests.length === 0) {
      return res.status(400).json({ error: 'No requests to export' });
    }

    // Create CSV header
    const headers = ['ID', 'Customer Name', 'Phone', 'Service', 'Status', 'Price (SAR)', 'Scheduled Date', 'Location', 'Notes'];
    const rows = requests.map(r => [
      r._id.toString(),
      r.customer?.name || 'Unknown',
      r.customer?.phone || '-',
      r.service,
      r.status,
      r.price || 0,
      new Date(r.scheduledDate).toLocaleDateString('en-US'),
      r.location || '-',
      r.notes ? `"${r.notes.replace(/"/g, '""')}"` : '-'
    ]);

    // Build CSV content
    let csv = headers.join(',') + '\n';
    csv += rows.map(row => row.join(',')).join('\n');

    // Send file
    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.header('Content-Disposition', `attachment; filename="service-requests-${Date.now()}.csv"`);
    res.send('\ufeff' + csv); // Add BOM for Excel UTF-8 compatibility
  } catch (error) {
    res.status(500).json({ error: 'Export failed' });
  }
});

// Get all users
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Delete a user
router.post('/users/:id/delete', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Prevent deletion of the admin who is performing the deletion
    if (user._id.toString() === req.session.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot delete your own admin account' });
    }
    
    // Prevent deletion of other admin accounts
    if (user.role === 'admin') {
      return res.status(400).json({ error: 'Cannot delete admin accounts' });
    }
    
    // Delete all bookings associated with this user
    await ServiceRequest.deleteMany({ customer: user._id });
    
    // Delete the user
    await User.findByIdAndDelete(req.params.id);
    
    console.log(`🗑️ User deleted: ${user.phone} (${user.name}) by admin ${req.session.user.phone}`);
    
    res.json({ success: true, message: 'User and all associated bookings deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;