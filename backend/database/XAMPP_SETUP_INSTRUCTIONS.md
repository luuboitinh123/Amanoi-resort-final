# XAMPP MySQL Setup Instructions

## Quick Setup Guide for XAMPP

### Step 1: Start XAMPP Services

1. Open **XAMPP Control Panel**
2. Start **Apache** (if needed for phpMyAdmin)
3. Start **MySQL** - Click the "Start" button next to MySQL
4. Wait until MySQL status shows "Running" (green)

### Step 2: Access phpMyAdmin

1. Open your web browser
2. Go to: `http://localhost/phpmyadmin`
3. You should see the phpMyAdmin interface

### Step 3: Import SQL File

**Option A: Using SQL Tab (Recommended)**

1. In phpMyAdmin, click on the **"SQL"** tab at the top
2. Open the file `complete_setup.sql` in a text editor
3. Copy the **entire contents** of the file
4. Paste it into the SQL text area in phpMyAdmin
5. Click the **"Go"** button at the bottom
6. You should see success messages for each table created

**Option B: Using Import Tab**

1. In phpMyAdmin, click on the **"Import"** tab at the top
2. Click **"Choose File"** button
3. Select the `complete_setup.sql` file
4. Make sure **"SQL"** format is selected
5. Click **"Go"** at the bottom
6. Wait for the import to complete

### Step 4: Verify Database Creation

1. In the left sidebar, you should see **"hotel_booking_db"** database
2. Click on it to expand
3. You should see these tables:
   - `users`
   - `rooms`
   - `bookings`
   - `reviews`
   - `coupons`
   - `room_availability`

### Step 5: Verify Sample Data

1. Click on the **"rooms"** table
2. Click on the **"Browse"** tab
3. You should see 5 sample rooms

1. Click on the **"users"** table
2. Click on the **"Browse"** tab
3. You should see 2 sample users (admin and customer)

1. Click on the **"coupons"** table
2. Click on the **"Browse"** tab
3. You should see 3 sample coupons

## Troubleshooting

### Error: "Access denied for user"
- Make sure MySQL is running in XAMPP
- Default MySQL user is `root` with no password
- If you set a password, update it in `backend/.env`

### Error: "Database already exists"
- The script uses `CREATE DATABASE IF NOT EXISTS`, so it's safe to run again
- If you want to start fresh, drop the database first:
  ```sql
  DROP DATABASE IF EXISTS hotel_booking_db;
  ```
  Then run the setup script again

### Error: "Table already exists"
- The script uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run again
- If you want to recreate tables, drop them first:
  ```sql
  USE hotel_booking_db;
  DROP TABLE IF EXISTS room_availability;
  DROP TABLE IF EXISTS reviews;
  DROP TABLE IF EXISTS bookings;
  DROP TABLE IF EXISTS coupons;
  DROP TABLE IF EXISTS rooms;
  DROP TABLE IF EXISTS users;
  ```
  Then run the setup script again

### Can't see phpMyAdmin
- Make sure Apache is running in XAMPP
- Try: `http://127.0.0.1/phpmyadmin`
- Check XAMPP port settings (default is 80 for Apache)

## Database Configuration for Backend

After setting up the database, update your `backend/.env` file:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=          # Leave empty if no password set
DB_NAME=hotel_booking_db
```

## Default Credentials

**Admin Account:**
- Email: `admin@hotel.com`
- Password: `admin123`

**Customer Account:**
- Email: `customer@example.com`
- Password: `customer123`

⚠️ **Important:** Change these passwords after first login in production!

## Next Steps

1. ✅ Database is set up
2. ⏭️ Configure `backend/.env` with database credentials
3. ⏭️ Run `npm install` in the backend folder
4. ⏭️ Start the backend server: `npm run dev`
5. ⏭️ Test the API endpoints

## Manual SQL Execution (Alternative)

If you prefer to run SQL commands manually:

1. Open phpMyAdmin
2. Click on "SQL" tab
3. Run commands one by one from `complete_setup.sql`
4. Or copy sections and run them separately

## Testing the Database

Run these queries in phpMyAdmin SQL tab to verify:

```sql
-- Check all rooms
SELECT * FROM rooms;

-- Check all users
SELECT id, email, first_name, last_name, role FROM users;

-- Check all coupons
SELECT * FROM coupons;

-- Count records
SELECT 
    (SELECT COUNT(*) FROM rooms) as total_rooms,
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM coupons) as total_coupons;
```


