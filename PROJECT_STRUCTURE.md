# Project Structure Guide

## ✅ Fixed Project Structure

The project has been reorganized to eliminate duplicate `node_modules` and consolidate dependencies.

### 🏗️ New Structure

```
project-nagis/
├── package.json              # Main package.json with ALL dependencies
├── node_modules/             # Single node_modules for entire project
├── server/
│   ├── server.js            # Backend server
│   ├── .env                 # Server environment variables
│   ├── package.json         # Server metadata only (no dependencies)
│   └── test-*.js           # Server test files
├── src/                     # Frontend React code
├── public/                  # Frontend static files
└── start-servers.sh        # Script to start both servers
```

### 🔧 What Changed

**Before (❌ Problematic):**
```
project-nagis/
├── package.json             # Frontend dependencies only
├── node_modules/            # Frontend dependencies
├── server/
│   ├── package.json         # Server dependencies
│   ├── node_modules/        # ❌ Duplicate node_modules
│   └── server.js
```

**After (✅ Fixed):**
```
project-nagis/
├── package.json             # ALL dependencies (frontend + backend)
├── node_modules/            # Single node_modules for everything
├── server/
│   ├── package.json         # Metadata only (no dependencies)
│   └── server.js
```

## 🚀 How to Start Servers

### Option 1: Use the Script
```bash
./start-servers.sh
```

### Option 2: Use npm Scripts
```bash
# Start backend only
npm run server

# Start frontend only
npm start

# Start both together (development)
npm run dev
```

### Option 3: Manual Start
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm start
```

## 📦 Dependencies

### Frontend Dependencies
- React, React Router, React Icons
- Stripe React components
- Firebase
- Framer Motion

### Backend Dependencies
- Express, CORS, Helmet
- Stripe SDK
- Rate limiting, Security middleware
- PostgreSQL (for future database)

### Shared Dependencies
- dotenv (environment variables)
- All dependencies are now in the main `package.json`

## 🔍 Benefits

1. **No Duplicate Dependencies**: Single `node_modules` for everything
2. **Easier Management**: One place to manage all dependencies
3. **Smaller Project Size**: Eliminates duplicate packages
4. **Faster Installation**: Install dependencies once
5. **Consistent Versions**: No version conflicts between frontend/backend

## 🛠️ Development Workflow

### Starting Development
```bash
# Install all dependencies (once)
npm install

# Start both servers in development mode
npm run dev
```

### Production Build
```bash
# Build frontend
npm run build

# Start production server
npm run server
```

### Testing
```bash
# Test frontend
npm test

# Test backend (if you add tests)
npm run test:server
```

## 📝 Server Scripts

```json
{
  "scripts": {
    "start": "react-scripts start",        // Frontend development
    "build": "react-scripts build",        // Frontend production build
    "server": "node server/server.js",     // Backend production
    "server:dev": "nodemon server/server.js", // Backend development
    "dev": "concurrently \"npm run server:dev\" \"npm start\"" // Both
  }
}
```

## 🎯 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start both servers:**
   ```bash
   npm run dev
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001/health

## 🔧 Troubleshooting

### If servers won't start:
```bash
# Kill existing processes
pkill -f "node server"
pkill -f "react-scripts"

# Clear ports
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9

# Restart
npm run dev
```

### If dependencies are missing:
```bash
# Reinstall all dependencies
rm -rf node_modules package-lock.json
npm install
```

## 📊 Project Status

- ✅ **Consolidated Dependencies**: All in one place
- ✅ **Working Backend**: Server runs from main directory
- ✅ **Working Frontend**: React app starts normally
- ✅ **Split Payments**: Fixed and working
- ✅ **Payment Calculations**: Fixed and accurate

The project structure is now clean, efficient, and maintainable! 🎉 