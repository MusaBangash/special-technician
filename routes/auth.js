const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Send OTP
router.post('/send-otp', async (req, res) => {
  const { phone } = req.body;
  try {
    // Firebase handles SMS sending automatically
    req.session.phone = phone;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Verify OTP and login/signup
router.post('/verify-otp', async (req, res) => {
  const { uid, name, email, phone } = req.body;
  try {
    // Normalize phone number (remove spaces, ensure +966 format)
    const normalizedPhone = phone.startsWith('+') ? phone : '+' + phone;
    
    // Try to find existing user by phone (primary identifier)
    let user = await User.findOne({ phone: normalizedPhone });
    
    if (!user) {
      // Create new user with phone as primary identifier
      user = new User({ 
        phone: normalizedPhone, 
        name: name || 'Customer',
        email: email || null,
        role: 'customer'
      });
      await user.save();
      console.log(`✅ New customer created: ${normalizedPhone}`);
    } else {
      // Update name/email if provided (customer can update their info)
      if (name) user.name = name;
      if (email && !user.email) user.email = email;
      await user.save();
      console.log(`✅ Customer logged in: ${normalizedPhone}`);
    }

    // Store full user object in session
    req.session.user = {
      _id: user._id.toString(),
      phone: normalizedPhone,
      name: user.name,
      email: user.email,
      role: user.role
    };
    req.session.userId = user._id.toString();
    req.session.phone = normalizedPhone;

    res.json({ success: true, user });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// Admin Login (email/password)
router.post('/admin-login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    req.session.user = user;
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;