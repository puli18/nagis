# Stripe Connect Onboarding Code

Complete code for Stripe Connect account onboarding for Nagi's Ceylon Catering.

## 📁 File Structure

```
project-nagis/
├── firebase/functions/index.js    # Backend: Onboarding functions
└── src/pages/AdminPage.js         # Frontend: Admin panel UI
```

---

## 🔧 Backend: Firebase Functions

### File: `firebase/functions/index.js`

#### 1. Helper Function: Get Frontend Admin URL

```javascript
// Helper to get frontend URL for Stripe Connect redirects
const getFrontendAdminUrl = () => {
  const baseUrl = process.env.FRONTEND_URL || 'https://nagisceylon.com.au';
  if (baseUrl.endsWith('/admin')) {
    return baseUrl;
  }
  return `${baseUrl.replace(/\/$/, '')}/admin`;
};
```

#### 2. Create Stripe Connect Onboarding Link

```javascript
// Create Stripe Connect onboarding link
exports.createStripeOnboardingLink = functions.https.onCall(async (data, context) => {
  try {
    console.log('=== createStripeOnboardingLink called ===');
    
    const stripeInstance = getStripe();
    const adminUrl = getFrontendAdminUrl();

    // Create a new Stripe Connect Express account
    console.log('Creating new Stripe Connect Express account...');
    
    const account = await stripeInstance.accounts.create({
      type: 'express',                    // Express account type (simplest setup)
      country: 'AU',                      // Australia
      email: 'restaurant@nagisceylon.com.au',
      capabilities: {
        card_payments: { requested: true },  // Enable card payments
        transfers: { requested: true },      // Enable transfers
      },
      business_profile: {
        mcc: '5814',                      // Restaurant MCC code
        product_description: 'Sri Lankan restaurant and catering services',
        support_phone: '+61401090451',
        url: 'https://nagisceylon.com.au'
      }
    });

    console.log('✅ Stripe Connect account created:', account.id);

    // Create onboarding link
    const accountLink = await stripeInstance.accountLinks.create({
      account: account.id,
      refresh_url: adminUrl,              // URL to return to if link expires
      return_url: adminUrl,                // URL to return to after completion
      type: 'account_onboarding',          // Onboarding link type
    });

    console.log('✅ Onboarding link created:', accountLink.url);

    // Save account info to Firebase
    const accountRef = getDatabase().ref('stripe/connectedAccount');
    await accountRef.set({
      accountId: account.id,
      status: account.status,
      chargesEnabled: account.charges_enabled || false,
      payoutsEnabled: account.payouts_enabled || false,
      onboardingLink: accountLink.url,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    return {
      success: true,
      accountId: account.id,
      onboardingLink: accountLink.url,
      status: account.status
    };

  } catch (error) {
    console.error('❌ Error creating Stripe onboarding link:', error);
    const errorMessage = getErrorMessage(error);
    throw new functions.https.HttpsError(
      'internal',
      `Failed to create Stripe onboarding link: ${errorMessage}`
    );
  }
});
```

**What this function does:**
1. Creates a new Stripe Connect Express account
2. Generates an onboarding link for the restaurant
3. Saves account information to Firebase Realtime Database
4. Returns the onboarding URL to the frontend

**Account Configuration:**
- **Type**: Express (simplest setup, no OAuth needed)
- **Country**: Australia (AU)
- **Email**: restaurant@nagisceylon.com.au
- **Capabilities**: Card payments and transfers
- **Business Profile**: Restaurant MCC code (5814)

#### 3. Get Stripe Account Status

```javascript
// Get Stripe Connect account status
exports.getStripeAccountStatus = functions.https.onCall(async (data, context) => {
  try {
    console.log('=== getStripeAccountStatus called ===');
    console.log('Input data:', JSON.stringify(data, null, 2));

    const { accountId } = data || {};

    if (!accountId) {
      throw new functions.https.HttpsError('invalid-argument', 'Account ID is required');
    }

    const stripeInstance = getStripe();
    const account = await stripeInstance.accounts.retrieve(accountId);

    console.log('✅ Account status retrieved:', {
      id: account.id,
      status: account.status,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled
    });

    // Update stored status in Firebase
    const accountRef = getDatabase().ref('stripe/connectedAccount');
    await accountRef.update({
      status: account.status,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      updatedAt: Date.now()
    });

    return {
      success: true,
      accountId: account.id,
      status: account.status,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      requirements: account.requirements
    };

  } catch (error) {
    console.error('❌ Error getting Stripe account status:', error);
    throw new functions.https.HttpsError('internal', `Failed to get account status: ${error.message}`);
  }
});
```

**What this function does:**
1. Retrieves current account status from Stripe
2. Updates account information in Firebase
3. Returns account status, capabilities, and requirements

#### 4. Update Connected Account (Manual Update)

