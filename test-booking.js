const mongoose = require('mongoose');
const ServiceRequest = require('./models/ServiceRequest');
require('dotenv').config();

async function createTestBooking() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/special-technician', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connected');

    // Create a test service request
    const testRequest = new ServiceRequest({
      customer: new mongoose.Types.ObjectId(),
      customerPhone: '+966501234567',
      customerName: 'Test User',
      service: 'Unit Cleaning',
      description: 'Test booking for AC unit cleaning',
      scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      price: 150,
      location: 'Jazan, Saudi Arabia',
      status: 'pending'
    });

    await testRequest.save();
    console.log('✅ Test booking created:', testRequest._id);
    console.log('📋 Details:', {
      service: testRequest.service,
      date: testRequest.scheduledDate,
      price: testRequest.price,
      status: testRequest.status
    });

    // List all requests
    const allRequests = await ServiceRequest.find();
    console.log(`\n📊 Total requests in DB: ${allRequests.length}`);
    console.log('All requests:');
    allRequests.forEach(req => {
      console.log(`  - ${req.service} | ${req.status} | ${req.scheduledDate.toLocaleString()}`);
    });

    mongoose.connection.close();
    console.log('\n✅ Test complete. Visit /admin to see the request.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTestBooking();
