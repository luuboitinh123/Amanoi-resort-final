// Script to help determine MySQL password configuration
// This will test both with and without password

const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function testConnection(config, description) {
  try {
    const connection = await mysql.createConnection(config);
    await connection.end();
    return { success: true, description };
  } catch (error) {
    return { success: false, description, error: error.message };
  }
}

async function checkMySQLPassword() {
  console.log('🔍 Checking MySQL password configuration...\n');
  
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const database = process.env.DB_NAME || 'hotel_booking_db';
  const currentPassword = process.env.DB_PASSWORD || '';

  console.log('Current .env settings:');
  console.log(`  DB_HOST: ${host}`);
  console.log(`  DB_USER: ${user}`);
  console.log(`  DB_PASSWORD: ${currentPassword ? '*** (set)' : '(empty)'}`);
  console.log(`  DB_NAME: ${database}`);
  console.log('');

  // Test 1: Try with empty password
  console.log('Test 1: Trying connection with NO password...');
  const test1 = await testConnection({
    host,
    user,
    password: '',
    database
  }, 'No password');

  if (test1.success) {
    console.log('  ✅ SUCCESS! MySQL accepts connection without password.');
    console.log('  → Solution: Set DB_PASSWORD= (empty) in your .env file\n');
  } else {
    console.log('  ❌ Failed:', test1.error);
    console.log('  → MySQL requires a password\n');
  }

  // Test 2: Try with current password from .env
  if (currentPassword) {
    console.log('Test 2: Trying connection with current .env password...');
    const test2 = await testConnection({
      host,
      user,
      password: currentPassword,
      database
    }, 'Current .env password');

    if (test2.success) {
      console.log('  ✅ SUCCESS! Current password works.');
      console.log('  → Your .env password is correct, but check database name\n');
    } else {
      console.log('  ❌ Failed:', test2.error);
      console.log('  → Current password in .env is incorrect\n');
    }
  }

  // Test 3: Try common default passwords
  const commonPasswords = ['', 'root', 'password', '123456', 'admin'];
  console.log('Test 3: Trying common default passwords...');
  
  for (const pwd of commonPasswords) {
    if (pwd === currentPassword) continue; // Skip if already tested
    
    const test = await testConnection({
      host,
      user,
      password: pwd,
      database
    }, `Password: "${pwd || '(empty)'}"`);

    if (test.success) {
      console.log(`  ✅ SUCCESS with password: "${pwd || '(empty)'}"`);
      console.log(`  → Solution: Set DB_PASSWORD=${pwd} in your .env file\n`);
      return;
    }
  }
  console.log('  ❌ None of the common passwords worked\n');

  // Summary
  console.log('='.repeat(60));
  console.log('📋 Summary & Recommendations:\n');
  
  if (test1.success) {
    console.log('✅ RECOMMENDED FIX:');
    console.log('   Set DB_PASSWORD= (empty) in your .env file');
    console.log('   This is the XAMPP default configuration\n');
  } else if (currentPassword) {
    console.log('⚠️  Your .env has a password set, but it\'s not working.');
    console.log('   Options:');
    console.log('   1. Remove password from .env: DB_PASSWORD=');
    console.log('   2. Set the correct password in MySQL');
    console.log('   3. Check if you set a password in XAMPP MySQL settings\n');
  } else {
    console.log('⚠️  MySQL requires a password but .env has none set.');
    console.log('   You need to either:');
    console.log('   1. Set a password in MySQL and add it to .env');
    console.log('   2. Or remove password requirement from MySQL\n');
  }

  console.log('💡 Next Steps:');
  console.log('   1. Open backend/.env file');
  console.log('   2. Set DB_PASSWORD= (empty for XAMPP default)');
  console.log('   3. Save the file');
  console.log('   4. Run: npm run test-db\n');
}

checkMySQLPassword().catch(console.error);


