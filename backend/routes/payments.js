const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verifyToken } = require('./auth');

// Apply coupon code
router.post('/apply-coupon', async (req, res) => {
  try {
    const { code, total_amount } = req.body;

    if (!code || !total_amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    // Find coupon
    const [coupons] = await pool.execute(
      `SELECT * FROM coupons 
       WHERE code = ? 
       AND is_active = TRUE 
       AND valid_from <= CURDATE() 
       AND valid_until >= CURDATE()
       AND (usage_limit IS NULL OR used_count < usage_limit)`,
      [code.toUpperCase()]
    );

    if (coupons.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Invalid or expired coupon code' 
      });
    }

    const coupon = coupons[0];

    // Check minimum purchase
    if (total_amount < coupon.min_purchase) {
      return res.status(400).json({ 
        success: false, 
        message: `Minimum purchase of $${coupon.min_purchase} required` 
      });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discount_type === 'percentage') {
      discount = (total_amount * coupon.discount_value) / 100;
      if (coupon.max_discount && discount > coupon.max_discount) {
        discount = coupon.max_discount;
      }
    } else {
      discount = coupon.discount_value;
    }

    const finalAmount = total_amount - discount;

    res.json({
      success: true,
      coupon: {
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        discount: parseFloat(discount.toFixed(2)),
        original_amount: total_amount,
        final_amount: parseFloat(finalAmount.toFixed(2))
      }
    });
  } catch (error) {
    console.error('Apply coupon error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to apply coupon' 
    });
  }
});

// Process payment (simulated - integrate with real payment gateway)
router.post('/process', verifyToken, async (req, res) => {
  try {
    const { booking_id, payment_method, payment_info, billing_info } = req.body;

    // Verify booking exists and belongs to user
    const [bookings] = await pool.execute(
      'SELECT * FROM bookings WHERE id = ? AND user_id = ?',
      [booking_id, req.user.userId]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
    }

    const booking = bookings[0];

    if (booking.payment_status === 'completed') {
      return res.status(400).json({ 
        success: false, 
        message: 'Payment already processed' 
      });
    }

    // In a real application, integrate with payment gateway here
    // For now, we'll simulate successful payment
    const paymentStatus = 'completed'; // In production, get from payment gateway

    // Update booking
    await pool.execute(
      `UPDATE bookings 
       SET payment_method = ?,
           payment_info = ?,
           billing_info = ?,
           payment_status = ?,
           booking_status = 'confirmed'
       WHERE id = ?`,
      [
        payment_method,
        JSON.stringify(payment_info || {}),
        JSON.stringify(billing_info || {}),
        paymentStatus,
        booking_id
      ]
    );

    res.json({
      success: true,
      message: 'Payment processed successfully',
      booking_reference: booking.booking_reference
    });
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Payment processing failed' 
    });
  }
});

module.exports = router;