```javascript
// Update connected account ID in Firebase
exports.updateConnectedAccount = functions.https.onCall(async (data, context) => {
  try {
    const newAccountId = 'acct_1S50DoJyBQ7hZ0qi';
    
    const accountRef = getDatabase().ref('stripe/connectedAccount');
    await accountRef.set({
      accountId: newAccountId,
      updatedAt: Date.now(),
      status: 'active'
    });

    console.log('Updated connected account ID to:', newAccountId);

    return {
      success: true,
      message: 'Connected account ID updated successfully',
      accountId: newAccountId
    };

  } catch (error) {
    console.error('Error updating connected account:', error);
    throw new functions.https.HttpsError('internal', `Failed to update connected account: ${error.message}`);
  }
});
```

---

## 🎨 Frontend: Admin Panel

### File: `src/pages/AdminPage.js`

#### 1. Create Onboarding Link Function

```javascript
const createStripeOnboardingLink = async () => {
  try {
    setIsConnectingStripe(true);
    
    const functions = getFunctions();
    const createStripeOnboardingLinkFunction = httpsCallable(functions, 'createStripeOnboardingLink');

    const result = await createStripeOnboardingLinkFunction({});

    if (result.data?.success && result.data?.onboardingLink) {
      // Open onboarding link in new tab
      const onboardingWindow = window.open(result.data.onboardingLink, '_blank', 'noopener');
      
      if (!onboardingWindow) {
        alert('Popup was blocked. Please allow popups for this site and click the button again.');
      } else {
        // Update local state with account info
        setStripeAccount({
          accountId: result.data.accountId,
          status: result.data.status,
          onboardingLink: result.data.onboardingLink
        });
        
        alert('Stripe onboarding page opened in a new tab. Please complete the onboarding process. Once done, close that tab and click "Refresh Status" here.');
      }
    } else {
      const errorMessage = result.data?.error || 'Unable to create Stripe onboarding link.';
      alert(`Failed to create Stripe onboarding link: ${errorMessage}`);
    }
  } catch (error) {
    console.error('Error creating Stripe onboarding link:', error);
    alert(`Error: ${error.message}`);
  } finally {
    setIsConnectingStripe(false);
  }
};
```

**What this function does:**
1. Calls Firebase Function to create onboarding link
2. Opens onboarding link in a new browser tab
3. Updates local state with account information
4. Shows user instructions

#### 2. Get Account Status Function

```javascript
const getStripeAccountStatus = async () => {
  try {
    if (!stripeAccount?.accountId) return;
    
    const functions = getFunctions();
    const getStripeAccountStatusFunction = httpsCallable(functions, 'getStripeAccountStatus');
    
    const result = await getStripeAccountStatusFunction({
      accountId: stripeAccount.accountId,
    });
    
    if (result.data.success) {
      setStripeAccount(prev => ({
        ...prev,
        status: result.data.status,
        chargesEnabled: result.data.chargesEnabled,
        payoutsEnabled: result.data.payoutsEnabled
      }));
    }
  } catch (error) {
    console.error('Error getting Stripe account status:', error);
  }
};
```

**What this function does:**
1. Retrieves current account status from Stripe
2. Updates local state with latest account information
3. Shows account capabilities (charges enabled, payouts enabled)

#### 3. Load Stripe Account from Firebase

```javascript
const loadStripeAccount = async () => {
  try {
    const accountRef = ref(realtimeDb, 'stripe/connectedAccount');
    const snapshot = await get(accountRef);
    
    if (snapshot.exists()) {
      const accountData = snapshot.val();
      setStripeAccount(accountData);
    }
  } catch (error) {
    console.error('Error loading Stripe account:', error);
  }
};
```

**What this function does:**
1. Loads stored account information from Firebase
2. Updates local state with account data
3. Used on component mount to show current account status

#### 4. UI Components (Example)

```javascript
// In the Admin Panel UI
<div className="stripe-connect-section">
  <h3>Stripe Connect</h3>
  
  {stripeAccount ? (
    <div>
      <p>Account ID: {stripeAccount.accountId}</p>
      <p>Status: {stripeAccount.status}</p>
      <p>Charges Enabled: {stripeAccount.chargesEnabled ? 'Yes' : 'No'}</p>
      <p>Payouts Enabled: {stripeAccount.payoutsEnabled ? 'Yes' : 'No'}</p>
      
      <button 
        onClick={getStripeAccountStatus}
        disabled={isConnectingStripe}
      >
        Refresh Status
      </button>
    </div>
  ) : (
    <div>
      <p>No Stripe account connected</p>
      <button 
        onClick={createStripeOnboardingLink}
        disabled={isConnectingStripe}
      >
        {isConnectingStripe ? 'Creating...' : 'Start Stripe Onboarding'}
      </button>
    </div>
  )}
</div>
```

---

## 📊 Data Flow

### Onboarding Flow

