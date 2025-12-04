// Image Upload Routes
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const upload = require('../middleware/upload');
const verifyAdmin = require('../middleware/adminAuth');
const pool = require('../config/database');

// Upload room images (admin only)
router.post('/rooms/:roomId/images', verifyAdmin, upload.array('images', 10), async (req, res) => {
  try {
    const { roomId } = req.params;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images uploaded'
      });
    }

    // Get current room images
    const [rooms] = await pool.execute('SELECT images FROM rooms WHERE id = ?', [roomId]);
    
    if (rooms.length === 0) {
      // Delete uploaded files if room doesn't exist
      req.files.forEach(file => {
        fs.unlinkSync(file.path);
      });
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const currentImages = JSON.parse(rooms[0].images || '[]');

    // Generate URLs for uploaded images
    const newImages = req.files.map(file => {
      // Return relative path that can be served statically
      return `/uploads/rooms/${path.basename(file.filename)}`;
    });

    // Combine with existing images
    const updatedImages = [...currentImages, ...newImages];

    // Update room with new images
    await pool.execute(
      'UPDATE rooms SET images = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [JSON.stringify(updatedImages), roomId]
    );

    res.json({
      success: true,
      message: `${req.files.length} image(s) uploaded successfully`,
      images: newImages,
      total_images: updatedImages.length
    });
  } catch (error) {
    console.error('Upload images error:', error);
    
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to upload images'
    });
  }
});

// Delete room image (admin only)
router.delete('/rooms/:roomId/images', verifyAdmin, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required'
      });
    }

    // Get current room images
    const [rooms] = await pool.execute('SELECT images FROM rooms WHERE id = ?', [roomId]);
    
    if (rooms.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const currentImages = JSON.parse(rooms[0].images || '[]');
    
    // Remove image from array
    const updatedImages = currentImages.filter(img => img !== imageUrl);

    // Delete file from filesystem
    const imagePath = path.join(__dirname, '../uploads/rooms', path.basename(imageUrl));
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    // Update room
    await pool.execute(
      'UPDATE rooms SET images = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [JSON.stringify(updatedImages), roomId]
    );

    res.json({
      success: true,
      message: 'Image deleted successfully',
      remaining_images: updatedImages.length
    });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image'
    });
  }
});

module.exports = router;


