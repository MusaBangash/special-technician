const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ServiceRequest = require('../models/ServiceRequest');
const Review = require('../models/Review');

// Middleware to require login
const requireLogin = (req, res, next) => {
  if (!req.session.user) {
    console.log('❌ No user in session');
    return res.status(401).json({ error: 'Not logged in' });
  }
  console.log('✅ User authenticated:', req.session.user.name, req.session.user.phone);
  next();
};

// Get customer's service requests
router.get('/my-requests', requireLogin, async (req, res) => {
  try {
    // Get user ID and phone from session
    const userId = req.session.user._id;
    const phone = req.session.user.phone;
    
    console.log(`📋 Fetching requests for user: ${phone} (${userId})`);
    
    // Try to find by user ID first
    let requests = [];
    
    // If userId is a valid ObjectId string, search by it
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      requests = await ServiceRequest.find({ customer: new mongoose.Types.ObjectId(userId) })
        .sort({ createdAt: -1 });
      console.log(`Found ${requests.length} requests by user ID`);
    }
    
    // If no results by user ID, try phone number as fallback
    if (requests.length === 0 && phone) {
      console.log(`⚠️ No results by ID, trying phone: ${phone}`);
      requests = await ServiceRequest.find({ customerPhone: phone })
        .sort({ createdAt: -1 });
      console.log(`Found ${requests.length} requests by phone`);
    }
    
    console.log(`✅ Returning ${requests.length} requests`);
    res.json(requests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// Get single request details
router.get('/request/:id', requireLogin, async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    if (request.customer.toString() !== req.session.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json(request);
  } catch (error) {
    console.error('Error fetching request:', error);
    res.status(500).json({ error: 'Failed to fetch request' });
  }
});

// Cancel service request (only if pending)
router.post('/request/:id/cancel', requireLogin, async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    if (request.customer.toString() !== req.session.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (request.status === 'pending') {
      request.status = 'cancelled';
      await request.save();
      res.json({ success: true, message: 'Service cancelled successfully' });
    } else {
      res.status(400).json({ error: 'Only pending requests can be cancelled' });
    }
  } catch (error) {
    console.error('Error cancelling request:', error);
    res.status(500).json({ error: 'Failed to cancel request' });
  }
});

// Update service request (reschedule - only if pending)
router.put('/request/:id/reschedule', requireLogin, async (req, res) => {
  try {
    const { scheduledDate } = req.body;
    const request = await ServiceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    if (request.customer.toString() !== req.session.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending requests can be rescheduled' });
    }
    if (!scheduledDate) {
      return res.status(400).json({ error: 'New date is required' });
    }
    request.scheduledDate = new Date(scheduledDate);
    await request.save();
    res.json({ success: true, message: 'Service rescheduled successfully', request });
  } catch (error) {
    console.error('Error rescheduling request:', error);
    res.status(500).json({ error: 'Failed to reschedule request' });
  }
});

// Submit review/rating
router.post('/request/:id/review', requireLogin, async (req, res) => {
  try {
    const { rating, title, comment, quality, response, technician, pricing } = req.body;
    const request = await ServiceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    if (request.customer.toString() !== req.session.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (request.status !== 'completed') {
      return res.status(400).json({ error: 'Only completed services can be reviewed' });
    }

    // Check if already reviewed
    const existingReview = await Review.findOne({ serviceRequest: req.params.id });
    if (existingReview) {
      return res.status(400).json({ error: 'This service has already been reviewed' });
    }

    const review = new Review({
      serviceRequest: req.params.id,
      user: req.session.user._id,
      rating,
      title,
      comment,
      quality,
      response,
      technician,
      pricing
    });
    await review.save();
    res.json({ success: true, message: 'Review submitted successfully', review });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// Get review for request
router.get('/request/:id/review', async (req, res) => {
  try {
    const review = await Review.findOne({ serviceRequest: req.params.id });
    if (!review) {
      return res.json(null);
    }
    res.json(review);
  } catch (error) {
    console.error('Error fetching review:', error);
    res.status(500).json({ error: 'Failed to fetch review' });
  }
});

// Get all reviews (public)
router.get('/reviews', async (req, res) => {
  try {
    const reviews = await Review.find({ verified: true })
      .populate('user', 'name')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Get review stats
router.get('/reviews/stats', async (req, res) => {
  try {
    const reviews = await Review.find({ verified: true });
    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1) : 0;
    const avgQuality = totalReviews > 0 ? (reviews.reduce((sum, r) => sum + (r.quality || 0), 0) / totalReviews).toFixed(1) : 0;
    const avgResponse = totalReviews > 0 ? (reviews.reduce((sum, r) => sum + (r.response || 0), 0) / totalReviews).toFixed(1) : 0;
    const avgTechnician = totalReviews > 0 ? (reviews.reduce((sum, r) => sum + (r.technician || 0), 0) / totalReviews).toFixed(1) : 0;
    const avgPricing = totalReviews > 0 ? (reviews.reduce((sum, r) => sum + (r.pricing || 0), 0) / totalReviews).toFixed(1) : 0;

    res.json({
      totalReviews,
      avgRating,
      avgQuality,
      avgResponse,
      avgTechnician,
      avgPricing
    });
  } catch (error) {
    console.error('Error calculating stats:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Delete a service request (except assigned ones)
router.post('/request/:id/delete', requireLogin, async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    // Check ownership
    if (request.customer.toString() !== req.session.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Prevent deletion of assigned or in-progress bookings
    if (request.status === 'assigned' || request.status === 'in-progress') {
      return res.status(400).json({ error: 'Cannot delete assigned or in-progress bookings' });
    }
    
    await ServiceRequest.findByIdAndDelete(req.params.id);
    console.log(`🗑️ Booking deleted: ${req.params.id} by ${req.session.user.phone}`);
    
    res.json({ success: true, message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Error deleting request:', error);
    res.status(500).json({ error: 'Failed to delete request' });
  }
});

// Get customer records by phone (for support/lookup)
router.get('/customer-history/:phone', async (req, res) => {
  try {
    const phone = req.params.phone.startsWith('+') ? req.params.phone : '+' + req.params.phone;
    
    console.log(`🔍 Looking up customer records for: ${phone}`);
    
    const requests = await ServiceRequest.find({ customerPhone: phone })
      .sort({ createdAt: -1 });
    
    if (requests.length === 0) {
      return res.json({ found: false, message: 'No records found for this phone number' });
    }

    res.json({
      found: true,
      phone,
      totalBookings: requests.length,
      requests
    });
  } catch (error) {
    console.error('Error looking up customer:', error);
    res.status(500).json({ error: 'Failed to lookup customer' });
  }
});

// TEST: Get all bookings (no auth - for debugging)
router.get('/test-all-bookings', async (req, res) => {
  try {
    const bookings = await ServiceRequest.find().sort({ createdAt: -1 });
    console.log(`🧪 TEST: Found ${bookings.length} total bookings in database`);
    res.json({ total: bookings.length, bookings });
  } catch (error) {
    console.error('Error fetching test bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

module.exports = router;