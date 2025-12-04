# Quick Start Guide - Dynamic Hotel Booking System

## 🚀 Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
# Navigate to backend folder
cd backend

# Install Node.js packages
npm install
```

### 2. Setup Database

1. **Install MySQL** (if not installed)
   - Download: https://dev.mysql.com/downloads/mysql/
   - Or use XAMPP: https://www.apachefriends.org/

2. **Create database:**
   ```sql
   CREATE DATABASE hotel_booking_db;
   ```

3. **Initialize database:**
   ```bash
   # Update .env with your MySQL credentials first
   npm run init-db
   ```

### 3. Configure Environment

The `.env` file has been created automatically. If you need to recreate it:

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

Then edit `backend/.env` and update with your database credentials:
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=          # Leave empty for XAMPP default (no password)
DB_NAME=hotel_booking_db
JWT_SECRET=your_super_secret_key_change_this
FRONTEND_URL=http://localhost:5501
```

### 4. Start Backend Server

```bash
npm run dev
```

Server will run on `http://localhost:3000`

### 5. Integrate Frontend

1. **Add API script to your HTML files:**
   ```html
   <script src="../frontend-integration/api.js"></script>
   ```

2. **Update auth.html:**
   - Include `api.js`
   - Replace `handleLogin` and `handleRegister` with async versions (see examples)

3. **Update rooms.html:**
   - Load rooms dynamically from API
   - See `frontend-integration/example-rooms-integration.js`

4. **Update payment.html:**
   - Connect booking creation to API
   - Connect payment processing to API
   - See `frontend-integration/example-payment-integration.js`

## 📝 Testing the API

### Test with curl:

```bash
# Health check
curl http://localhost:3000/api/health

# Get all rooms
curl http://localhost:3000/api/rooms

# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","first_name":"Test","last_name":"User"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 🔗 API Endpoints Summary

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/me` | Get current user | Yes |
| GET | `/api/rooms` | Get all rooms | No |
| GET | `/api/rooms/:slug` | Get room by slug | No |
| POST | `/api/rooms/check-availability` | Check availability | No |
| POST | `/api/bookings` | Create booking | Yes |
| GET | `/api/bookings/my-bookings` | Get user bookings | Yes |
| POST | `/api/payments/apply-coupon` | Apply coupon | No |
| POST | `/api/payments/process` | Process payment | Yes |

## 🎯 Next Steps

1. ✅ Backend is running
2. ✅ Database is initialized
3. ⏭️ Integrate frontend (see examples in `frontend-integration/`)
4. ⏭️ Test full booking flow
5. ⏭️ Deploy to production

## 🐛 Troubleshooting

**Database connection error:**
- Check MySQL is running
- Verify credentials in `.env`
- Ensure database exists

**Port already in use:**
- Change PORT in `.env`
- Or kill process using port 3000

**CORS errors:**
- Update `FRONTEND_URL` in `.env`
- Check backend CORS configuration

## 📚 Full Documentation

See `IMPLEMENTATION_GUIDE.md` for detailed implementation steps.

