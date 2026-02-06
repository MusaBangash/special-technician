const mongoose = require('mongoose');
const Contact = require('./models/Contact');

// MongoDB connection string (adjust if needed)
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/special-technician';

async function seedContact() {
  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected');

    // Check if contact already exists
    let contact = await Contact.findOne();
    
    if (!contact) {
      contact = new Contact({
        title: 'Ready to get started?',
        description: 'Reach out via WhatsApp and book your maintenance appointment in minutes. We serve Jazan, Sabya, Abo Arish and Samtah.',
        phone: '+966502258883',
        email: 'specialtechnician@gmail.com',
        address: 'Jazan, Saudi Arabia',
        whatsappLink: 'https://wa.me/+966502258883',
        instagram: '#',
        tiktok: '#',
        snapchat: '#'
      });
      await contact.save();
      console.log('✅ Default contact info created');
    } else {
      console.log('ℹ️ Contact info already exists');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error seeding contact:', error);
    process.exit(1);
  }
}

seedContact();
