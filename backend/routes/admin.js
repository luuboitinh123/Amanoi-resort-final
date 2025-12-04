// Admin Routes
// All routes require admin authentication

const express = require('express');
const router = express.Router();
const verifyAdmin = require('../middleware/adminAuth');
const pool = require('../config/database');

// Get database statistics
router.get('/stats', verifyAdmin, async (req, res) => {
  try {
    // Get counts for each table
    const [usersCount] = await pool.execute('SELECT COUNT(*) as count FROM users');
    const [roomsCount] = await pool.execute('SELECT COUNT(*) as count FROM rooms');
    const [bookingsCount] = await pool.execute('SELECT COUNT(*) as count FROM bookings');
    const [reviewsCount] = await pool.execute('SELECT COUNT(*) as count FROM reviews');
    
    // Get recent bookings
    const [recentBookings] = await pool.execute(`
      SELECT b.*, u.email, u.first_name, u.last_name, r.name as room_name
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN rooms r ON b.room_id = r.id
      ORDER BY b.created_at DESC
      LIMIT 10
    `);

    // Get revenue statistics
    const [revenue] = await pool.execute(`
      SELECT 
        SUM(total_price) as total_revenue,
        COUNT(*) as total_bookings,
        AVG(total_price) as avg_booking_value
      FROM bookings
      WHERE booking_status = 'confirmed'
    `);

    res.json({
      success: true,
      stats: {
        users: usersCount[0].count,
        rooms: roomsCount[0].count,
        bookings: bookingsCount[0].count,
        reviews: reviewsCount[0].count,
        revenue: revenue[0] || { total_revenue: 0, total_bookings: 0, avg_booking_value: 0 }
      },
      recentBookings: recentBookings
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

// Get all users
router.get('/users', verifyAdmin, async (req, res) => {
  try {
    const [users] = await pool.execute(`
      SELECT id, email, first_name, last_name, phone, role, created_at
      FROM users
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// Create new user (admin only)
router.post('/users', verifyAdmin, async (req, res) => {
  try {
    const { email, password, first_name, last_name, phone, address, city, country, zip_code, role } = req.body;

    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, first name, and last name are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Validate role
    if (role && !['customer', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be "customer" or "admin"'
      });
    }

    // Check if user exists
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await pool.execute(
      `INSERT INTO users (email, password, first_name, last_name, phone, address, city, country, zip_code, role) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        email.toLowerCase().trim(),
        hashedPassword,
        first_name.trim(),
        last_name.trim(),
        phone || null,
        address || null,
        city || null,
        country || null,
        zip_code || null,
        role || 'customer'
      ]
    );

    // Get created user (without password)
    const [users] = await pool.execute(
      'SELECT id, email, first_name, last_name, phone, address, city, country, zip_code, role, created_at FROM users WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: users[0]
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user'
    });
  }
});

// Create booking (admin only - can create for any user)
router.post('/bookings', verifyAdmin, async (req, res) => {
  try {
    const { user_id, room_id, check_in, check_out, adults, children = 0, rooms_count = 1, special_requests, booking_status = 'confirmed' } = req.body;

    if (!user_id || !room_id || !check_in || !check_out || !adults) {
      return res.status(400).json({
        success: false,
        message: 'user_id, room_id, check_in, check_out, and adults are required'
      });
    }

    // Verify user exists
    const [users] = await pool.execute('SELECT id FROM users WHERE id = ?', [user_id]);
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify room exists
    const [rooms] = await pool.execute('SELECT * FROM rooms WHERE id = ?', [room_id]);
    if (rooms.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const room = rooms[0];

    // Check availability (if status is confirmed or checked_in)
    if (booking_status === 'confirmed' || booking_status === 'checked_in') {
      const [conflicting] = await pool.execute(
        `SELECT id FROM bookings 
         WHERE room_id = ? 
         AND booking_status IN ('pending', 'confirmed', 'checked_in')
         AND (
           (check_in <= ? AND check_out > ?) OR
           (check_in < ? AND check_out >= ?) OR
           (check_in >= ? AND check_out <= ?)
         )`,
        [room_id, check_in, check_in, check_out, check_out, check_in, check_out]
      );

      if (conflicting.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Room is not available for selected dates'
        });
      }
    }

    // Calculate prices
    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const netPrice = parseFloat(room.price_per_night) * nights * rooms_count;
    const taxAmount = Math.round(netPrice * 0.18 * 100) / 100;
    const totalPrice = netPrice + taxAmount;

    // Generate booking reference
    const prefix = 'HTL';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const bookingReference = `${prefix}-${timestamp}-${random}`;

    // Create booking
    const [result] = await pool.execute(
      `INSERT INTO bookings 
       (booking_reference, user_id, room_id, check_in, check_out, nights, adults, children, rooms_count, 
        net_price, tax_amount, total_price, special_requests, booking_status, payment_method, payment_status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'cash', 'pending')`,
      [bookingReference, user_id, room_id, check_in, check_out, nights, adults, children, rooms_count,
       netPrice, taxAmount, totalPrice, special_requests || null, booking_status]
    );

    // Get created booking
    const [bookings] = await pool.execute(
      `SELECT b.*, r.name as room_name, r.slug as room_slug,
              u.email, u.first_name, u.last_name, u.phone
       FROM bookings b 
       JOIN rooms r ON b.room_id = r.id 
       LEFT JOIN users u ON b.user_id = u.id
       WHERE b.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking: bookings[0]
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking'
    });
  }
});

// Get all bookings
router.get('/bookings', verifyAdmin, async (req, res) => {
  try {
    const [bookings] = await pool.execute(`
      SELECT 
        b.*,
        u.email, u.first_name, u.last_name, u.phone,
        r.name as room_name, r.slug as room_slug, r.category as room_category
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN rooms r ON b.room_id = r.id
      ORDER BY b.created_at DESC
    `);

    // Parse JSON fields safely
    const formattedBookings = bookings.map(booking => {
      let billing_info = null;
      let payment_info = null;
      
      try {
        billing_info = booking.billing_info ? JSON.parse(booking.billing_info) : null;
      } catch (e) {
        console.warn('Error parsing billing_info:', e);
      }
      
      try {
        payment_info = booking.payment_info ? JSON.parse(booking.payment_info) : null;
      } catch (e) {
        console.warn('Error parsing payment_info:', e);
      }

      return {
        ...booking,
        billing_info,
        payment_info
      };
    });

    res.json({
      success: true,
      bookings: formattedBookings
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings'
    });
  }
});

// Cancel booking (admin) with password verification
router.post('/bookings/:id/cancel', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required for cancellation'
      });
    }

    // Verify admin password
    const [admins] = await pool.execute(
      'SELECT password FROM users WHERE id = ? AND role = "admin"',
      [req.user.userId]
    );

    if (admins.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Admin user not found'
      });
    }

    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(password, admins[0].password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password. Cancellation denied.'
      });
    }

    // Get booking
    const [bookings] = await pool.execute(
      'SELECT * FROM bookings WHERE id = ?',
      [id]
    );

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const booking = bookings[0];

    // Check if booking can be cancelled
    if (booking.booking_status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    if (booking.booking_status === 'checked_in') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a checked-in booking'
      });
    }

    // Update booking status
    await pool.execute(
      'UPDATE bookings SET booking_status = "cancelled", updated_at = NOW() WHERE id = ?',
      [id]
    );

    // Get updated booking with details
    const [updated] = await pool.execute(`
      SELECT 
        b.*,
        u.email, u.first_name, u.last_name,
        r.name as room_name
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN rooms r ON b.room_id = r.id
      WHERE b.id = ?
    `, [id]);

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking: updated[0]
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking'
    });
  }
});

// Get all rooms
router.get('/rooms', verifyAdmin, async (req, res) => {
  try {
    const [rooms] = await pool.execute(`
      SELECT * FROM rooms ORDER BY created_at DESC
    `);

    // Parse JSON fields
    const formattedRooms = rooms.map(room => ({
      ...room,
      amenities: JSON.parse(room.amenities || '[]'),
      images: JSON.parse(room.images || '[]')
    }));

    res.json({
      success: true,
      rooms: formattedRooms
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rooms'
    });
  }
});

// Create new room
router.post('/rooms', verifyAdmin, async (req, res) => {
  try {
    const { name, slug, category, description, price_per_night, max_guests, size_sqm, bed_type, amenities, images, is_available } = req.body;

    if (!name || !slug || !category || !price_per_night) {
      return res.status(400).json({
        success: false,
        message: 'Name, slug, category, and price_per_night are required'
      });
    }

    // Check if slug already exists
    const [existing] = await pool.execute(
      'SELECT id FROM rooms WHERE slug = ?',
      [slug]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Room with this slug already exists'
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO rooms (name, slug, category, description, price_per_night, max_guests, size_sqm, bed_type, amenities, images, is_available)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        slug,
        category,
        description || null,
        price_per_night,
        max_guests || 2,
        size_sqm || null,
        bed_type || null,
        JSON.stringify(amenities || []),
        JSON.stringify(images || []),
        is_available !== undefined ? is_available : true
      ]
    );

    // Get created room
    const [rooms] = await pool.execute('SELECT * FROM rooms WHERE id = ?', [result.insertId]);
    const room = rooms[0];
    room.amenities = JSON.parse(room.amenities || '[]');
    room.images = JSON.parse(room.images || '[]');

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      room: room
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create room'
    });
  }
});

// Update room (for image uploads and other updates)
router.put('/rooms/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, price_per_night, category, max_guests, size_sqm, bed_type, amenities, images, is_available } = req.body;

    // Build update query dynamically
    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (slug !== undefined) {
      // Check if slug is already taken by another room
      const [existing] = await pool.execute(
        'SELECT id FROM rooms WHERE slug = ? AND id != ?',
        [slug, id]
      );
      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Room with this slug already exists'
        });
      }
      updates.push('slug = ?');
      params.push(slug);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (price_per_night !== undefined) {
      updates.push('price_per_night = ?');
      params.push(price_per_night);
    }
    if (category !== undefined) {
      updates.push('category = ?');
      params.push(category);
    }
    if (max_guests !== undefined) {
      updates.push('max_guests = ?');
      params.push(max_guests);
    }
    if (size_sqm !== undefined) {
      updates.push('size_sqm = ?');
      params.push(size_sqm);
    }
    if (bed_type !== undefined) {
      updates.push('bed_type = ?');
      params.push(bed_type);
    }
    if (amenities !== undefined) {
      updates.push('amenities = ?');
      params.push(JSON.stringify(amenities));
    }
    if (images !== undefined) {
      updates.push('images = ?');
      params.push(JSON.stringify(images));
    }
    if (is_available !== undefined) {
      updates.push('is_available = ?');
      params.push(is_available);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    params.push(id);

    await pool.execute(
      `UPDATE rooms SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      params
    );

    // Get updated room
    const [rooms] = await pool.execute('SELECT * FROM rooms WHERE id = ?', [id]);
    if (rooms.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }
    const room = rooms[0];
    room.amenities = JSON.parse(room.amenities || '[]');
    room.images = JSON.parse(room.images || '[]');

    res.json({
      success: true,
      message: 'Room updated successfully',
      room: room
    });
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update room'
    });
  }
});

