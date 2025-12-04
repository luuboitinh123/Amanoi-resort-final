# Features Implementation Guide

This document outlines the implementation of the five major features requested:

1. **Admin Dashboard for Managing Reservations**
2. **User Review and Rating System**
3. **Real-time Calendar for Room Availability**
4. **Image Upload for Room Management**
5. **Advanced Search and Filtering Options**

## 1. Admin Dashboard Enhancement

### Backend Implementation
- ✅ Enhanced `/api/admin/bookings` endpoint with filtering and sorting
- ✅ Added room management endpoints (`/api/admin/rooms/:id` for updates)
- ✅ Booking cancellation with password verification

### Frontend Implementation
**File**: `desgin/admin.html`

**Features Added**:
- Advanced filtering (by status, date range, user, room)
- Sorting options (by date, price, status)
- Bulk actions (select multiple bookings)
- Export functionality
- Real-time statistics dashboard

**Usage**:
1. Navigate to Admin Panel (requires admin login)
2. Click "Bookings" tab
3. Use filters and sorting options
4. Select bookings for bulk actions

## 2. User Review and Rating System

### Backend Implementation
**File**: `backend/routes/reviews.js`

**Endpoints**:
- `GET /api/reviews/room/:roomId` - Get reviews for a room
- `GET /api/reviews/all` - Get all reviews (admin)
- `POST /api/reviews` - Create review (requires auth)
- `PATCH /api/reviews/:id/approve` - Approve/reject review (admin)
- `DELETE /api/reviews/:id` - Delete review (admin)
- `GET /api/reviews/room/:roomId/stats` - Get rating statistics

### Frontend Implementation

**Review Display Component**:
Add to `desgin/room-details.html`:

```html
<!-- Reviews Section -->
<section class="reviews-section" style="padding: 5rem 2rem;">
   <div class="box-container">
      <h2 style="font-size: 2.5rem; color: var(--text-dark); margin-bottom: 3rem; text-align: center;">Guest Reviews</h2>
      
      <!-- Rating Summary -->
      <div id="rating-summary" style="background: var(--sub-color); padding: 2rem; border-radius: 0.5rem; margin-bottom: 3rem;">
         <!-- Will be populated by JavaScript -->
      </div>
      
      <!-- Reviews List -->
      <div id="reviews-list">
         <!-- Will be populated by JavaScript -->
      </div>
      
      <!-- Review Form (for logged-in users) -->
      <div id="review-form-container" style="display: none; margin-top: 3rem;">
         <h3 style="font-size: 2rem; color: var(--text-dark); margin-bottom: 2rem;">Write a Review</h3>
         <form id="review-form" onsubmit="submitReview(event)">
            <div style="margin-bottom: 2rem;">
               <label style="display: block; font-size: 1.6rem; color: var(--text-dark); margin-bottom: 1rem;">Rating</label>
               <div class="star-rating">
                  <input type="radio" name="rating" value="5" id="star5"><label for="star5">★</label>
                  <input type="radio" name="rating" value="4" id="star4"><label for="star4">★</label>
                  <input type="radio" name="rating" value="3" id="star3"><label for="star3">★</label>
                  <input type="radio" name="rating" value="2" id="star2"><label for="star2">★</label>
                  <input type="radio" name="rating" value="1" id="star1"><label for="star1">★</label>
               </div>
            </div>
            <div style="margin-bottom: 2rem;">
               <label style="display: block; font-size: 1.6rem; color: var(--text-dark); margin-bottom: 1rem;">Comment</label>
               <textarea name="comment" class="box" rows="5" placeholder="Share your experience..." style="width: 100%;"></textarea>
            </div>
            <button type="submit" class="btn">Submit Review</button>
         </form>
      </div>
   </div>
</section>
```

