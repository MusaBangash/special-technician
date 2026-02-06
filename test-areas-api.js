const axios = require('axios');

async function testAreasAPI() {
  try {
    console.log('Testing /api/areas endpoint...\n');
    
    const response = await axios.get('http://localhost:3000/api/areas');
    
    console.log('✅ API Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.areas && response.data.areas.length > 0) {
      console.log('\n✅ Cities found:');
      response.data.areas.forEach((area, i) => {
        console.log(`  ${i + 1}. ${area.cityName} (${area.arabicName}) - ${area.status}`);
      });
    } else {
      console.log('\n⚠️ No cities found in response');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testAreasAPI();