1. **User clicks "Start Stripe Onboarding"** in Admin Panel
2. **Frontend calls** `createStripeOnboardingLink` Firebase Function
3. **Backend creates** new Stripe Connect Express account
4. **Backend generates** onboarding link
5. **Backend saves** account info to Firebase
6. **Frontend receives** onboarding URL
7. **Frontend opens** onboarding link in new tab
8. **User completes** Stripe onboarding form
9. **User returns** to Admin Panel
10. **User clicks** "Refresh Status"
11. **Frontend calls** `getStripeAccountStatus` Firebase Function
12. **Backend retrieves** latest account status from Stripe
13. **Backend updates** Firebase with latest status
14. **Frontend displays** updated account status

### Account Status Flow

```
Pending → Restricted → Active
   ↓          ↓          ↓
Created    Onboarding  Ready to
          In Progress  Accept Payments
```

---

## 💾 Firebase Data Structure

### Path: `/stripe/connectedAccount`

```json
{
  "accountId": "acct_1S50DoJyBQ7hZ0qi",
  "status": "active",
  "chargesEnabled": true,
  "payoutsEnabled": true,
  "onboardingLink": "https://connect.stripe.com/setup/...",
  "createdAt": 1234567890,
  "updatedAt": 1234567890
}
```

**Fields:**
- `accountId`: Stripe Connect account ID (starts with `acct_`)
- `status`: Account status (`pending`, `restricted`, `active`)
- `chargesEnabled`: Whether account can accept payments
- `payoutsEnabled`: Whether account can receive payouts
- `onboardingLink`: URL for onboarding (if still pending)
- `createdAt`: Timestamp when account was created
- `updatedAt`: Timestamp when account was last updated

---

## 🔧 Configuration

### Environment Variables

**Firebase Functions:**
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `FRONTEND_URL`: Frontend URL for redirects (optional, defaults to `https://nagisceylon.com.au`)

### Account Settings

**Hardcoded in `createStripeOnboardingLink`:**
- Email: `restaurant@nagisceylon.com.au`
- Country: `AU` (Australia)
- MCC Code: `5814` (Restaurant)
- Support Phone: `+61401090451`
- Website: `https://nagisceylon.com.au`

**To customize:** Edit the `account.create()` call in `createStripeOnboardingLink` function.

---

## 🧪 Testing

### Test Onboarding Flow

1. **Start onboarding:**
   - Go to Admin Panel
   - Click "Start Stripe Onboarding"
   - Verify new tab opens with Stripe onboarding page

2. **Complete onboarding:**
   - Fill in test business information
   - Use Stripe test mode data
   - Complete all required fields
   - Submit the form

3. **Verify account:**
   - Return to Admin Panel
   - Click "Refresh Status"
   - Verify account status shows as "active"
   - Verify chargesEnabled and payoutsEnabled are true

### Test Account Status

1. **Check status:**
   - Click "Refresh Status"
   - Verify status updates correctly
   - Check that Firebase is updated

2. **Verify capabilities:**
   - Check chargesEnabled is true
   - Check payoutsEnabled is true
   - Account should be ready for payments

---

## 📝 Key Points

### ✅ Benefits

1. **Simple Setup**: No OAuth configuration needed
2. **One-Click Creation**: Account created automatically
3. **Automatic Linking**: Account linked to Firebase automatically
4. **Status Tracking**: Real-time status updates
5. **Error Handling**: Comprehensive error handling

### ⚠️ Important Notes

1. **Account Creation**: Each call creates a NEW account (be careful in production)
2. **Onboarding Link**: Links expire after 24 hours
3. **Account Status**: Must be "active" to accept payments
4. **Capabilities**: Both charges and payouts must be enabled
5. **Email**: Account email can be changed during onboarding

### 🔒 Security

- Account ID is public (not a secret)
- Secret keys are stored in environment variables
- Webhook secrets are stored securely
- No sensitive data exposed in frontend

---

## 🚀 Usage Example

```javascript
// In Admin Panel component
import { getFunctions, httpsCallable } from 'firebase/functions';

// Create onboarding link
const handleStartOnboarding = async () => {
  const functions = getFunctions();
  const createOnboardingLink = httpsCallable(functions, 'createStripeOnboardingLink');
  
  const result = await createOnboardingLink({});
  
  if (result.data.success) {
    window.open(result.data.onboardingLink, '_blank');
  }
};

// Get account status
const handleRefreshStatus = async (accountId) => {
  const functions = getFunctions();
  const getStatus = httpsCallable(functions, 'getStripeAccountStatus');
  
  const result = await getStatus({ accountId });
  
  console.log('Account Status:', result.data.status);
  console.log('Charges Enabled:', result.data.chargesEnabled);
  console.log('Payouts Enabled:', result.data.payoutsEnabled);
};
```

---

This is the complete Stripe Connect onboarding code! 🎉