// Delete room
router.delete('/rooms/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if room has active bookings
    const [bookings] = await pool.execute(
      `SELECT id FROM bookings 
       WHERE room_id = ? 
       AND booking_status IN ('pending', 'confirmed', 'checked_in')`,
      [id]
    );

    if (bookings.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete room with active bookings'
      });
    }

    await pool.execute('DELETE FROM rooms WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Room deleted successfully'
    });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete room'
    });
  }
});

// Execute custom SQL query (for database management)
router.post('/query', verifyAdmin, async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Query is required'
      });
    }

    // Security: Only allow SELECT queries for safety
    const trimmedQuery = query.trim().toUpperCase();
    if (!trimmedQuery.startsWith('SELECT')) {
      return res.status(403).json({
        success: false,
        message: 'Only SELECT queries are allowed for security reasons'
      });
    }

    const [results] = await pool.execute(query);

    res.json({
      success: true,
      results,
      rowCount: results.length
    });
  } catch (error) {
    console.error('Query execution error:', error);
    res.status(500).json({
      success: false,
      message: 'Query execution failed',
      error: error.message
    });
  }
});

// Get table structure
router.get('/tables', verifyAdmin, async (req, res) => {
  try {
    const [tables] = await pool.execute(`
      SELECT TABLE_NAME, TABLE_ROWS, CREATE_TIME, UPDATE_TIME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME
    `, [process.env.DB_NAME || 'hotel_booking_db']);

    res.json({
      success: true,
      tables
    });
  } catch (error) {
    console.error('Get tables error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tables'
    });
  }
});

