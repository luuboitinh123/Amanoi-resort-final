// Create or Update Admin User
// Run: node scripts/create-admin.js

require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function createAdmin() {
  let connection;

  try {
    // Connect to database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hotel_booking_db'
    });

    console.log('📦 Connected to database');

    // Default admin credentials
    const adminEmail = 'admin@hotel.com';
    const adminPassword = 'admin123'; // Default password - CHANGE THIS IN PRODUCTION!
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Check if admin user exists
    const [existing] = await connection.execute(
      'SELECT id, email, role FROM users WHERE email = ?',
      [adminEmail]
    );

    if (existing.length > 0) {
      const user = existing[0];
      console.log(`👤 Admin user found (ID: ${user.id})`);
      
      // Update password if user exists
      await connection.execute(
        'UPDATE users SET password = ?, role = "admin" WHERE email = ?',
        [hashedPassword, adminEmail]
      );
      console.log('✅ Admin password updated successfully');
    } else {
      // Create new admin user
      const [result] = await connection.execute(
        `INSERT INTO users (email, password, first_name, last_name, phone, role) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [adminEmail, hashedPassword, 'Admin', 'User', '+1234567890', 'admin']
      );
      console.log(`✅ Admin user created successfully (ID: ${result.insertId})`);
    }

    console.log('\n📋 Admin Credentials:');
    console.log('   Email: admin@hotel.com');
    console.log('   Password: admin123');
    console.log('\n⚠️  WARNING: Change the default password in production!');
    console.log('   You can update it by running this script with a different password.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createAdmin();


