const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { verifyToken } = require('./auth');
const { sendBookingConfirmation } = require('../services/emailService');

// Generate unique booking reference
function generateBookingReference() {
  const prefix = 'HTL';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// Calculate nights between dates
function calculateNights(checkIn, checkOut) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Create new booking
router.post('/', verifyToken, [
  body('room_id').isInt(),
  body('check_in').isISO8601().toDate(),
  body('check_out').isISO8601().toDate(),
  body('adults').isInt({ min: 1 }),
  body('children').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { room_id, check_in, check_out, adults, children = 0, rooms_count = 1, special_requests } = req.body;
    const user_id = req.user.userId;

    // Verify room exists
    const [rooms] = await pool.execute(
      'SELECT * FROM rooms WHERE id = ? AND is_available = TRUE',
      [room_id]
    );

    if (rooms.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Room not found or not available' 
      });
    }

    const room = rooms[0];

    // Check availability
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

    // Calculate prices
    const nights = calculateNights(check_in, check_out);
    const netPrice = parseFloat(room.price_per_night) * nights * rooms_count;
    const taxAmount = Math.round(netPrice * 0.18 * 100) / 100;
    const totalPrice = netPrice + taxAmount;

    // Generate booking reference
    const bookingReference = generateBookingReference();

    // Create booking
    const [result] = await pool.execute(
      `INSERT INTO bookings 
       (booking_reference, user_id, room_id, check_in, check_out, nights, adults, children, rooms_count, 
        net_price, tax_amount, total_price, special_requests, booking_status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [bookingReference, user_id, room_id, check_in, check_out, nights, adults, children, rooms_count,
       netPrice, taxAmount, totalPrice, special_requests || null]
    );

    // Get created booking with user info
    const [bookings] = await pool.execute(
      `SELECT b.*, r.name as room_name, r.slug as room_slug,
              u.email, u.first_name, u.last_name
       FROM bookings b 
       JOIN rooms r ON b.room_id = r.id 
       LEFT JOIN users u ON b.user_id = u.id
       WHERE b.id = ?`,
      [result.insertId]
    );

    const booking = bookings[0];

    // Send confirmation email (async, don't wait for it)
    if (booking.email && booking.first_name) {
      sendBookingConfirmation(booking, {
        email: booking.email,
        first_name: booking.first_name,
        last_name: booking.last_name
      }).catch(err => {
        console.error('Failed to send confirmation email:', err);
        // Don't fail the booking creation if email fails
      });
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking: booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create booking' 
    });
  }
});

// Get user's bookings
router.get('/my-bookings', verifyToken, async (req, res) => {
  try {
    const [bookings] = await pool.execute(
      `SELECT b.*, r.name as room_name, r.slug as room_slug, r.images as room_images
       FROM bookings b 
       JOIN rooms r ON b.room_id = r.id 
       WHERE b.user_id = ? 
       ORDER BY b.created_at DESC`,
      [req.user.userId]
    );

    const formattedBookings = bookings.map(booking => ({
      ...booking,
      room_images: JSON.parse(booking.room_images || '[]'),
      billing_info: booking.billing_info ? JSON.parse(booking.billing_info) : null,
      payment_info: booking.payment_info ? JSON.parse(booking.payment_info) : null
    }));

    res.json({
      success: true,
      count: formattedBookings.length,
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

// Get booking by reference
router.get('/:reference', verifyToken, async (req, res) => {
  try {
    const { reference } = req.params;

    const [bookings] = await pool.execute(
      `SELECT b.*, r.name as room_name, r.slug as room_slug, r.images as room_images
       FROM bookings b 
       JOIN rooms r ON b.room_id = r.id 
       WHERE b.booking_reference = ? AND b.user_id = ?`,
      [reference, req.user.userId]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
    }

    const booking = bookings[0];
    booking.room_images = JSON.parse(booking.room_images || '[]');
    booking.billing_info = booking.billing_info ? JSON.parse(booking.billing_info) : null;
    booking.payment_info = booking.payment_info ? JSON.parse(booking.payment_info) : null;

    res.json({
      success: true,
      booking
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch booking' 
    });
  }
});

// Update booking (for payment completion)
router.patch('/:id/payment', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_method, payment_info, billing_info } = req.body;

    // Verify booking belongs to user
    const [bookings] = await pool.execute(
      'SELECT * FROM bookings WHERE id = ? AND user_id = ?',
      [id, req.user.userId]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
    }

    // Update booking with payment info
    await pool.execute(
      `UPDATE bookings 
       SET payment_method = ?, 
           payment_info = ?, 
           billing_info = ?,
           payment_status = 'completed',
           booking_status = 'confirmed'
       WHERE id = ?`,
      [
        payment_method,
        JSON.stringify(payment_info || {}),
        JSON.stringify(billing_info || {}),
        id
      ]
    );

    // Get updated booking with user info
    const [updated] = await pool.execute(
      `SELECT b.*, r.name as room_name,
              u.email, u.first_name, u.last_name
       FROM bookings b 
       JOIN rooms r ON b.room_id = r.id 
       LEFT JOIN users u ON b.user_id = u.id
       WHERE b.id = ?`,
      [id]
    );

    const booking = updated[0];

    // Send confirmation email if booking status changed to confirmed
    if (booking.booking_status === 'confirmed' && booking.email && booking.first_name) {
      sendBookingConfirmation(booking, {
        email: booking.email,
        first_name: booking.first_name,
        last_name: booking.last_name
      }).catch(err => {
        console.error('Failed to send confirmation email:', err);
        // Don't fail the payment update if email fails
      });
    }

    res.json({
      success: true,
      message: 'Payment processed successfully',
      booking: booking
    });
  } catch (error) {
    console.error('Update booking payment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update booking' 
    });
  }
});

// Cancel booking (with password verification)
router.patch('/:id/cancel', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required for cancellation'
      });
    }

    // Verify user password
    const [users] = await pool.execute(
      'SELECT password FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(password, users[0].password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password. Cancellation denied.'
      });
    }

    // Verify booking belongs to user
    const [bookings] = await pool.execute(
      'SELECT * FROM bookings WHERE id = ? AND user_id = ?',
      [id, req.user.userId]
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

    if (booking.booking_status === 'checked_out') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot cancel a completed booking' 
      });
    }

    // Update booking status
    await pool.execute(
      'UPDATE bookings SET booking_status = "cancelled", updated_at = NOW() WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to cancel booking' 
    });
  }
});

module.exports = router;