// Get table structure details
router.get('/table/:tableName', verifyAdmin, async (req, res) => {
  try {
    const { tableName } = req.params;

    const [columns] = await pool.execute(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT,
        COLUMN_KEY,
        EXTRA
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME || 'hotel_booking_db', tableName]);

    res.json({
      success: true,
      tableName,
      columns
    });
  } catch (error) {
    console.error('Get table structure error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch table structure'
    });
  }
});

// Export data (admin only)
router.get('/export/:type', verifyAdmin, async (req, res) => {
  try {
    const { type } = req.params;
    const { format = 'json' } = req.query;

    let data = [];
    let filename = '';

    switch (type) {
      case 'bookings':
        const [bookings] = await pool.execute(`
          SELECT b.*, r.name as room_name, u.email, u.first_name, u.last_name
          FROM bookings b
          LEFT JOIN rooms r ON b.room_id = r.id
          LEFT JOIN users u ON b.user_id = u.id
          ORDER BY b.created_at DESC
        `);
        data = bookings;
        filename = 'bookings';
        break;

      case 'users':
        const [users] = await pool.execute(`
          SELECT id, email, first_name, last_name, phone, address, city, country, zip_code, role, created_at
          FROM users
          ORDER BY created_at DESC
        `);
        data = users;
        filename = 'users';
        break;

      case 'rooms':
        const [rooms] = await pool.execute(`
          SELECT * FROM rooms ORDER BY created_at DESC
        `);
        data = rooms.map(room => ({
          ...room,
          amenities: JSON.parse(room.amenities || '[]'),
          images: JSON.parse(room.images || '[]')
        }));
        filename = 'rooms';
        break;

      case 'reviews':
        const [reviews] = await pool.execute(`
          SELECT r.*, u.email, u.first_name, u.last_name, rm.name as room_name
          FROM reviews r
          LEFT JOIN users u ON r.user_id = u.id
          LEFT JOIN rooms rm ON r.room_id = rm.id
          ORDER BY r.created_at DESC
        `);
        data = reviews;
        filename = 'reviews';
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid export type. Use: bookings, users, rooms, or reviews'
        });
    }

    if (format === 'csv') {
      // Convert to CSV
      if (data.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No data to export'
        });
      }

      const headers = Object.keys(data[0]);
      const csvRows = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            if (value === null || value === undefined) return '';
            if (typeof value === 'object') return JSON.stringify(value).replace(/"/g, '""');
            return String(value).replace(/"/g, '""');
          }).join(',')
        )
      ];

      const csv = csvRows.join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csv);
    } else {
      // JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}-${new Date().toISOString().split('T')[0]}.json"`);
      res.json({
        success: true,
        type,
        exported_at: new Date().toISOString(),
        count: data.length,
        data
      });
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export data'
    });
  }
});