**JavaScript** (add to `desgin/room-details.html`):
```javascript
// Load reviews for current room
async function loadReviews() {
   const urlParams = new URLSearchParams(window.location.search);
   const roomSlug = urlParams.get('room') || 'deluxe';
   
   try {
      // Get room ID first
      const roomResponse = await RoomsAPI.getBySlug(roomSlug);
      if (!roomResponse.success) return;
      
      const roomId = roomResponse.room.id;
      
      // Load reviews
      const reviewsResponse = await ReviewsAPI.getByRoom(roomId);
      const statsResponse = await ReviewsAPI.getStats(roomId);
      
      displayRatingSummary(statsResponse.stats);
      displayReviews(reviewsResponse.reviews);
      
      // Show review form if user is logged in
      const token = localStorage.getItem('authToken');
      if (token) {
         document.getElementById('review-form-container').style.display = 'block';
      }
   } catch (error) {
      console.error('Error loading reviews:', error);
   }
}

function displayRatingSummary(stats) {
   const avgRating = parseFloat(stats.average_rating || 0).toFixed(1);
   const totalReviews = stats.total_reviews || 0;
   
   document.getElementById('rating-summary').innerHTML = `
      <div style="display: flex; align-items: center; gap: 3rem;">
         <div>
            <div style="font-size: 4rem; color: var(--main-color); font-weight: bold;">${avgRating}</div>
            <div style="font-size: 1.6rem; color: var(--text-dark-alt);">${totalReviews} Review(s)</div>
         </div>
         <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
               <span style="width: 10rem;">5★</span>
               <div style="flex: 1; background: #e0e0e0; height: 1rem; border-radius: 0.5rem;">
                  <div style="background: var(--main-color); height: 100%; width: ${(stats.five_star / totalReviews * 100) || 0}%; border-radius: 0.5rem;"></div>
               </div>
               <span>${stats.five_star || 0}</span>
            </div>
            <!-- Repeat for 4, 3, 2, 1 stars -->
         </div>
      </div>
   `;
}

function displayReviews(reviews) {
   const container = document.getElementById('reviews-list');
   if (reviews.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: var(--text-dark-alt); padding: 3rem;">No reviews yet. Be the first to review!</p>';
      return;
   }
   
   container.innerHTML = reviews.map(review => `
      <div style="border: var(--border); padding: 2rem; border-radius: 0.5rem; margin-bottom: 2rem;">
         <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
            <div>
               <div style="font-weight: bold; font-size: 1.6rem; color: var(--text-dark);">${review.first_name} ${review.last_name}</div>
               <div style="font-size: 1.4rem; color: var(--text-dark-alt);">${new Date(review.created_at).toLocaleDateString()}</div>
            </div>
            <div style="color: var(--main-color); font-size: 1.8rem;">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
         </div>
         <p style="font-size: 1.6rem; color: var(--text-dark); line-height: 1.8;">${review.comment || 'No comment provided.'}</p>
      </div>
   `).join('');
}

async function submitReview(event) {
   event.preventDefault();
   const formData = new FormData(event.target);
   const rating = formData.get('rating');
   const comment = formData.get('comment');
   
   const urlParams = new URLSearchParams(window.location.search);
   const roomSlug = urlParams.get('room') || 'deluxe';
   
   try {
      const roomResponse = await RoomsAPI.getBySlug(roomSlug);
      const roomId = roomResponse.room.id;
      
      await ReviewsAPI.create({
         room_id: roomId,
         rating: parseInt(rating),
         comment: comment
      });
      
      alert('Review submitted! It will be published after admin approval.');
      event.target.reset();
      loadReviews();
   } catch (error) {
      alert('Error submitting review: ' + error.message);
   }
}

// Load reviews on page load
document.addEventListener('DOMContentLoaded', loadReviews);
```

## 3. Real-time Calendar for Room Availability

### Backend Implementation
**Endpoint**: `GET /api/rooms/:roomId/availability`

Returns unavailable dates for a room within a date range.

### Frontend Implementation

**Availability Calendar Component**:
Add to `desgin/room-details.html` or create `desgin/js/availability-calendar.js`:

```javascript
class AvailabilityCalendar {
   constructor(roomId, containerId) {
      this.roomId = roomId;
      this.container = document.getElementById(containerId);
      this.unavailableDates = [];
      this.currentMonth = new Date();
   }
   
   async loadAvailability() {
      try {
         const startDate = new Date();
         const endDate = new Date();
         endDate.setMonth(endDate.getMonth() + 6); // Next 6 months
         
         const response = await RoomsAPI.getAvailabilityCalendar(
            this.roomId,
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0]
         );
         
         this.unavailableDates = response.unavailable_dates || [];
         this.render();
      } catch (error) {
         console.error('Error loading availability:', error);
      }
   }
   
   render() {
      const month = this.currentMonth.getMonth();
      const year = this.currentMonth.getFullYear();
      
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      let html = `
         <div class="availability-calendar">
            <div class="calendar-header">
               <button onclick="calendar.prevMonth()">←</button>
               <h3>${this.currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
               <button onclick="calendar.nextMonth()">→</button>
            </div>
            <div class="calendar-grid">
               ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => `<div class="calendar-day-header">${day}</div>`).join('')}
      `;
      
      // Empty cells for days before month starts
      for (let i = 0; i < firstDay; i++) {
         html += '<div class="calendar-day empty"></div>';
      }
      
      // Days of the month
      for (let day = 1; day <= daysInMonth; day++) {
         const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
         const isUnavailable = this.unavailableDates.includes(dateStr);
         const isPast = new Date(dateStr) < new Date().setHours(0, 0, 0, 0);
         
         html += `
            <div class="calendar-day ${isUnavailable ? 'unavailable' : 'available'} ${isPast ? 'past' : ''}" 
                 data-date="${dateStr}">
               ${day}
            </div>
         `;
      }
      
      html += '</div></div>';
      this.container.innerHTML = html;
   }
   
   prevMonth() {
      this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
      this.render();
   }
   
   nextMonth() {
      this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
      this.render();
   }
}

// Usage
// const calendar = new AvailabilityCalendar(roomId, 'availability-calendar-container');
// calendar.loadAvailability();
```

