const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  title: {
    type: String,
    default: 'Ready to get started?'
  },
  description: {
    type: String,
    default: 'Reach out via WhatsApp and book your maintenance appointment in minutes. We serve Jazan, Sabya, Abo Arish and Samtah.'
  },
  phone: {
    type: String,
    required: true,
    default: '+966502258883'
  },
  email: {
    type: String,
    required: true,
    default: 'specialtechnician@gmail.com'
  },
  address: {
    type: String,
    default: 'Jazan, Saudi Arabia'
  },
  whatsappLink: {
    type: String,
    default: 'https://wa.me/+966502258883'
  },
  instagram: {
    type: String,
    default: '#'
  },
  tiktok: {
    type: String,
    default: '#'
  },
  snapchat: {
    type: String,
    default: '#'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Contact', contactSchema);