// Get all reviews (admin only)
router.get('/reviews', verifyAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT r.*, u.first_name, u.last_name, u.email, rm.name as room_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN rooms rm ON r.room_id = rm.id
    `;
    const params = [];

    if (status === 'pending') {
      query += ' WHERE r.is_approved = FALSE';
    } else if (status === 'approved') {
      query += ' WHERE r.is_approved = TRUE';
    }

    query += ' ORDER BY r.created_at DESC';

    const [reviews] = await pool.execute(query, params);

    res.json({
      success: true,
      reviews: reviews
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews'
    });
  }
});

// Bulk import (admin only)
router.post('/import/:type', verifyAdmin, async (req, res) => {
  try {
    const { type } = req.params;
    const { data } = req.body;

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Data must be a non-empty array'
      });
    }

    let imported = 0;
    let errors = [];

    switch (type) {
      case 'users':
        const bcrypt = require('bcryptjs');
        for (const item of data) {
          try {
            if (!item.email || !item.password || !item.first_name || !item.last_name) {
              errors.push({ item, error: 'Missing required fields' });
              continue;
            }

            // Check if user exists
            const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [item.email.toLowerCase().trim()]);
            if (existing.length > 0) {
              errors.push({ item, error: 'Email already exists' });
              continue;
            }

            const hashedPassword = await bcrypt.hash(item.password, 10);
            await pool.execute(
              `INSERT INTO users (email, password, first_name, last_name, phone, address, city, country, zip_code, role)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                item.email.toLowerCase().trim(),
                hashedPassword,
                item.first_name.trim(),
                item.last_name.trim(),
                item.phone || null,
                item.address || null,
                item.city || null,
                item.country || null,
                item.zip_code || null,
                item.role || 'customer'
              ]
            );
            imported++;
          } catch (error) {
            errors.push({ item, error: error.message });
          }
        }
        break;

      case 'rooms':
        for (const item of data) {
          try {
            if (!item.name || !item.slug || !item.category || !item.price_per_night) {
              errors.push({ item, error: 'Missing required fields' });
              continue;
            }

            // Check if room exists
            const [existing] = await pool.execute('SELECT id FROM rooms WHERE slug = ?', [item.slug]);
            if (existing.length > 0) {
              errors.push({ item, error: 'Room slug already exists' });
              continue;
            }

            await pool.execute(
              `INSERT INTO rooms (name, slug, category, description, price_per_night, max_guests, size_sqm, bed_type, amenities, images, is_available)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                item.name,
                item.slug,
                item.category,
                item.description || null,
                item.price_per_night,
                item.max_guests || 2,
                item.size_sqm || null,
                item.bed_type || null,
                JSON.stringify(item.amenities || []),
                JSON.stringify(item.images || []),
                item.is_available !== undefined ? item.is_available : true
              ]
            );
            imported++;
          } catch (error) {
            errors.push({ item, error: error.message });
          }
        }
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid import type. Use: users or rooms'
        });
    }

    res.json({
      success: true,
      message: `Imported ${imported} ${type}`,
      imported,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import data'
    });
  }
});

module.exports = router;