## 4. Image Upload for Room Management

### Backend Implementation
**File**: `backend/routes/upload.js`

**Endpoints**:
- `POST /api/upload/rooms/:roomId/images` - Upload images (admin, multipart/form-data)
- `DELETE /api/upload/rooms/:roomId/images` - Delete image (admin)

### Frontend Implementation

**Admin Image Upload Interface**:
Add to `desgin/admin.html` in the Rooms tab:

```html
<!-- Image Upload Section -->
<div id="image-upload-section" style="display: none; margin-top: 2rem; padding: 2rem; border: var(--border); border-radius: 0.5rem;">
   <h3 style="font-size: 2rem; color: var(--text-dark); margin-bottom: 2rem;">Upload Room Images</h3>
   <form id="image-upload-form" onsubmit="uploadRoomImages(event)">
      <input type="file" id="room-images" name="images" multiple accept="image/*" required style="margin-bottom: 2rem;">
      <button type="submit" class="btn">Upload Images</button>
   </form>
   <div id="upload-progress" style="display: none; margin-top: 1rem;"></div>
</div>
```

**JavaScript**:
```javascript
async function uploadRoomImages(event) {
   event.preventDefault();
   const form = event.target;
   const formData = new FormData(form);
   const roomId = document.getElementById('selected-room-id').value; // Set when selecting a room
   
   const files = document.getElementById('room-images').files;
   if (files.length === 0) {
      alert('Please select at least one image');
      return;
   }
   
   // Add files to FormData
   Array.from(files).forEach(file => {
      formData.append('images', file);
   });
   
   try {
      document.getElementById('upload-progress').style.display = 'block';
      document.getElementById('upload-progress').innerHTML = 'Uploading...';
      
      const response = await UploadAPI.uploadRoomImages(roomId, formData);
      
      alert(`Successfully uploaded ${response.images.length} image(s)`);
      form.reset();
      loadRooms(); // Reload rooms list
   } catch (error) {
      alert('Error uploading images: ' + error.message);
   } finally {
      document.getElementById('upload-progress').style.display = 'none';
   }
}
```

## 5. Advanced Search and Filtering

### Backend Implementation
Enhanced `GET /api/rooms` endpoint with:
- `category` - Filter by room category
- `min_price` / `max_price` - Price range
- `amenities` - Comma-separated list of amenities
- `search` - Search in name/description
- `sort_by` - Sort options (price_asc, price_desc, name_asc, name_desc)
- `check_in` / `check_out` - Filter by availability

### Frontend Implementation

**Advanced Search Form**:
Add to `desgin/rooms.html`:

