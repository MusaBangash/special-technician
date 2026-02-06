const express = require('express');
const router = express.Router();
const ServiceRequest = require('../models/ServiceRequest');
const axios = require('axios');

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};

// Create service request
router.post('/request', requireAuth, async (req, res) => {
  const { service, description, scheduledDate, price, location } = req.body;
  try {
    console.log(`📝 Booking request received:`);
    console.log(`  Service: ${service}`);
    console.log(`  Customer ID: ${req.session.user._id}`);
    console.log(`  Customer Phone: ${req.session.user.phone}`);
    console.log(`  Customer Name: ${req.session.user.name}`);
    
    const request = new ServiceRequest({
      customer: req.session.user._id,
      customerPhone: req.session.user.phone,
      customerName: req.session.user.name,
      service,
      description,
      scheduledDate,
      price,
      location
    });
    await request.save();
    
    console.log(`✅ Booking saved successfully: ${request._id}`);

    // Send WhatsApp message
    const message = `Hello ${req.session.user.name}, your ${service} request has been booked for ${new Date(scheduledDate).toLocaleString()}. We'll contact you soon!`;
    await sendWhatsAppMessage(req.session.user.phone, message);

    res.json({ success: true, request });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ error: 'Failed to create request', details: error.message });
  }
});

// Function to send WhatsApp message
async function sendWhatsAppMessage(to, message) {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: to.replace('+', ''),
        type: 'text',
        text: { body: message }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('WhatsApp message sent:', response.data);
  } catch (error) {
    console.error('Error sending WhatsApp message:', error.response.data);
  }
}

// Get user's requests
router.get('/my-requests', requireAuth, async (req, res) => {
  try {
    const requests = await ServiceRequest.find({ customer: req.session.user._id }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

module.exports = router;