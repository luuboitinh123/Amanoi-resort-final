-- =====================================================
-- Hotel Booking Database - Complete Setup Script
-- For XAMPP MySQL
-- =====================================================
-- Instructions:
-- 1. Open phpMyAdmin (http://localhost/phpmyadmin)
-- 2. Click on "SQL" tab
-- 3. Copy and paste this entire file
-- 4. Click "Go" to execute
-- =====================================================

-- Create database
-- CREATE DATABASE IF NOT EXISTS hotel_booking_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
-- USE hotel_booking_db;

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  address TEXT DEFAULT NULL,
  city VARCHAR(100) DEFAULT NULL,
  country VARCHAR(100) DEFAULT NULL,
  zip_code VARCHAR(20) DEFAULT NULL,
  role ENUM('customer', 'admin') DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- ROOMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT DEFAULT NULL,
  price_per_night DECIMAL(10, 2) NOT NULL,
  max_guests INT DEFAULT 2,
  size_sqm INT DEFAULT NULL,
  bed_type VARCHAR(100) DEFAULT NULL,
  amenities JSON DEFAULT NULL,
  images JSON DEFAULT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug (slug),
  INDEX idx_category (category),
  INDEX idx_available (is_available)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- BOOKINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_reference VARCHAR(50) UNIQUE NOT NULL,
  user_id INT DEFAULT NULL,
  room_id INT NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  nights INT NOT NULL,
  adults INT NOT NULL DEFAULT 1,
  children INT DEFAULT 0,
  rooms_count INT DEFAULT 1,
  total_price DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) NOT NULL,
  net_price DECIMAL(10, 2) NOT NULL,
  payment_method ENUM('vnpay_qr', 'bank_transfer', 'cards', 'cash') DEFAULT NULL,
  payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  booking_status ENUM('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled') DEFAULT 'pending',
  special_requests TEXT DEFAULT NULL,
  billing_info JSON DEFAULT NULL,
  payment_info JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT,
  INDEX idx_reference (booking_reference),
  INDEX idx_user (user_id),
  INDEX idx_room (room_id),
  INDEX idx_dates (check_in, check_out),
  INDEX idx_status (booking_status, payment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- REVIEWS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL,
  booking_id INT DEFAULT NULL,
  room_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT NULL,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  INDEX idx_room (room_id),
  INDEX idx_approved (is_approved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- COUPONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS coupons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type ENUM('percentage', 'fixed') NOT NULL,
  discount_value DECIMAL(10, 2) NOT NULL,
  min_purchase DECIMAL(10, 2) DEFAULT 0,
  max_discount DECIMAL(10, 2) DEFAULT NULL,
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  usage_limit INT DEFAULT NULL,
  used_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_code (code),
  INDEX idx_active (is_active, valid_from, valid_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- ROOM AVAILABILITY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS room_availability (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_id INT NOT NULL,
  date DATE NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  price_override DECIMAL(10, 2) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  UNIQUE KEY unique_room_date (room_id, date),
  INDEX idx_date (date),
  INDEX idx_available (is_available)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- INSERT SAMPLE DATA
-- =====================================================

-- Insert sample rooms
INSERT INTO rooms (name, slug, category, description, price_per_night, max_guests, size_sqm, bed_type, amenities, images) VALUES
('Deluxe King Room', 'deluxe', 'Deluxe', 'Elegant room with a king-sized bed and city views, ideal for business travelers or couples.', 220.00, 2, 35, '1 King Bed', 
 '["King-sized", "Smart TV", "Cold AC", "Minibar", "Free WiFi", "Private Bathroom"]',
 '["images/home-img-1.jpg"]'),

('Executive Suite', 'suite', 'Business', 'Premium suite designed for business professionals, offering a blend of luxury and functionality', 400.00, 2, 50, '1 King Bed',
 '["King-sized", "Smart TV", "Cold AC", "Minibar", "Free WiFi", "Private Bathroom", "Work Desk", "Coffee Maker"]',
 '["images/home-img-2.jpg"]'),

('Family Suite', 'family', 'Family', 'Spacious family-friendly suite with two bedrooms and a living area, perfect for a family vacation.', 300.00, 4, 65, '2 King Beds',
 '["King-sized", "Smart TV", "Cold AC", "Minibar", "Free WiFi", "Private Bathroom", "Living Area", "Sofa Bed"]',
 '["images/home-img-3.jpg"]'),

('Ocean View Room', 'ocean', 'Ocean View', 'Breathtaking ocean views with balcony access, premium amenities, and elegant decor.', 450.00, 2, 40, '1 King Bed',
 '["King-sized", "Smart TV", "Cold AC", "Minibar", "Free WiFi", "Private Bathroom", "Balcony", "Ocean View"]',
 '["images/gallery-img-1.jpg"]'),

('Presidential Suite', 'presidential', 'Presidential', 'Ultimate luxury with multiple rooms, private balcony, and exclusive amenities.', 800.00, 4, 120, '2 King Beds',
 '["King-sized", "Smart TV", "Cold AC", "Minibar", "Free WiFi", "Private Bathroom", "Living Room", "Dining Area", "Private Balcony", "Jacuzzi"]',
 '["images/gallery-img-3.webp"]');

-- Insert admin user
-- Password: admin123 (hashed with bcrypt)
-- You can change this password after first login
INSERT INTO users (email, password, first_name, last_name, phone, role) VALUES
('admin@hotel.com', '123456', 'Admin', 'User', '+1234567890', 'admin');

-- Insert sample customer user
-- Password: customer123 (hashed with bcrypt)
INSERT INTO users (email, password, first_name, last_name, phone, role) VALUES
('customer@example.com', '1234', 'John', 'Doe', '+1234567891', 'customer');

-- Insert sample coupons
INSERT INTO coupons (code, discount_type, discount_value, min_purchase, valid_from, valid_until, usage_limit, is_active) VALUES
('WELCOME10', 'percentage', 10.00, 100.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 100, TRUE),
('SUMMER2025', 'percentage', 15.00, 200.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 6 MONTH), 50, TRUE),
('SAVE50', 'fixed', 50.00, 300.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 3 MONTH), 30, TRUE);

-- =====================================================
-- VERIFICATION QUERIES (Optional - to check data)
-- =====================================================

-- Check if tables were created
-- SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'hotel_booking_db';

-- Check rooms
-- SELECT id, name, slug, category, price_per_night FROM rooms;

-- Check users
-- SELECT id, email, first_name, last_name, role FROM users;

-- Check coupons
-- SELECT code, discount_type, discount_value, is_active FROM coupons;

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- Your database is now ready to use.
-- 
-- Default Admin Credentials:
-- Email: admin@hotel.com
-- Password: admin123
-- 
-- Default Customer Credentials:
-- Email: customer@example.com
-- Password: customer123
-- 
-- Note: Change these passwords after first login!
-- =====================================================


