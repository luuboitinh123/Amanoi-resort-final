# Hotel Booking System - Dynamic Implementation Guide

This guide walks you through transforming the static hotel booking website into a fully functional dynamic web application with database integration.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Step-by-Step Implementation](#step-by-step-implementation)
5. [Database Setup](#database-setup)
6. [Backend Setup](#backend-setup)
7. [Frontend Integration](#frontend-integration)
8. [Testing](#testing)
9. [Deployment](#deployment)

## 🎯 Overview

We'll transform your static site into a dynamic application with:
- ✅ User authentication (register/login)
- ✅ Dynamic room data from database
- ✅ Real booking system with availability checking
- ✅ Payment processing integration
- ✅ Booking management
- ✅ User profiles
- ✅ Admin panel (optional)

## 🛠 Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend
- **Vanilla JavaScript** - API integration
- **Fetch API** - HTTP requests
- **LocalStorage** - Token storage

## 📁 Project Structure

```
hotel-booking-system/
├── backend/
│   ├── config/
│   │   └── database.js          # Database connection
│   ├── database/
│   │   ├── schema.sql           # Database schema
│   │   └── seed.sql             # Sample data
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── rooms.js             # Room routes
│   │   ├── bookings.js          # Booking routes
│   │   ├── payments.js          # Payment routes
│   │   └── users.js             # User routes
│   ├── scripts/
│   │   └── initDatabase.js      # Database initialization
│   ├── .env.example             # Environment variables template
│   ├── package.json             # Dependencies
│   └── server.js                # Main server file
│
├── desgin/                      # Your existing frontend
│   ├── index.html
│   ├── rooms.html
│   ├── payment.html
│   ├── auth.html
│   └── ...
│
└── frontend-integration/
    └── api.js                   # API integration helper
```

## 🚀 Step-by-Step Implementation

### Step 1: Database Setup

1. **Install MySQL** (if not already installed)
   - Download from: https://dev.mysql.com/downloads/mysql/
   - Or use XAMPP/WAMP for Windows

2. **Create database:**
   ```sql
   CREATE DATABASE hotel_booking_db;
   ```

3. **Run the schema:**
   ```bash
   cd backend
   npm run init-db
   ```

### Step 2: Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   
   **Windows (PowerShell):**
   ```powershell
   Copy-Item .env.example .env
   ```
   
   **Windows (Command Prompt):**
   ```cmd
   copy .env.example .env
   ```
   
   **Linux/Mac:**
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` with your database credentials.

4. **Start the server:**
   ```bash
   npm run dev
   ```

   Server should start on `http://localhost:3000`

### Step 3: Frontend Integration

1. **Add API integration script to your HTML files:**
   ```html
   <script src="../frontend-integration/api.js"></script>
   ```

2. **Update form submissions to use API instead of URL parameters**

3. **Add authentication checks where needed**

## 📝 Detailed Implementation Steps

### A. Update Authentication Page (auth.html)

Replace the static form handlers with API calls:

```javascript
// In auth.html, replace handleLogin and handleRegister functions

async function handleLogin(event) {
  event.preventDefault();
  const email = event.target.email.value;
  const password = event.target.password.value;

  try {
    const response = await AuthAPI.login(email, password);
    if (response.success) {
      alert('Login successful!');
      window.location.href = 'index.html';
    }
  } catch (error) {
    alert('Login failed: ' + error.message);
  }
}

async function handleRegister(event) {
  event.preventDefault();
  const formData = {
    email: event.target.email.value,
    password: event.target.password.value,
    first_name: event.target.first_name.value,
    last_name: event.target.last_name.value,
    phone: event.target.phone.value
  };

  if (formData.password !== event.target.confirm_password.value) {
    alert('Passwords do not match!');
    return;
  }

  try {
    const response = await AuthAPI.register(formData);
    if (response.success) {
      alert('Registration successful! Please login.');
      switchTab('login');
    }
  } catch (error) {
    alert('Registration failed: ' + error.message);
  }
}
```

### B. Update Rooms Page (rooms.html)

Load rooms dynamically from API:

```javascript
// Add to rooms.html
async function loadRooms() {
  try {
    const response = await RoomsAPI.getAll();
    if (response.success) {
      displayRooms(response.rooms);
    }
  } catch (error) {
    console.error('Failed to load rooms:', error);
  }
}

function displayRooms(rooms) {
  const container = document.querySelector('.box-container');
  container.innerHTML = rooms.map(room => `
    <div class="box">
      <div class="image">
        <img src="${room.images[0] || 'images/home-img-1.jpg'}" alt="${room.name}">
      </div>
      <div class="content">
        <div style="font-size: 1.4rem; color: var(--accent-brown); margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.1rem;">${room.category}</div>
        <h3 style="font-size: 2.5rem; margin-bottom: 1rem;">${room.name}</h3>
        <p style="margin-bottom: 2rem;">${room.description}</p>
        <div class="amenities">
          ${JSON.parse(room.amenities).map(amenity => 
            `<span><i class="fas fa-check"></i> ${amenity}</span>`
          ).join('')}
        </div>
        <div class="price" style="margin-bottom: 2rem;">
          <div style="font-size: 1.4rem; color: var(--text-light); margin-bottom: 0.5rem;">Starting from</div>
          <div style="font-size: 3rem; font-weight: bold; color: var(--main-color);">$${room.price_per_night} <span style="font-size: 1.8rem; font-weight: normal; color: var(--text-light);">/ night</span></div>
        </div>
        <a href="room-details.html?room=${room.slug}" class="btn">Book now</a>
      </div>
    </div>
  `).join('');
}

// Call on page load
document.addEventListener('DOMContentLoaded', loadRooms);
```

### C. Update Payment Page (payment.html)

Replace static booking summary with API data and add payment processing:

```javascript
// Update confirmReservation function in payment.html
async function confirmReservation() {
  const terms = document.querySelector('input[name="terms"]');
  if (!terms.checked) {
    alert('Please agree to the terms and conditions');
    return;
  }

  const paymentMethod = document.querySelector('input[name="payment_method"]:checked');
  if (!paymentMethod) {
    alert('Please select a payment method');
    return;
  }

  // Get booking ID from URL or create new booking
  const urlParams = new URLSearchParams(window.location.search);
  const bookingId = urlParams.get('booking_id');

  // Collect payment and billing info
  const paymentData = {
    booking_id: bookingId,
    payment_method: paymentMethod.value,
    payment_info: collectPaymentInfo(paymentMethod.value),
    billing_info: collectBillingInfo()
  };

  try {
    // Process payment
    const paymentResponse = await PaymentsAPI.process(paymentData);
    
    if (paymentResponse.success) {
      // Redirect to confirmation
      window.location.href = `booking-confirmation.html?reference=${paymentResponse.booking_reference}`;
    }
  } catch (error) {
    alert('Payment failed: ' + error.message);
  }
}
```

### D. Update Booking Flow

1. **Room Details → Create Booking:**
   ```javascript
   // In room-details.html booking form
   async function handleBookingSubmit(event) {
     event.preventDefault();
     
     const formData = {
       room_id: getRoomIdFromSlug(),
       check_in: event.target.check_in.value,
       check_out: event.target.check_out.value,
       adults: event.target.adults.value,
       children: event.target.children.value,
       special_requests: event.target.special_requests?.value
     };

     try {
       const response = await BookingsAPI.create(formData);
       if (response.success) {
         window.location.href = `payment.html?booking_id=${response.booking.id}`;
       }
     } catch (error) {
       alert('Booking failed: ' + error.message);
     }
   }
   ```

## 🧪 Testing

1. **Test API endpoints:**
   ```bash
   # Health check
   curl http://localhost:3000/api/health

   # Get rooms
   curl http://localhost:3000/api/rooms
   ```

2. **Test authentication:**
   - Register a new user
   - Login with credentials
   - Check token is stored

3. **Test booking flow:**
   - Select room
   - Create booking
   - Process payment
   - View confirmation

## 🚢 Deployment

### Backend Deployment
1. Use services like:
   - Heroku
   - DigitalOcean
   - AWS EC2
   - Railway

2. Set environment variables on hosting platform

3. Use managed MySQL database:
   - AWS RDS
   - PlanetScale
   - ClearDB

### Frontend Deployment
1. Update `API_BASE_URL` in `api.js` to production URL
2. Deploy to:
   - Netlify
   - Vercel
   - GitHub Pages
   - Your own server

## 📚 Next Steps

1. **Add email notifications** for booking confirmations
2. **Integrate real payment gateway** (Stripe, PayPal, VNPAY)
3. **Add admin panel** for managing bookings
4. **Add review system** functionality
5. **Implement room availability calendar**
6. **Add image upload** for rooms
7. **Add search and filtering** functionality

## 🔒 Security Considerations

- ✅ Passwords are hashed with bcrypt
- ✅ JWT tokens for authentication
- ✅ SQL injection prevention with parameterized queries
- ✅ CORS configured
- ⚠️ Add rate limiting in production
- ⚠️ Add input validation on backend
- ⚠️ Use HTTPS in production
- ⚠️ Sanitize user inputs

## 📞 Support

For issues or questions, refer to:
- Express.js docs: https://expressjs.com/
- MySQL docs: https://dev.mysql.com/doc/
- JWT docs: https://jwt.io/

