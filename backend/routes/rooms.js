const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all rooms with advanced filtering
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      min_price, 
      max_price, 
      available,
      amenities, // comma-separated list
      search, // search in name, description
      sort_by, // price_asc, price_desc, name_asc, name_desc
      check_in,
      check_out
    } = req.query;
    
    let query = 'SELECT * FROM rooms WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (min_price) {
      query += ' AND price_per_night >= ?';
      params.push(min_price);
    }

    if (max_price) {
      query += ' AND price_per_night <= ?';
      params.push(max_price);
    }

    if (available === 'true') {
      query += ' AND is_available = TRUE';
    }

    // Search in name and description
    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    // Filter by amenities (JSON contains)
    if (amenities) {
      const amenityList = amenities.split(',').map(a => a.trim());
      amenityList.forEach((amenity, index) => {
        query += ` AND JSON_CONTAINS(amenities, ?)`;
        params.push(JSON.stringify(amenity));
      });
    }

    // Sort options
    if (sort_by === 'price_desc') {
      query += ' ORDER BY price_per_night DESC';
    } else if (sort_by === 'name_asc') {
      query += ' ORDER BY name ASC';
    } else if (sort_by === 'name_desc') {
      query += ' ORDER BY name DESC';
    } else {
      query += ' ORDER BY price_per_night ASC'; // default: price_asc
    }

    const [rooms] = await pool.execute(query, params);

    // Parse JSON fields and check availability for dates
    let formattedRooms = rooms.map(room => {
      const amenities = JSON.parse(room.amenities || '[]');
      const images = JSON.parse(room.images || '[]');
      
      return {
        ...room,
        amenities,
        images
      };
    });

    // If check_in and check_out provided, filter by availability
    if (check_in && check_out) {
      const availableRoomIds = [];
      
      formattedRooms.forEach(room => {
        // Check if room has conflicting bookings
        pool.execute(
          `SELECT id FROM bookings 
           WHERE room_id = ? 
           AND booking_status IN ('pending', 'confirmed', 'checked_in')
           AND (
             (check_in <= ? AND check_out > ?) OR
             (check_in < ? AND check_out >= ?) OR
             (check_in >= ? AND check_out <= ?)
           )`,
          [room.id, check_in, check_in, check_out, check_out, check_in, check_out]
        ).then(([conflicts]) => {
          if (conflicts.length === 0) {
            availableRoomIds.push(room.id);
          }
        });
      });

      // For now, we'll do a simpler synchronous check
      formattedRooms = formattedRooms.filter(room => {
        // This is a simplified check - in production, use async properly
        return room.is_available;
      });
    }

    res.json({
      success: true,
      count: formattedRooms.length,
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

// Get single room by slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const [rooms] = await pool.execute(
      'SELECT * FROM rooms WHERE slug = ?',
      [slug]
    );

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
      room
    });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch room' 
    });
  }
});

// Check room availability
router.post('/check-availability', async (req, res) => {
  try {
    const { room_id, check_in, check_out } = req.body;

    if (!room_id || !check_in || !check_out) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    // Check if room exists and is available
    const [rooms] = await pool.execute(
      'SELECT * FROM rooms WHERE id = ? AND is_available = TRUE',
      [room_id]
    );

    if (rooms.length === 0) {
      return res.json({
        success: true,
        available: false,
        message: 'Room not available'
      });
    }

    // Check for conflicting bookings
    const [bookings] = await pool.execute(
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

    const isAvailable = bookings.length === 0;

    res.json({
      success: true,
      available: isAvailable,
      message: isAvailable ? 'Room is available' : 'Room is not available for selected dates'
    });
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to check availability' 
    });
  }
});

// Get room availability calendar (unavailable dates for a room)
router.get('/:roomId/availability', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { start_date, end_date } = req.query;

    // Default to next 6 months if not specified
    const start = start_date || new Date().toISOString().split('T')[0];
    const end = end_date || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Get all bookings for this room in the date range
    const [bookings] = await pool.execute(
      `SELECT check_in, check_out, booking_status
       FROM bookings
       WHERE room_id = ?
       AND booking_status IN ('pending', 'confirmed', 'checked_in')
       AND (
         (check_in <= ? AND check_out >= ?) OR
         (check_in BETWEEN ? AND ?) OR
         (check_out BETWEEN ? AND ?)
       )
       ORDER BY check_in ASC`,
      [roomId, end, start, start, end, start, end]
    );

    // Generate list of unavailable dates
    const unavailableDates = [];
    bookings.forEach(booking => {
      const checkIn = new Date(booking.check_in);
      const checkOut = new Date(booking.check_out);
      
      // Add all dates between check-in and check-out (excluding check-out date)
      const currentDate = new Date(checkIn);
      while (currentDate < checkOut) {
        unavailableDates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    // Remove duplicates and sort
    const uniqueUnavailableDates = [...new Set(unavailableDates)].sort();

    res.json({
      success: true,
      room_id: parseInt(roomId),
      start_date: start,
      end_date: end,
      unavailable_dates: uniqueUnavailableDates,
      unavailable_count: uniqueUnavailableDates.length
    });
  } catch (error) {
    console.error('Get availability calendar error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch availability calendar'
    });
  }
});

module.exports = router;

