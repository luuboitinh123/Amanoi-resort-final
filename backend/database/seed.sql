-- Seed data for hotel booking database
USE hotel_booking_db;

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

-- Insert admin user (password: admin123 - change this!)
INSERT INTO users (email, password, first_name, last_name, phone, role) VALUES
('admin@hotel.com', '$2a$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq', 'Admin', 'User', '+1234567890', 'admin');

-- Insert sample coupon
INSERT INTO coupons (code, discount_type, discount_value, min_purchase, valid_from, valid_until, usage_limit, is_active) VALUES
('WELCOME10', 'percentage', 10.00, 100.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 100, TRUE),
('SUMMER2025', 'percentage', 15.00, 200.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 6 MONTH), 50, TRUE);


