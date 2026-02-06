const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

async function createAdminUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/special-technician', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connected');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('⚠️ Admin user already exists:', existingAdmin.email);
      mongoose.connection.close();
      process.exit(0);
    }

    // Create admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const adminUser = new User({
      phone: '+966501111111',
      name: 'Admin User',
      email: 'admin@specialtechnician.com',
      password: hashedPassword,
      role: 'admin'
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log('📋 Admin Credentials:');
    console.log('   Email: admin@specialtechnician.com');
    console.log('   Password: admin123');
    console.log('   Role: admin');
    console.log('\n🔗 Login at: http://localhost:3000');
    console.log('📊 Admin panel at: http://localhost:3000/admin');

    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdminUser();
