const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verifyToken } = require('./auth');

// Update user profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { first_name, last_name, phone, address, city, country, zip_code } = req.body;

    await pool.execute(
      `UPDATE users 
       SET first_name = ?, last_name = ?, phone = ?, address = ?, 
           city = ?, country = ?, zip_code = ?
       WHERE id = ?`,
      [first_name, last_name, phone, address, city, country, zip_code, req.user.userId]
    );

    // Get updated user
    const [users] = await pool.execute(
      'SELECT id, email, first_name, last_name, phone, address, city, country, zip_code, role FROM users WHERE id = ?',
      [req.user.userId]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: users[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update profile' 
    });
  }
});

module.exports = router;


