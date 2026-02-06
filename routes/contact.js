const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');

// Middleware to check admin
const requireAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};

// Get contact info (public)
router.get('/', async (req, res) => {
  try {
    let contact = await Contact.findOne();
    if (!contact) {
      contact = new Contact();
      await contact.save();
    }
    res.json(contact);
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({ error: 'Failed to fetch contact info' });
  }
});

// Update contact info (admin only)
router.post('/update', requireAdmin, async (req, res) => {
  try {
    const { title, description, phone, email, address, whatsappLink, instagram, tiktok, snapchat } = req.body;
    
    let contact = await Contact.findOne();
    if (!contact) {
      contact = new Contact();
    }
    
    if (title) contact.title = title;
    if (description) contact.description = description;
    if (phone) contact.phone = phone;
    if (email) contact.email = email;
    if (address) contact.address = address;
    if (whatsappLink) contact.whatsappLink = whatsappLink;
    if (instagram) contact.instagram = instagram;
    if (tiktok) contact.tiktok = tiktok;
    if (snapchat) contact.snapchat = snapchat;
    
    await contact.save();
    res.json({ success: true, contact });
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({ error: 'Failed to update contact info' });
  }
});

module.exports = router;
