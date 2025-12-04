# Database Configuration Guide for .env File

This guide shows you how to configure your `.env` file to match your database settings.

## 📋 Step-by-Step Configuration

### Step 1: Identify Your Database Settings

#### For XAMPP (Default Settings)
- **Host**: `localhost`
- **User**: `root`
- **Password**: (empty/blank - no password by default)
- **Port**: `3306` (default, usually not needed in .env)

#### For Custom MySQL Installation
- Check your MySQL installation settings
- Usually found in MySQL configuration files or during installation

### Step 2: Open Your .env File

Navigate to: `backend/.env`

### Step 3: Configure Database Variables

Update these lines in your `.env` file:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=hotel_booking_db
```

## 🔧 Configuration Examples

### Example 1: XAMPP Default (No Password)

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=hotel_booking_db
```

**Note**: Leave `DB_PASSWORD` completely empty (no spaces, no quotes)

### Example 2: XAMPP with Password Set

If you set a password for MySQL root user in XAMPP:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=hotel_booking_db
```

### Example 3: Custom MySQL Installation

```env
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=hotel_booking_db
```

### Example 4: Remote Database Server

```env
DB_HOST=192.168.1.100
DB_USER=dbuser
DB_PASSWORD=secure_password
DB_NAME=hotel_booking_db
```

## ✅ How to Verify Your Database Settings

### Method 1: Using phpMyAdmin (XAMPP)

1. Open XAMPP Control Panel
2. Start Apache and MySQL
3. Go to: `http://localhost/phpmyadmin`
4. Check the login credentials you use:
   - If you login without password → Use `DB_PASSWORD=`
   - If you login with password → Use that password

### Method 2: Test Connection with Node.js

Create a test file `backend/test-db-connection.js`:

```javascript
const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hotel_booking_db'
    });

    console.log('✅ Database connection successful!');
    console.log('Host:', process.env.DB_HOST);
    console.log('User:', process.env.DB_USER);
    console.log('Database:', process.env.DB_NAME);
    
    await connection.end();
  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error('Error:', error.message);
    console.log('\nCheck your .env file settings:');
    console.log('DB_HOST:', process.env.DB_HOST);
    console.log('DB_USER:', process.env.DB_USER);
    console.log('DB_NAME:', process.env.DB_NAME);
    console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : '(empty)');
  }
}

testConnection();
```

Run it:
```bash
node test-db-connection.js
```

## 🔍 Common Configuration Scenarios

### Scenario 1: Fresh XAMPP Installation

```env
# .env file content
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=hotel_booking_db
```

**Steps:**
1. Start XAMPP MySQL
2. Create database in phpMyAdmin: `CREATE DATABASE hotel_booking_db;`
3. Use the .env configuration above
4. Run `npm run init-db`

### Scenario 2: XAMPP with Root Password Set

If you've secured your MySQL with a password:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=MySecurePassword123
DB_NAME=hotel_booking_db
```

### Scenario 3: Using Different Database Name

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=my_custom_hotel_db
```

**Remember**: Update the database name in the SQL setup script or create it manually.

### Scenario 4: Non-Standard MySQL Port

If MySQL runs on a different port (e.g., 3307):

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=hotel_booking_db
# Note: Port is usually not needed, but if required, add to connection string
```

## ⚠️ Troubleshooting

### Error: "Access denied for user 'root'@'localhost'"

**Solution**: Check your password in `.env`
- If XAMPP default: Leave `DB_PASSWORD=` empty
- If password set: Add the correct password

### Error: "Unknown database 'hotel_booking_db'"

**Solution**: Create the database first:
1. Open phpMyAdmin
2. Click "New" or "SQL" tab
3. Run: `CREATE DATABASE hotel_booking_db;`
4. Or run: `npm run init-db` (it will create the database)

### Error: "Can't connect to MySQL server"

**Solution**: 
1. Check XAMPP MySQL is running (green in Control Panel)
2. Verify `DB_HOST=localhost` is correct
3. Check MySQL port (default 3306)

### Error: "Connection timeout"

**Solution**:
- Check firewall settings
- Verify MySQL service is running
- Check if MySQL is listening on the correct port

## 📝 Complete .env File Template

Here's a complete `.env` file with database configuration:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration (XAMPP Default)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=hotel_booking_db

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_12345
JWT_EXPIRES_IN=7d

# Frontend URL
FRONTEND_URL=http://localhost:5501
```

## ✅ Verification Checklist

After configuring your `.env` file:

- [ ] `DB_HOST` matches your MySQL host (usually `localhost`)
- [ ] `DB_USER` matches your MySQL username (usually `root` for XAMPP)
- [ ] `DB_PASSWORD` is correct (empty for XAMPP default)
- [ ] `DB_NAME` matches the database you created
- [ ] MySQL service is running in XAMPP
- [ ] Database exists (create it if needed)

## 🚀 Next Steps

1. ✅ Configure `.env` file with your database settings
2. ✅ Start MySQL in XAMPP
3. ✅ Create database (or run `npm run init-db`)
4. ✅ Test connection: `node test-db-connection.js`
5. ✅ Start server: `npm run dev`

## 💡 Quick Reference

| Setting | XAMPP Default | Custom MySQL |
|---------|--------------|--------------|
| DB_HOST | `localhost` | `localhost` or IP |
| DB_USER | `root` | Your username |
| DB_PASSWORD | (empty) | Your password |
| DB_NAME | `hotel_booking_db` | Your database name |


