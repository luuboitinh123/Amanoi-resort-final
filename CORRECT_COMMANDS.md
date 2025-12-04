# Correct Commands for Hotel Booking Project

## ⚠️ Important: Directory Structure

This project has the following structure:
```
D:\front-end - hotel bookinsg website\
├── backend\          ← Backend server (Node.js/Express)
│   ├── package.json  ← npm commands go here!
│   └── server.js
├── desgin\           ← Frontend (HTML/CSS/JS)
│   ├── index.html
│   └── ...
└── frontend-integration\
    └── api.js
```

## ✅ Correct Commands

### For Backend (npm commands):

**Step 1: Navigate to backend directory**
```bash
cd backend
```

**Step 2: Run npm commands**
```bash
# Install dependencies (first time only)
npm install

# Start development server
npm run dev

# Initialize database
npm run init-db

# Test database connection
npm run test-db
```

### For Frontend:

The frontend is in the `desgin` folder and doesn't use npm. It's static HTML/CSS/JS files that can be opened directly in a browser or served with a simple HTTP server (like Live Server in VS Code).

## 🚫 Common Mistakes

❌ **WRONG:** Running npm commands from root directory
```bash
D:\front-end - hotel bookinsg website> npm run dev
# Error: Cannot find package.json
```

✅ **CORRECT:** Navigate to backend first
```bash
D:\front-end - hotel bookinsg website> cd backend
D:\front-end - hotel bookinsg website\backend> npm run dev
# ✅ Works!
```

## 📋 Quick Reference

| Task | Command | Directory |
|------|---------|-----------|
| Start backend server | `npm run dev` | `backend/` |
| Install dependencies | `npm install` | `backend/` |
| Initialize database | `npm run init-db` | `backend/` |
| Test database | `npm run test-db` | `backend/` |
| View frontend | Open `desgin/index.html` in browser | Root |

## 🔧 Current Issue Fix

If you're getting "Cannot find package.json" error:

1. **Check your current directory:**
   ```bash
   cd
   ```

2. **Navigate to backend:**
   ```bash
   cd backend
   ```

3. **Verify package.json exists:**
   ```bash
   dir package.json
   ```

4. **Then run your npm command:**
   ```bash
   npm run dev
   ```


