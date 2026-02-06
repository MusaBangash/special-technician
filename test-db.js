const mongoose = require('mongoose');

async function testDBConnection() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/special-technician');
    console.log('✅ MongoDB connected!');
    
    // Test ServiceArea model
    const ServiceArea = require('./models/ServiceArea');
    const areas = await ServiceArea.find();
    
    console.log(`\n✅ Found ${areas.length} service areas:`);
    areas.forEach((area, i) => {
      console.log(`  ${i + 1}. ${area.cityName} (${area.arabicName}) - Status: ${area.status}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testDBConnection();
