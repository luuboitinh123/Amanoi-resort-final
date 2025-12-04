# Hotel Booking Backend API

Backend API for the Hotel Booking System built with Node.js, Express, and MySQL.

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   
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
   
   Edit `.env` and update with your database credentials and JWT secret.

3. **Initialize database:**
   ```bash
   npm run init-db
   ```
   This will create the database schema and insert seed data.

4. **Start the server:**
   ```bash
   # Development mode (with auto-reload)
   npm run dev

   # Production mode
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires token)

### Rooms
- `GET /api/rooms` - Get all rooms (with filters)
- `GET /api/rooms/:slug` - Get room by slug
- `POST /api/rooms/check-availability` - Check room availability

### Bookings
- `POST /api/bookings` - Create new booking (requires token)
- `GET /api/bookings/my-bookings` - Get user's bookings (requires token)
- `GET /api/bookings/:reference` - Get booking by reference (requires token)
- `PATCH /api/bookings/:id/payment` - Update booking payment (requires token)
- `PATCH /api/bookings/:id/cancel` - Cancel booking (requires token)

### Payments
- `POST /api/payments/apply-coupon` - Apply coupon code
- `POST /api/payments/process` - Process payment (requires token)

### Users
- `PUT /api/users/profile` - Update user profile (requires token)

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_token>
```

## Database Schema

The database includes the following tables:
- `users` - User accounts
- `rooms` - Room information
- `bookings` - Booking records
- `reviews` - User reviews
- `coupons` - Discount coupons
- `room_availability` - Room availability calendar

## Environment Variables

See `.env.example` for all required environment variables.

## Email Configuration

The system supports automated email confirmations for bookings. To enable:

1. Set `EMAIL_ENABLED=true` in `.env`
2. Configure SMTP settings (see `EMAIL_SETUP.md` for detailed instructions)
3. Test configuration: `npm run test-email`

For Gmail setup:
- Enable 2-Factor Authentication
- Generate an App Password: https://myaccount.google.com/apppasswords
- Use the App Password (not your regular password) in `SMTP_PASS`

See `EMAIL_SETUP.md` for complete email configuration guide.

## Development

The server runs on `http://localhost:3000` by default. API health check: `http://localhost:3000/api/health`

