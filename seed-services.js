const mongoose = require('mongoose');
const Service = require('./models/Service');

const initialServices = [
  {
    name: 'AC Unit Cleaning',
    description: 'Complete cleaning of air conditioning unit including filter replacement and duct cleaning. Improves air quality and efficiency.',
    price: 150,
    category: 'cleaning',
    duration: 1,
    icon: '🧹',
    status: 'active',
    notes: 'Includes filter replacement'
  },
  {
    name: 'Refrigeration Repair',
    description: 'Repair of refrigeration systems and cooling issues. Expert diagnosis and quick turnaround time.',
    price: 250,
    category: 'repair',
    duration: 2,
    icon: '❄️',
    status: 'active',
    notes: 'Parts cost may apply'
  },
  {
    name: 'AC Maintenance Plan',
    description: 'Monthly maintenance plan to keep your AC system running smoothly. Includes inspection and cleaning.',
    price: 100,
    category: 'maintenance',
    duration: 1,
    icon: '🔧',
    status: 'active',
    notes: 'Monthly recurring service'
  },
  {
    name: 'HVAC Installation',
    description: 'Professional installation of new HVAC systems. Includes setup, testing, and warranty coverage.',
    price: 500,
    category: 'installation',
    duration: 4,
    icon: '📦',
    status: 'active',
    notes: 'Price varies by unit size'
  },
  {
    name: 'System Inspection',
    description: 'Comprehensive inspection of your HVAC system to identify any potential issues before they become problems.',
    price: 75,
    category: 'inspection',
    duration: 1,
    icon: '🔍',
    status: 'active',
    notes: 'Detailed report included'
  },
  {
    name: 'Emergency Service',
    description: 'Same-day emergency HVAC repair service available 24/7 for urgent cooling or heating issues.',
    price: 350,
    category: 'repair',
    duration: 2,
    icon: '🚨',
    status: 'active',
    notes: 'Available 24/7'
  }
];

async function seedServices() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/special-technician');
    console.log('✅ MongoDB connected');

    // Clear existing services
    await Service.deleteMany({});
    console.log('🗑️ Cleared existing services');

    // Insert initial services
    const created = await Service.insertMany(initialServices);
    console.log('✅ Services seeded successfully!\n');

    console.log('📋 Created services:');
    created.forEach((service, i) => {
      console.log(`  ${i + 1}. ${service.name}`);
      console.log(`     Category: ${service.category} | Price: ${service.price} SAR | Duration: ${service.duration}h`);
      console.log(`     Status: ${service.status}\n`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding services:', error.message);
    process.exit(1);
  }
}

seedServices();
