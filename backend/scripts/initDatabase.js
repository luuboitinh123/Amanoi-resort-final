const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

async function initDatabase() {
  let connection;

  try {
    // Connect to MySQL (without database)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });

    console.log('📦 Connected to MySQL server');

    // Read and execute schema
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Use query() instead of execute() for DDL statements
    // Split by semicolons and execute each statement
    const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      const trimmed = statement.trim();
      if (trimmed && !trimmed.startsWith('--')) {
        try {
          // Use query() for DDL statements (CREATE, USE, etc.)
          await connection.query(trimmed);
        } catch (err) {
          // Ignore "database already exists" errors
          if (!err.message.includes('already exists')) {
            throw err;
          }
        }
      }
    }

    console.log('✅ Database schema created successfully');

    // Read and execute seed data
    const seedPath = path.join(__dirname, '../database/seed.sql');
    const seed = fs.readFileSync(seedPath, 'utf8');
    
    const seedStatements = seed.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of seedStatements) {
      const trimmed = statement.trim();
      if (trimmed && !trimmed.startsWith('--')) {
        try {
          // Use query() for INSERT statements
          await connection.query(trimmed);
        } catch (err) {
          // Ignore duplicate entry errors
          if (!err.message.includes('Duplicate entry')) {
            console.warn('⚠️  Warning:', err.message);
          }
        }
      }
    }

    console.log('✅ Seed data inserted successfully');
    console.log('🎉 Database initialization complete!');

  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDatabase();

