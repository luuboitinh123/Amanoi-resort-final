// Test Database Connection Script
// Run this to verify your .env database configuration is correct
// Usage: node scripts/test-db-connection.js

const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function testConnection() {
  console.log('🔍 Testing database connection...\n');
  console.log('Current Configuration:');
  console.log('  DB_HOST:', process.env.DB_HOST || 'localhost (default)');
  console.log('  DB_USER:', process.env.DB_USER || 'root (default)');
  console.log('  DB_PASSWORD:', process.env.DB_PASSWORD ? '*** (set)' : '(empty)');
  console.log('  DB_NAME:', process.env.DB_NAME || 'hotel_booking_db (default)');
  console.log('');

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hotel_booking_db'
    });

    console.log('✅ Database connection successful!');
    console.log('');
    console.log('Connection Details:');
    console.log('  Host:', process.env.DB_HOST || 'localhost');
    console.log('  User:', process.env.DB_USER || 'root');
    console.log('  Database:', process.env.DB_NAME || 'hotel_booking_db');
    
    // Test query
    const [rows] = await connection.execute('SELECT DATABASE() as current_db, USER() as current_user');
    console.log('');
    console.log('Current Database:', rows[0].current_db);
    console.log('Current User:', rows[0].current_user);
    
    // Check if tables exist
    const [tables] = await connection.execute(
      "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = ?",
      [process.env.DB_NAME || 'hotel_booking_db']
    );
    
    console.log('Tables in database:', tables[0].table_count);
    
    if (tables[0].table_count > 0) {
      const [tableList] = await connection.execute(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = ?",
        [process.env.DB_NAME || 'hotel_booking_db']
      );
      console.log('Table names:', tableList.map(t => t.table_name).join(', '));
    } else {
      console.log('⚠️  No tables found. Run "npm run init-db" to create tables.');
    }
    
    await connection.end();
    console.log('');
    console.log('✅ All tests passed! Your database configuration is correct.');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error('');
    console.error('Error Details:');
    console.error('  Code:', error.code);
    console.error('  Message:', error.message);
    console.error('');
    console.log('🔧 Troubleshooting:');
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('  → Check your DB_USER and DB_PASSWORD in .env file');
      console.log('  → For XAMPP default: DB_PASSWORD should be empty');
      console.log('  → If you set a MySQL password, add it to DB_PASSWORD');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('  → Check if MySQL is running in XAMPP');
      console.log('  → Start MySQL service in XAMPP Control Panel');
      console.log('  → Verify DB_HOST is correct (usually "localhost")');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('  → Database does not exist');
      console.log('  → Create it: CREATE DATABASE hotel_booking_db;');
      console.log('  → Or run: npm run init-db');
    } else {
      console.log('  → Check your .env file configuration');
      console.log('  → Verify MySQL is running');
      console.log('  → Check database credentials');
    }
    
    console.log('');
    console.log('Current .env settings:');
    console.log('  DB_HOST:', process.env.DB_HOST || '(not set)');
    console.log('  DB_USER:', process.env.DB_USER || '(not set)');
    console.log('  DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : '(not set or empty)');
    console.log('  DB_NAME:', process.env.DB_NAME || '(not set)');
    
    process.exit(1);
  }
}

testConnection();


