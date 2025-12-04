# How to Start the Backend Server

## Quick Start

If you're seeing an error like "Cannot connect to server", the backend server is not running. Follow these steps:

### Step 1: Open Terminal/Command Prompt

- **Windows**: Press `Win + R`, type `cmd` or `powershell`, press Enter
- **Mac/Linux**: Open Terminal

### Step 2: Navigate to Backend Folder

```bash
cd backend
```

**Important**: Make sure you're in the `backend` folder, not the root project folder!

### Step 3: Start the Server

```bash
npm run dev
```

You should see:
```
🚀 Server is running on http://localhost:3000
📊 API Health: http://localhost:3000/api/health
```

### Step 4: Keep the Terminal Open

**Don't close the terminal window!** The server needs to keep running. You can minimize it, but don't close it.

## Verify Server is Running

1. Open your browser
2. Go to: `http://localhost:3000`
3. You should see a JSON response with API information

Or check: `http://localhost:3000/api/health`

## Common Issues

### "npm: command not found"
- Install Node.js from: https://nodejs.org/
- Restart your terminal after installation

### "Cannot find module"
- Run: `npm install` (in the backend folder)
- Then try: `npm run dev`

### "Port 3000 already in use"
- Another application is using port 3000
- Close that application or change the port in `backend/.env`

### "Access denied" or Database errors
- Make sure MySQL/XAMPP is running
- Check your `.env` file in the backend folder
- See `backend/README.md` for database setup

## Need Help?

- Check `backend/README.md` for detailed setup
- Check `QUICK_START.md` for full setup guide
- Make sure database is initialized: `npm run init-db` (in backend folder)


