// Script to verify all required environment variables are set
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const requiredVars = [
  'DB_HOST',
  'DB_USER',
  'DB_NAME',
  'JWT_SECRET',
  'PORT'
];

const optionalVars = [
  'DB_PASSWORD',
  'JWT_EXPIRES_IN',
  'FRONTEND_URL',
  'NODE_ENV',
  'EMAIL_HOST',
  'EMAIL_PORT',
  'EMAIL_USER',
  'EMAIL_PASS'
];

console.log('🔍 Checking environment variables...\n');

let hasErrors = false;

// Check required variables
console.log('Required Variables:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Mask sensitive values
    const displayValue = varName === 'JWT_SECRET' || varName === 'DB_PASSWORD' 
      ? (value ? '***' : '') 
      : value;
    console.log(`  ✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`  ❌ ${varName}: MISSING`);
    hasErrors = true;
  }
});

// Check optional variables
console.log('\nOptional Variables:');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    const displayValue = varName.includes('PASSWORD') || varName.includes('PASS') || varName.includes('SECRET')
      ? '***'
      : value;
    console.log(`  ✓ ${varName}: ${displayValue}`);
  } else {
    console.log(`  - ${varName}: not set (optional)`);
  }
});

console.log('\n' + '='.repeat(50));

if (hasErrors) {
  console.log('❌ Some required environment variables are missing!');
  console.log('Please check your .env file.\n');
  process.exit(1);
} else {
  console.log('✅ All required environment variables are set!\n');
  process.exit(0);
}


