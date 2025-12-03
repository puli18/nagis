# Firebase Functions Backend Setup

This guide explains how to set up and deploy Firebase Functions to replace the Node.js backend server.

## 🏗️ Architecture Overview

### Before (Node.js Server)
```
Frontend → Node.js/Express Server → Stripe API
         ↓
    Firebase Database
```

### After (Firebase Functions)
```
Frontend → Firebase Functions → Stripe API
         ↓
    Firebase Database
```

## ✅ Benefits of Firebase Functions

1. **Serverless**: No server management required
2. **Scalable**: Automatically scales with traffic
3. **Integrated**: Native Firebase integration
4. **Cost-effective**: Pay only for what you use
5. **Global**: Deployed to multiple regions
6. **Secure**: Built-in authentication and security

## 🚀 Setup Steps

### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Login to Firebase

```bash
firebase login
```

### 3. Initialize Firebase Functions

```bash
cd project-nagis/firebase
firebase init functions
```

### 4. Install Dependencies

```bash
cd functions
npm install
```

### 5. Set Firebase Functions Configuration

```bash
firebase functions:config:set stripe.secret_key="sk_test_your_stripe_secret_key"
firebase functions:config:set stripe.webhook_secret="whsec_your_webhook_secret"
firebase functions:config:set stripe.restaurant_account_id="acct_1Rs1aZFXqfiVGWTW"
```

### 6. Deploy Functions

```bash
firebase deploy --only functions
```

## 📁 Project Structure

```
project-nagis/
├── firebase/
│   ├── functions/
│   │   ├── index.js          # Firebase Functions code
│   │   ├── package.json      # Dependencies
│   │   └── node_modules/     # Installed packages
│   ├── firebase.json         # Firebase configuration
│   ├── database.rules.json   # Database security rules
│   └── storage.rules         # Storage security rules
├── src/
│   ├── services/
│   │   └── firebaseFunctions.js  # Frontend service
│   └── pages/
│       └── CheckoutPage.js   # Updated to use Firebase Functions
└── .env.local               # Environment variables
```

## 🔧 Firebase Functions

### 1. createPaymentIntent
- Creates Stripe payment intents
- Handles split payments and fallbacks
- Returns client secret for frontend

### 2. confirmPayment
- Confirms successful payments
- Creates orders in Firebase Database
- Sends notifications

### 3. stripeWebhook
- Handles Stripe webhook events
- Processes payment success/failure
- Creates manual transfers when needed

## 🌐 Frontend Integration

### Updated CheckoutPage.js
```javascript
import { createPaymentIntent, confirmPayment } from '../services/firebaseFunctions';

// Instead of fetch to localhost:3001
const responseData = await createPaymentIntent(
  { subtotal: subtotal },
  items,
  customerInfo
);
```

### Firebase Functions Service
```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

export const createPaymentIntent = async (amount, items, customerInfo) => {
  const createPaymentIntentFunction = httpsCallable(functions, 'createPaymentIntent');
  const result = await createPaymentIntentFunction({ amount, items, customerInfo });
  return result.data;
};
```

## 🔐 Security Configuration

### Database Rules (database.rules.json)
```json
{
  "rules": {
    "orders": {
      ".read": "auth != null || true",
      ".write": "auth != null || true"
    },
    "menuItems": {
      ".read": true,
      ".write": "auth != null"
    }
  }
}
```

### Storage Rules (storage.rules)
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 🚀 Deployment Commands

### Deploy Functions Only
```bash
firebase deploy --only functions
```

### Deploy Everything
```bash
firebase deploy
```

### Deploy Database Rules
```bash
firebase deploy --only database
```

### Deploy Storage Rules
```bash
firebase deploy --only storage
```

## 📊 Monitoring

### View Function Logs
```bash
firebase functions:log
```

### Monitor in Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to Functions
4. View logs, metrics, and performance

## 🔧 Environment Variables

### Firebase Functions Config
```bash
# Set Stripe configuration
firebase functions:config:set stripe.secret_key="sk_test_..."
firebase functions:config:set stripe.webhook_secret="whsec_..."
firebase functions:config:set stripe.restaurant_account_id="acct_..."

# View current config
firebase functions:config:get
```

### Frontend Environment (.env.local)
```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.asia-southeast1.firebasedatabase.app
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 🧪 Testing

### Local Development
```bash
# Start Firebase emulators
firebase emulators:start

# Test functions locally
firebase functions:shell
```

### Test Payment Flow
1. Start the React app: `npm start`
2. Navigate to checkout
3. Use test card: `4242 4242 4242 4242`
4. Complete payment
5. Check Firebase Database for order

## 📈 Performance

### Cold Start Optimization
- Functions are optimized for quick startup
- Consider using Firebase Hosting for static files
- Use Firebase CDN for global distribution

### Cost Optimization
- Monitor function execution time
- Use appropriate memory allocation
- Consider function warm-up strategies

## 🔄 Migration from Node.js

### 1. Update Frontend
- Replace fetch calls with Firebase Functions
- Update error handling
- Test payment flow

### 2. Deploy Functions
- Deploy to Firebase
- Configure environment variables
- Test webhook endpoints

### 3. Update Webhooks
- Point Stripe webhooks to Firebase Functions
- Test webhook processing
- Monitor order creation

### 4. Remove Node.js Server
- Stop the Node.js server
- Remove server dependencies
- Update documentation

## 🎯 Benefits Achieved

### ✅ Scalability
- Automatic scaling with traffic
- No server management required
- Global deployment

### ✅ Cost Efficiency
- Pay only for function executions
- No idle server costs
- Free tier available

### ✅ Integration
- Native Firebase Database access
- Built-in authentication
- Real-time capabilities

### ✅ Security
- Firebase security rules
- Automatic HTTPS
- Built-in authentication

## 🚀 Next Steps

1. **Deploy Functions**: Follow the deployment guide
2. **Test Payment Flow**: Verify orders are created
3. **Monitor Performance**: Check Firebase Console
4. **Update Documentation**: Remove Node.js references
5. **Scale as Needed**: Monitor usage and costs

Your backend is now fully serverless and integrated with Firebase! 🎉





