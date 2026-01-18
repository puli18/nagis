# Project Structure Guide

## ✅ Current Project Structure

The project uses Firebase Functions for backend services (no local Express server).

### 🏗️ Structure

```
project-nagis/
├── package.json              # Frontend dependencies
├── node_modules/             # Frontend dependencies
├── firebase/
│   └── functions/           # Firebase Cloud Functions
│       ├── index.js         # Payment and order functions
│       └── package.json     # Functions dependencies
├── src/                     # Frontend React code
├── public/                  # Frontend static files
└── README.md                # Project documentation
```

## 🚀 How to Start Development

### Start Frontend
```bash
npm start
```

The frontend will run on http://localhost:3000

### Deploy Firebase Functions
```bash
cd firebase
firebase deploy --only functions
```

For local testing of functions, use Firebase emulators:
```bash
firebase emulators:start --only functions
```

## 📦 Dependencies

### Frontend Dependencies (package.json)
- React, React Router, React Icons
- Stripe React components (@stripe/react-stripe-js, @stripe/stripe-js)
- Firebase SDK
- Framer Motion

### Backend Dependencies (firebase/functions/package.json)
- Firebase Functions SDK
- Firebase Admin SDK
- Stripe SDK

## 🔍 Benefits

1. **Serverless Backend**: No server to manage, Firebase handles scaling
2. **Simplified Architecture**: Frontend + Firebase Functions only
3. **Cost Effective**: Pay only for what you use
4. **Automatic Scaling**: Firebase Functions scale automatically
5. **Integrated Services**: Firebase Functions work seamlessly with Firebase services

## 🛠️ Development Workflow

### Starting Development
```bash
# Install frontend dependencies
npm install

# Start frontend development server
npm start
```

### Deploying Functions
```bash
# Navigate to firebase directory
cd firebase

# Install function dependencies (if needed)
cd functions && npm install && cd ..

# Deploy functions
firebase deploy --only functions
```

### Production Build
```bash
# Build frontend
npm run build

# Deploy frontend (to your hosting provider)
# Deploy functions
cd firebase && firebase deploy --only functions
```

## 📝 Available Scripts

```json
{
  "scripts": {
    "start": "react-scripts start",        // Frontend development
    "build": "react-scripts build",        // Frontend production build
    "test": "react-scripts test"           // Frontend tests
  }
}
```

## 🎯 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start frontend:**
   ```bash
   npm start
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend: Firebase Functions (deployed to Firebase)

## 🔧 Troubleshooting

### If frontend won't start:
```bash
# Kill existing processes
pkill -f "react-scripts"

# Clear port
lsof -ti:3000 | xargs kill -9

# Restart
npm start
```

### If dependencies are missing:
```bash
# Reinstall frontend dependencies
rm -rf node_modules package-lock.json
npm install

# Reinstall function dependencies
cd firebase/functions
rm -rf node_modules package-lock.json
npm install
```

### If Firebase Functions won't deploy:
```bash
# Check Firebase CLI is installed
firebase --version

# Login to Firebase
firebase login

# Set project
firebase use --add

# Deploy functions
cd firebase
firebase deploy --only functions
```

## 📊 Project Status

- ✅ **Firebase Functions Backend**: Serverless backend deployed
- ✅ **Working Frontend**: React app starts normally
- ✅ **Stripe Integration**: Payment processing via Firebase Functions
- ✅ **Split Payments**: Fixed and working
- ✅ **Payment Calculations**: Fixed and accurate

The project uses a modern serverless architecture with Firebase Functions! 🎉 