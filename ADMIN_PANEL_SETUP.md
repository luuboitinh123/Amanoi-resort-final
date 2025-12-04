# Admin Panel Setup Guide

## Overview

The admin panel provides a secure database management interface that is only accessible to users with admin privileges.

## Features

- **Statistics Dashboard**: View database statistics (users, rooms, bookings, reviews, revenue)
- **User Management**: View all registered users
- **Booking Management**: View all bookings with details
- **Room Management**: View all rooms and their details
- **SQL Query Executor**: Execute SELECT queries (read-only for security)
- **Table Structure Viewer**: View database table structures

## Security

- **Authentication Required**: Users must be logged in
- **Admin Role Required**: Only users with `role = 'admin'` can access
- **Read-Only Queries**: SQL query executor only allows SELECT statements
- **Token Verification**: All requests verify JWT tokens

## Setup Instructions

### 1. Create an Admin User

You can create an admin user in two ways:

#### Option A: Using the Database Seed File

The seed file (`backend/database/seed.sql`) includes a sample admin user:
- Email: `admin@hotel.com`
- Password: `admin123` (hashed with bcrypt)

**Note**: The password hash in the seed file is a placeholder. You need to generate a proper hash.

#### Option B: Manually Create Admin User

1. Register a normal user through the website
2. Update the user's role in the database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

#### Option C: Use bcrypt to Hash Password

1. Install bcryptjs: `npm install bcryptjs`
2. Create a script to hash your password:

```javascript
const bcrypt = require('bcryptjs');
const password = 'your-secure-password';
const hash = bcrypt.hashSync(password, 10);
console.log(hash);
```

3. Insert admin user:

```sql
INSERT INTO users (email, password, first_name, last_name, role) 
VALUES ('admin@hotel.com', '<hashed-password>', 'Admin', 'User', 'admin');
```

### 2. Access the Admin Panel

1. **Login** as an admin user at `auth.html`
2. After login, you'll see an **"Admin Panel"** link in your user dropdown menu
3. Click the link to access `admin.html`

### 3. API Endpoints

All admin endpoints are prefixed with `/api/admin`:

- `GET /api/admin/stats` - Get database statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/bookings` - Get all bookings
- `GET /api/admin/rooms` - Get all rooms
- `GET /api/admin/tables` - Get all database tables
- `GET /api/admin/table/:tableName` - Get table structure
- `POST /api/admin/query` - Execute SELECT query

## Usage

### Viewing Statistics

1. Navigate to the **Statistics** tab
2. View overview of users, rooms, bookings, reviews, and revenue
3. See recent bookings in the table below

### Managing Users

1. Navigate to the **Users** tab
2. View all registered users with their details
3. See user roles (admin/customer)

### Viewing Bookings

1. Navigate to the **Bookings** tab
2. View all bookings with user and room information
3. See booking status and amounts

### Managing Rooms

1. Navigate to the **Rooms** tab
2. View all rooms with pricing and availability
3. See room details and categories

### Executing SQL Queries

1. Navigate to the **SQL Query** tab
2. Enter a SELECT query (only SELECT is allowed)
3. Click "Execute Query" to see results

**Example queries:**
```sql
SELECT * FROM users LIMIT 10;
SELECT COUNT(*) as total FROM bookings WHERE status = 'confirmed';
SELECT email, first_name, last_name FROM users WHERE role = 'admin';
```

### Viewing Table Structures

1. Navigate to the **Tables** tab
2. View all database tables
3. Click "View Structure" to see column details

## Troubleshooting

### "Access denied. Admin privileges required."

- Make sure you're logged in as a user with `role = 'admin'`
- Check your user role in the database: `SELECT email, role FROM users WHERE email = 'your-email@example.com';`
- Update your role if needed: `UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';`

### "Session expired. Please login again."

- Your JWT token has expired
- Logout and login again
- Check your `.env` file for `JWT_EXPIRES_IN` setting (default: 7 days)

### "Only SELECT queries are allowed"

- The SQL query executor only allows SELECT statements for security
- Use phpMyAdmin or MySQL command line for INSERT, UPDATE, DELETE operations

### Admin Panel Link Not Showing

- Make sure you're logged in
- Verify your user has `role = 'admin'` in the database
- Clear browser cache and refresh the page
- Check browser console for JavaScript errors

## Security Best Practices

1. **Change Default Admin Password**: If using the seed file, change the admin password immediately
2. **Use Strong Passwords**: Admin accounts should have strong, unique passwords
3. **Limit Admin Users**: Only create admin accounts for trusted personnel
4. **Monitor Access**: Regularly review admin user list
5. **Secure Backend**: Ensure your backend server is properly secured and not publicly accessible

## File Structure

```
backend/
├── middleware/
│   └── adminAuth.js          # Admin authentication middleware
├── routes/
│   └── admin.js              # Admin API routes
desgin/
└── admin.html                # Admin panel frontend
frontend-integration/
└── api.js                    # AdminAPI client (added)
```

## Next Steps

- Add more admin features (edit users, manage bookings, etc.)
- Implement admin activity logging
- Add role-based permissions (super admin, manager, etc.)
- Create admin dashboard with charts and graphs


