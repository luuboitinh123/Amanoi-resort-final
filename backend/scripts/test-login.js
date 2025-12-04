// Test Login Functionality
// Run: node scripts/test-login.js

require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function testLogin() {
  let connection;

  try {
    // Connect to database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hotel_booking_db'
    });

    console.log('📦 Connected to database\n');

    // Test admin login
    const adminEmail = 'admin@hotel.com';
    const adminPassword = 'admin123';

    console.log('Testing Admin Login:');
    console.log(`  Email: ${adminEmail}`);
    console.log(`  Password: ${adminPassword}\n`);

    // Find admin user
    const [users] = await connection.execute(
      'SELECT id, email, password, role FROM users WHERE email = ?',
      [adminEmail]
    );

    if (users.length === 0) {
      console.log('❌ Admin user not found!');
      console.log('   Run: npm run create-admin');
      return;
    }

    const user = users[0];
    console.log(`✅ Admin user found (ID: ${user.id}, Role: ${user.role})`);
    console.log(`   Password hash: ${user.password.substring(0, 20)}...`);

    // Test password verification
    const isValid = await bcrypt.compare(adminPassword, user.password);
    
    if (isValid) {
      console.log('✅ Password verification: SUCCESS');
      console.log('\n🎉 Admin login should work correctly!');
    } else {
      console.log('❌ Password verification: FAILED');
      console.log('   The password hash does not match.');
      console.log('   Run: npm run create-admin');
    }

    // Test customer login (if any exists)
    console.log('\n---\n');
    const [customers] = await connection.execute(
      'SELECT id, email, role FROM users WHERE role = "customer" LIMIT 1'
    );

    if (customers.length > 0) {
      console.log('Testing Customer Login:');
      console.log(`  Found ${customers.length} customer(s)`);
      console.log(`  Sample email: ${customers[0].email}`);
      console.log('  Note: Customer passwords are hashed, cannot test without knowing the password.');
    } else {
      console.log('No customer users found.');
      console.log('  Customers can register through the website.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Database connection error. Check your .env file:');
      console.error('   - DB_HOST');
      console.error('   - DB_USER');
      console.error('   - DB_PASSWORD (leave empty for XAMPP default)');
      console.error('   - DB_NAME');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testLogin();


