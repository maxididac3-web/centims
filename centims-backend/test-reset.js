require('dotenv').config();
const { executeMonthlySnapshot } = require('./src/services/monthlyReset');
const { getCurrentMonth } = require('./src/utils/helpers');

async function test() {
  try {
    const month = getCurrentMonth();
    console.log(`Testejant snapshot per ${month}...`);
    
    await executeMonthlySnapshot();
    
    console.log('\n✅ Test completat amb èxit!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

test();