```html
<!-- Advanced Search Section -->
<div class="search-filters" style="background: var(--white); padding: 3rem; border: var(--border); border-radius: 0.5rem; margin-bottom: 3rem;">
   <h3 style="font-size: 2rem; color: var(--text-dark); margin-bottom: 2rem;">Search & Filter</h3>
   <form id="search-form" onsubmit="applyFilters(event)">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr)); gap: 2rem; margin-bottom: 2rem;">
         <div>
            <label style="display: block; font-size: 1.6rem; color: var(--text-dark); margin-bottom: 0.5rem;">Search</label>
            <input type="text" name="search" class="box" placeholder="Search rooms...">
         </div>
         <div>
            <label style="display: block; font-size: 1.6rem; color: var(--text-dark); margin-bottom: 0.5rem;">Category</label>
            <select name="category" class="box">
               <option value="">All Categories</option>
               <option value="deluxe">Deluxe</option>
               <option value="suite">Suite</option>
               <option value="family">Family</option>
            </select>
         </div>
         <div>
            <label style="display: block; font-size: 1.6rem; color: var(--text-dark); margin-bottom: 0.5rem;">Min Price</label>
            <input type="number" name="min_price" class="box" placeholder="$0">
         </div>
         <div>
            <label style="display: block; font-size: 1.6rem; color: var(--text-dark); margin-bottom: 0.5rem;">Max Price</label>
            <input type="number" name="max_price" class="box" placeholder="$1000">
         </div>
         <div>
            <label style="display: block; font-size: 1.6rem; color: var(--text-dark); margin-bottom: 0.5rem;">Sort By</label>
            <select name="sort_by" class="box">
               <option value="price_asc">Price: Low to High</option>
               <option value="price_desc">Price: High to Low</option>
               <option value="name_asc">Name: A to Z</option>
               <option value="name_desc">Name: Z to A</option>
            </select>
         </div>
      </div>
      <div style="margin-bottom: 2rem;">
         <label style="display: block; font-size: 1.6rem; color: var(--text-dark); margin-bottom: 0.5rem;">Amenities</label>
         <div style="display: flex; flex-wrap: wrap; gap: 1rem;">
            <label><input type="checkbox" name="amenities" value="wifi"> WiFi</label>
            <label><input type="checkbox" name="amenities" value="pool"> Pool</label>
            <label><input type="checkbox" name="amenities" value="spa"> Spa</label>
            <label><input type="checkbox" name="amenities" value="gym"> Gym</label>
            <!-- Add more amenities -->
         </div>
      </div>
      <button type="submit" class="btn">Apply Filters</button>
      <button type="button" onclick="clearFilters()" class="btn" style="background: transparent; border: 2px solid var(--main-color); color: var(--main-color); margin-left: 1rem;">Clear</button>
   </form>
</div>
```

**JavaScript**:
```javascript
async function applyFilters(event) {
   event.preventDefault();
   const formData = new FormData(event.target);
   
   const filters = {
      search: formData.get('search'),
      category: formData.get('category'),
      min_price: formData.get('min_price'),
      max_price: formData.get('max_price'),
      sort_by: formData.get('sort_by'),
      amenities: Array.from(formData.getAll('amenities')).join(',')
   };
   
   // Remove empty filters
   Object.keys(filters).forEach(key => {
      if (!filters[key]) delete filters[key];
   });
   
   try {
      const response = await RoomsAPI.getAll(filters);
      displayRooms(response.rooms);
   } catch (error) {
      console.error('Error applying filters:', error);
   }
}

function clearFilters() {
   document.getElementById('search-form').reset();
   loadRooms(); // Reload all rooms
}
```

## Installation & Setup

1. **Install Dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Create Uploads Directory**:
   ```bash
   mkdir -p backend/uploads/rooms
   ```

3. **Update Environment Variables** (if needed):
   - No additional env vars required for basic functionality

4. **Start Backend Server**:
   ```bash
   npm run dev
   ```

## API Endpoints Summary

### Reviews
- `GET /api/reviews/room/:roomId` - Get room reviews
- `POST /api/reviews` - Create review
- `PATCH /api/reviews/:id/approve` - Approve review (admin)
- `GET /api/reviews/room/:roomId/stats` - Get rating stats

### Upload
- `POST /api/upload/rooms/:roomId/images` - Upload images (admin)
- `DELETE /api/upload/rooms/:roomId/images` - Delete image (admin)

### Rooms (Enhanced)
- `GET /api/rooms?search=&category=&min_price=&max_price=&amenities=&sort_by=` - Advanced search
- `GET /api/rooms/:roomId/availability` - Get availability calendar

### Admin (Enhanced)
- `PUT /api/admin/rooms/:id` - Update room (admin)

## Testing

1. **Test Reviews**:
   - Create a booking
   - Submit a review on room details page
   - Approve review in admin panel

2. **Test Image Upload**:
   - Go to admin panel → Rooms tab
   - Select a room
   - Upload images
   - Verify images appear in room details

3. **Test Advanced Search**:
   - Go to rooms page
   - Use search and filter options
   - Verify results update correctly

4. **Test Availability Calendar**:
   - View room details
   - Check availability calendar
   - Verify unavailable dates are marked

## Notes

- All admin features require admin authentication
- Image uploads are stored in `backend/uploads/rooms/`
- Reviews require admin approval before being displayed
- Availability calendar shows unavailable dates based on existing bookings
- Advanced search supports multiple filter combinations


