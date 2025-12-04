// Reviews Routes
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { verifyToken } = require('./auth');
const verifyAdmin = require('../middleware/adminAuth');

// Get reviews for a room
router.get('/room/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { approved_only = 'true' } = req.query;

    let query = `
      SELECT r.*, 
             u.first_name, u.last_name, u.email,
             b.booking_reference
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN bookings b ON r.booking_id = b.id
      WHERE r.room_id = ?
    `;
    const params = [roomId];

    if (approved_only === 'true') {
      query += ' AND r.is_approved = TRUE';
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

// Get all reviews (admin)
router.get('/all', verifyAdmin, async (req, res) => {
  try {
    const { status, room_id } = req.query;

    let query = `
      SELECT r.*, 
             u.first_name, u.last_name, u.email,
             rm.name as room_name, rm.slug as room_slug,
             b.booking_reference
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN rooms rm ON r.room_id = rm.id
      LEFT JOIN bookings b ON r.booking_id = b.id
      WHERE 1=1
    `;
    const params = [];

    if (status === 'approved') {
      query += ' AND r.is_approved = TRUE';
    } else if (status === 'pending') {
      query += ' AND r.is_approved = FALSE';
    }

    if (room_id) {
      query += ' AND r.room_id = ?';
      params.push(room_id);
    }

    query += ' ORDER BY r.created_at DESC';

    const [reviews] = await pool.execute(query, params);

    res.json({
      success: true,
      reviews: reviews
    });
  } catch (error) {
    console.error('Get all reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews'
    });
  }
});

// Create review (requires authentication)
router.post('/', verifyToken, [
  body('room_id').isInt(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('comment').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { room_id, booking_id, rating, comment } = req.body;
    const user_id = req.user.userId;

    // Verify room exists
    const [rooms] = await pool.execute('SELECT id FROM rooms WHERE id = ?', [room_id]);
    if (rooms.length === 0) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // If booking_id provided, verify it belongs to user
    if (booking_id) {
      const [bookings] = await pool.execute(
        'SELECT id FROM bookings WHERE id = ? AND user_id = ?',
        [booking_id, user_id]
      );
      if (bookings.length === 0) {
        return res.status(403).json({ success: false, message: 'Booking not found or does not belong to user' });
      }
    }

    // Check if user already reviewed this room
    const [existing] = await pool.execute(
      'SELECT id FROM reviews WHERE user_id = ? AND room_id = ?',
      [user_id, room_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this room' });
    }

    // Create review (pending approval by default)
    const [result] = await pool.execute(
      `INSERT INTO reviews (user_id, booking_id, room_id, rating, comment, is_approved)
       VALUES (?, ?, ?, ?, ?, FALSE)`,
      [user_id, booking_id || null, room_id, rating, comment || null]
    );

    // Get created review
    const [reviews] = await pool.execute(
      `SELECT r.*, u.first_name, u.last_name, u.email
       FROM reviews r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully. It will be published after admin approval.',
      review: reviews[0]
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create review'
    });
  }
});

// Update review (admin only)
router.put('/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, is_approved } = req.body;

    const updates = [];
    const params = [];

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }
      updates.push('rating = ?');
      params.push(rating);
    }
    if (comment !== undefined) {
      updates.push('comment = ?');
      params.push(comment);
    }
    if (is_approved !== undefined) {
      updates.push('is_approved = ?');
      params.push(is_approved);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    params.push(id);

    await pool.execute(
      `UPDATE reviews SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      params
    );

    // Get updated review
    const [reviews] = await pool.execute(
      `SELECT r.*, u.first_name, u.last_name, u.email, rm.name as room_name
       FROM reviews r
       LEFT JOIN users u ON r.user_id = u.id
       LEFT JOIN rooms rm ON r.room_id = rm.id
       WHERE r.id = ?`,
      [id]
    );

    if (reviews.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      message: 'Review updated successfully',
      review: reviews[0]
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review'
    });
  }
});

// Approve/Reject review (admin only)
router.patch('/:id/approve', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { approved = true } = req.body;

    await pool.execute(
      'UPDATE reviews SET is_approved = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [approved, id]
    );

    res.json({
      success: true,
      message: `Review ${approved ? 'approved' : 'rejected'} successfully`
    });
  } catch (error) {
    console.error('Approve review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review'
    });
  }
});

// Delete review (admin only)
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await pool.execute('DELETE FROM reviews WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review'
    });
  }
});

// Get room rating statistics
router.get('/room/:roomId/stats', async (req, res) => {
  try {
    const { roomId } = req.params;

    const [stats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
       FROM reviews
       WHERE room_id = ? AND is_approved = TRUE`,
      [roomId]
    );

    res.json({
      success: true,
      stats: stats[0] || {
        total_reviews: 0,
        average_rating: 0,
        five_star: 0,
        four_star: 0,
        three_star: 0,
        two_star: 0,
        one_star: 0
      }
    });
  } catch (error) {
    console.error('Get review stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review statistics'
    });
  }
});

module.exports = router;

