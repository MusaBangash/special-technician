const mongoose = require('mongoose');
const ServiceArea = require('./models/ServiceArea');
require('dotenv').config();

async function seedCities() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/special-technician', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connected');

    // Check if cities already exist
    const existingCities = await ServiceArea.countDocuments();
    if (existingCities > 0) {
      console.log(`⚠️ ${existingCities} cities already exist in database`);
      mongoose.connection.close();
      process.exit(0);
    }

    // Initial service areas
    const cities = [
      {
        cityName: 'Jazan',
        arabicName: 'جازان',
        status: 'active',
        deliveryTime: 24,
        notes: 'Main hub - serves all surrounding areas'
      },
      {
        cityName: 'Sabya',
        arabicName: 'صبيا',
        status: 'active',
        deliveryTime: 24,
        notes: 'Covered service area'
      },
      {
        cityName: 'Abo Arish',
        arabicName: 'ابو عريش',
        status: 'active',
        deliveryTime: 24,
        notes: 'Covered service area'
      },
      {
        cityName: 'Samtah',
        arabicName: 'صامطة',
        status: 'active',
        deliveryTime: 24,
        notes: 'Covered service area'
      }
    ];

    const inserted = await ServiceArea.insertMany(cities);
    console.log('✅ Cities seeded successfully!');
    console.log('📍 Created cities:');
    inserted.forEach(city => {
      console.log(`   - ${city.cityName} (${city.arabicName})`);
    });

    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedCities();
