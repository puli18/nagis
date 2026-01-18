# All Firebase Functions Code

Complete code for all Firebase Functions in the Nagi's Ceylon Catering project.

## 📁 File Location

`firebase/functions/index.js`

---

## 🔧 Helper Functions

### 1. Stripe Initialization

```javascript
const getStripe = () => {
  if (!stripe) {
    let stripeSecretKey;
    
    try {
      // Try environment variable first
      stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      
      if (!stripeSecretKey) {
        throw new Error('STRIPE_SECRET_KEY environment variable is not set. Please configure it in Firebase Functions environment variables.');
      }
      
      console.log('Stripe secret key found:', stripeSecretKey ? 'SET' : 'MISSING');
      stripe = require('stripe')(stripeSecretKey);
    } catch (error) {
      console.error('Error getting Stripe config:', error);
      throw new Error('Stripe configuration not available');
    }
  }
  return stripe;
};
```

### 2. Database Initialization

```javascript
const getDatabase = () => {
  if (!db) {
    db = admin.database();
  }
  return db;
};
```

### 3. Frontend Admin URL Helper

```javascript
const getFrontendAdminUrl = () => {
  const baseUrl = process.env.FRONTEND_URL || 'https://nagisceylon.com.au';
  if (baseUrl.endsWith('/admin')) {
    return baseUrl;
  }
  return `${baseUrl.replace(/\/$/, '')}/admin`;
};
```

### 4. Compute Account Status (Stripe Express)

```javascript
// Helper to compute account status from Stripe Express account
// IMPORTANT: Stripe Express accounts do NOT have a 'status' field
// We must compute it from charges_enabled, payouts_enabled, and details_submitted
const computeAccountStatus = (account) => {
  // Active: Both charges and payouts are enabled
  if (account.charges_enabled && account.payouts_enabled) {
    return 'active';
  }
  // Submitted: Details submitted but not yet fully enabled
  if (account.details_submitted) {
    return 'submitted';
  }
  // Pending: Account created but onboarding not started/completed
  return 'pending';
};
```

### 5. Error Message Helper

```javascript
const getErrorMessage = (error) => {
  try {
    if (typeof error === 'string') {
      return error;
    }
    if (error && error.message) {
      return error.message;
    }
    if (error && error.type && error.code) {
      return `${error.type}: ${error.code}`;
    }
    if (error && error.type) {
      return error.type;
    }
    return 'Unknown error';
  } catch (e) {
    return 'Error occurred (unable to extract message)';
  }
};
```

---

## 💳 Payment Functions

### 1. Test Stripe Connection

```javascript
exports.testStripeConnection = functions.https.onCall(async (data, context) => {
  try {
    console.log('=== testStripeConnection called ===');
    console.log('Stripe secret key:', process.env.STRIPE_SECRET_KEY ? 'SET' : 'MISSING');
    
    // Test basic Stripe connection
    const stripeInstance = getStripe();
    const testPaymentIntent = await stripeInstance.paymentIntents.create({
      amount: 100, // $1.00
      currency: 'aud',
      description: 'Test connection'
    });
    
    console.log('✅ Stripe connection successful:', testPaymentIntent.id);
    
    // Cancel the test payment intent
    await stripeInstance.paymentIntents.cancel(testPaymentIntent.id);
    
    return { 
      success: true, 
      message: 'Stripe connection working',
      paymentIntentId: testPaymentIntent.id
    };
  } catch (error) {
    console.error('❌ Stripe connection test failed:', error);
    return { 
      success: false, 
      error: error.message,
      type: error.type,
      code: error.code
    };
  }
});
```

**Purpose:** Test if Stripe API connection is working  
**Type:** Callable function  
**Returns:** Success status and test payment intent ID

---

### 2. Create Payment Intent

```javascript
exports.createPaymentIntent = functions.https.onCall(async (data, context) => {
  try {
    console.log('=== createPaymentIntent called ===');
    
    // Handle Firebase Functions v2 data structure
    const requestData = data.data || data;
    const { amount, items, customerInfo } = requestData;
    
    // Validate input
    if (!amount || !items || !customerInfo) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    // Calculate amounts
    const subtotal = parseFloat(amount.subtotal);
    const serviceFee = Math.min(subtotal * 0.05, 3); // 5% capped at $3
    const total = subtotal + serviceFee;
    
    // Validate amounts
    if (total <= 0 || subtotal <= 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid amount');
    }

    // Connected account ID (restaurant's Stripe account)
    const restaurantAccountId = 'acct_1S50DoJyBQ7hZ0qi';
    
    // Determine payment method types
    const paymentMethod = customerInfo.paymentMethod || 'card';
    const paymentMethodTypes = [];
    
    switch (paymentMethod) {
      case 'apple_pay':
      case 'google_pay':
        // Apple Pay and Google Pay work through 'card' type
        paymentMethodTypes.push('card');
        break;
      case 'afterpay':
        paymentMethodTypes.push('card', 'afterpay_clearpay');
        break;
      default:
        paymentMethodTypes.push('card');
    }
    
    // Create destination charge payment intent
    const paymentIntentData = {
      amount: Math.round(total * 100), // Convert to cents
      currency: 'aud',
      payment_method_types: paymentMethodTypes,
      // Destination charge: payment goes to connected account, platform gets application fee
      application_fee_amount: Math.round(serviceFee * 100), // Platform service fee
      transfer_data: {
        destination: restaurantAccountId, // Payment goes directly to restaurant
      },
      metadata: {
        subtotal: subtotal.toFixed(2),
        serviceFee: serviceFee.toFixed(2),
        itemCount: items.length.toString(),
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone || '',
        customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
        orderType: customerInfo.orderType || 'pickup',
        splitPayment: 'true',
        chargeType: 'destination_charge',
        restaurantAccountId: restaurantAccountId,
        platformFee: serviceFee.toFixed(2),
        restaurantAmount: subtotal.toFixed(2),
        paymentMethod: paymentMethod
      },
      receipt_email: customerInfo.email,
      description: `Nagi's Ceylon Order - ${items.length} items`
    };
    
    // Add AfterPay specific configuration
    if (paymentMethod === 'afterpay') {
      paymentIntentData.payment_method_options = {
        afterpay_clearpay: {
          reference: `order_${Date.now()}`,
          line_items: items.map(item => ({
            amount: Math.round(item.price * 100),
            currency: 'aud',
            name: item.name,
            quantity: item.quantity
          }))
        }
      };
    }
    
    // Create payment intent
    const paymentIntent = await getStripe().paymentIntents.create(paymentIntentData);

    console.log('✅ Destination charge payment intent created successfully:', paymentIntent.id);

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: {
        subtotal: subtotal,
        serviceFee: serviceFee,
        total: total
      },
      splitPayment: true,
      chargeType: 'destination_charge',
      platformFee: serviceFee,
      restaurantAmount: subtotal,
      paymentMethod: paymentMethod
    };

  } catch (error) {
    console.error('❌ Payment intent creation error:', error);
    throw new functions.https.HttpsError('internal', 'Payment setup failed');
  }
});
```

**Purpose:** Create Stripe payment intent with split payment (destination charge)  
**Type:** Callable function  
**Input:** `{ amount: { subtotal }, items: [], customerInfo: {} }`  
**Returns:** `{ clientSecret, paymentIntentId, amount, splitPayment, ... }`

---

### 3. Confirm Payment

```javascript
exports.confirmPayment = functions.https.onCall(async (data, context) => {
  try {
    const requestData = data.data || data;
    const { paymentIntentId, orderData } = requestData;
    
    if (!paymentIntentId || !orderData) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    console.log('=== confirmPayment called ===');
    console.log('Payment Intent ID:', paymentIntentId);

    // Verify payment intent
    const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      // Check if order already exists
      const ordersRef = getDatabase().ref('orders');
      const existingOrders = await ordersRef.orderByChild('paymentIntentId').equalTo(paymentIntentId).once('value');
      
      if (existingOrders.exists()) {
        console.log('✅ Order already exists for payment:', paymentIntentId);
        const firstKey = Object.keys(existingOrders.val())[0];
        return { 
          success: true, 
          orderId: firstKey,
          paymentIntentId: paymentIntentId
        };
      }
      
      // Create order in Firebase
      const order = await createOrder({
        paymentIntentId,
        amount: orderData.amount,
        items: orderData.items,
        customerInfo: orderData.customerInfo,
        status: 'pending',
        subtotal: orderData.subtotal,
        serviceFee: orderData.serviceFee
      });
      
      // Update order status to confirmed since payment succeeded
      const orderRef = getDatabase().ref(`orders/${order.id}`);
      await orderRef.update({
        status: 'confirmed',
        updatedAt: new Date().toISOString()
      });
      
      console.log('✅ Order created successfully:', order.id);
      
      return { 
        success: true, 
        orderId: order.id,
        paymentIntentId: paymentIntentId
      };
    } else {
      throw new functions.https.HttpsError('failed-precondition', 'Payment not completed');
    }
  } catch (error) {
    console.error('❌ Payment confirmation error:', error);
    throw new functions.https.HttpsError('internal', 'Payment confirmation failed');
  }
});
```

**Purpose:** Confirm payment succeeded and create order in Firebase  
**Type:** Callable function  
**Input:** `{ paymentIntentId, orderData }`  
**Returns:** `{ success: true, orderId, paymentIntentId }`

---

## 🔗 Stripe Connect Functions

### 1. Create Stripe Onboarding Link

```javascript
exports.createStripeOnboardingLink = functions.https.onCall(async (data, context) => {
  try {
    console.log('=== createStripeOnboardingLink called ===');
    
    const stripeInstance = getStripe();
    const adminUrl = getFrontendAdminUrl();
    
    // Check if account already exists in Firebase
    const accountRef = getDatabase().ref('stripe/connectedAccount');
    const existingAccountSnapshot = await accountRef.once('value');
    const existingAccount = existingAccountSnapshot.val();
    
    let account;
    let isNewAccount = false;
    
    if (existingAccount && existingAccount.accountId) {
      // Account already exists - retrieve it and create onboarding/update link
      console.log('Existing account found:', existingAccount.accountId);
      try {
        account = await stripeInstance.accounts.retrieve(existingAccount.accountId);
        console.log('✅ Retrieved existing Stripe account:', account.id);
      } catch (retrieveError) {
        // Account might not exist in Stripe anymore, create new one
        console.log('⚠️ Existing account not found in Stripe, creating new account...');
        account = null;
      }
    }
    
    // Create new account if none exists
    if (!account) {
      isNewAccount = true;
      console.log('Creating new Stripe Connect Express account...');
      
      // Get optional email from request data, otherwise let Stripe collect it
      const { ownerEmail } = data || {};
      
      // Create account with minimal required fields
      account = await stripeInstance.accounts.create({
        type: 'express',
        country: 'AU',
        ...(ownerEmail && { email: ownerEmail }),
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      console.log('✅ Stripe Connect account created:', account.id);
    }

    // Determine link type based on account status
    const linkType = (account.charges_enabled && account.payouts_enabled) 
      ? 'account_update' 
      : 'account_onboarding';

    // Create onboarding/update link
    const accountLink = await stripeInstance.accountLinks.create({
      account: account.id,
      refresh_url: adminUrl,
      return_url: adminUrl,
      type: linkType,
    });

    console.log(`✅ ${linkType} link created:`, accountLink.url);

    // Compute account status from actual Stripe fields
    const accountStatus = computeAccountStatus(account);

    // Save/update account info in Firebase
    await accountRef.set({
      accountId: account.id,
      status: accountStatus,
      chargesEnabled: account.charges_enabled || false,
      payoutsEnabled: account.payouts_enabled || false,
      onboardingLink: accountLink.url,
      requirements: account.requirements || null,
      createdAt: existingAccount?.createdAt || Date.now(),
      updatedAt: Date.now()
    });

    return {
      success: true,
      accountId: account.id,
      onboardingLink: accountLink.url,
      status: accountStatus,
      isNewAccount: isNewAccount,
      linkType: linkType
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

**Purpose:** Create Stripe Connect account and generate onboarding link  
**Type:** Callable function  
**Input:** `{ ownerEmail? }` (optional)  
**Returns:** `{ success, accountId, onboardingLink, status, isNewAccount, linkType }`

---

### 2. Get Stripe Account Status

```javascript
exports.getStripeAccountStatus = functions.https.onCall(async (data, context) => {
  try {
    console.log('=== getStripeAccountStatus called ===');

    const { accountId } = data || {};

    if (!accountId) {
      throw new functions.https.HttpsError('invalid-argument', 'Account ID is required');
    }

    const stripeInstance = getStripe();
    const account = await stripeInstance.accounts.retrieve(accountId);

    // Compute account status from actual Stripe fields
    const accountStatus = computeAccountStatus(account);

    console.log('✅ Account status retrieved:', {
      id: account.id,
      status: accountStatus,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted
    });

    // Update stored status in Firebase
    const accountRef = getDatabase().ref('stripe/connectedAccount');
    await accountRef.update({
      status: accountStatus,
      chargesEnabled: account.charges_enabled || false,
      payoutsEnabled: account.payouts_enabled || false,
      requirements: account.requirements || null,
      updatedAt: Date.now()
    });

    return {
      success: true,
      accountId: account.id,
      status: accountStatus,
      chargesEnabled: account.charges_enabled || false,
      payoutsEnabled: account.payouts_enabled || false,
      requirements: account.requirements || null
    };

  } catch (error) {
    console.error('❌ Error getting Stripe account status:', error);
    throw new functions.https.HttpsError('internal', `Failed to get account status: ${error.message}`);
  }
});
```

**Purpose:** Get current status of Stripe Connect account  
**Type:** Callable function  
**Input:** `{ accountId }`  
**Returns:** `{ success, accountId, status, chargesEnabled, payoutsEnabled, requirements }`

---

### 3. Create Existing Account Onboarding Link

```javascript
exports.createExistingAccountOnboardingLink = functions.https.onCall(async (data, context) => {
  try {
    console.log('=== createExistingAccountOnboardingLink called ===');
    
    const { accountId } = data || {};
    
    if (!accountId) {
      throw new functions.https.HttpsError('invalid-argument', 'Account ID is required');
    }
    
    const stripeInstance = getStripe();
    const adminUrl = getFrontendAdminUrl();
    
    // Verify account exists and retrieve it
    const account = await stripeInstance.accounts.retrieve(accountId);
    console.log('✅ Retrieved existing Stripe account:', account.id);
    
    // Compute account status from actual Stripe fields
    const accountStatus = computeAccountStatus(account);
    
    // Determine link type based on account status
    const linkType = (account.charges_enabled && account.payouts_enabled) 
      ? 'account_update' 
      : 'account_onboarding';
    
    // Create onboarding/update link
    const accountLink = await stripeInstance.accountLinks.create({
      account: account.id,
      refresh_url: adminUrl,
      return_url: adminUrl,
      type: linkType,
    });
    
    console.log(`✅ ${linkType} link created:`, accountLink.url);
    
    // Save/update account info in Firebase
    const accountRef = getDatabase().ref('stripe/connectedAccount');
    await accountRef.set({
      accountId: account.id,
      status: accountStatus,
      chargesEnabled: account.charges_enabled || false,
      payoutsEnabled: account.payouts_enabled || false,
      onboardingLink: accountLink.url,
      requirements: account.requirements || null,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    
    return {
      success: true,
      accountId: account.id,
      onboardingLink: accountLink.url,
      status: accountStatus,
      linkType: linkType
    };
    
  } catch (error) {
    console.error('❌ Error creating onboarding link for existing account:', error);
    throw new functions.https.HttpsError('internal', `Failed to create onboarding link: ${error.message}`);
  }
});
```

**Purpose:** Create onboarding link for existing Stripe Express account  
**Type:** Callable function  
**Input:** `{ accountId }`  
**Returns:** `{ success, accountId, onboardingLink, status, linkType }`

---

### 4. Update Connected Account

```javascript
exports.updateConnectedAccount = functions.https.onCall(async (data, context) => {
  try {
    const { accountId } = data || {};
    
    if (!accountId) {
      throw new functions.https.HttpsError('invalid-argument', 'Account ID is required');
    }
    
    // Verify account exists in Stripe
    const stripeInstance = getStripe();
    const account = await stripeInstance.accounts.retrieve(accountId);
    
    // Compute account status from actual Stripe fields
    const accountStatus = computeAccountStatus(account);
    
    const accountRef = getDatabase().ref('stripe/connectedAccount');
    await accountRef.set({
      accountId: account.id,
      status: accountStatus,
      chargesEnabled: account.charges_enabled || false,
      payoutsEnabled: account.payouts_enabled || false,
      requirements: account.requirements || null,
      updatedAt: Date.now()
    });

    console.log('Updated connected account ID to:', account.id);

    return {
      success: true,
      message: 'Connected account ID updated successfully',
      accountId: account.id,
      status: accountStatus
    };

  } catch (error) {
    console.error('Error updating connected account:', error);
    throw new functions.https.HttpsError('internal', `Failed to update connected account: ${error.message}`);
  }
});
```

**Purpose:** Update connected account ID in Firebase (legacy function)  
**Type:** Callable function  
**Input:** `{ accountId }`  
**Returns:** `{ success, message, accountId, status }`

---

## 📦 Helper Functions (Internal)

### 1. Create Order

```javascript
async function createOrder(orderData) {
  try {
    console.log('Creating order in Firebase:', orderData.paymentIntentId);
    
    const order = {
      paymentIntentId: orderData.paymentIntentId,
      amount: orderData.amount,
      subtotal: orderData.subtotal,
      serviceFee: orderData.serviceFee,
      status: 'pending',
      customerInfo: {
        name: `${orderData.customerInfo.firstName} ${orderData.customerInfo.lastName}`,
        email: orderData.customerInfo.email,
        phone: orderData.customerInfo.phone,
        address: orderData.customerInfo.address || '',
        orderType: orderData.customerInfo.orderType || 'pickup'
      },
      items: orderData.items,
      timestamp: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statusHistory: [
        {
          status: 'pending',
          timestamp: Date.now(),
          note: 'Order created'
        }
      ]
    };
    
    // Save to Firebase Realtime Database
    const ordersRef = getDatabase().ref('orders');
    const newOrderRef = ordersRef.push();
    await newOrderRef.set(order);
    
    console.log('✅ Order created successfully in Firebase:', newOrderRef.key);
    
    return {
      id: newOrderRef.key,
      ...order
    };
    
  } catch (error) {
    console.error('❌ Error creating order in Firebase:', error);
    throw error;
  }
}
```

**Purpose:** Internal helper to create orders in Firebase  
**Type:** Internal async function  
**Input:** `orderData` object  
**Returns:** Order object with ID

---

## 🔔 Webhook Functions

### 1. Stripe Webhook Handler

```javascript
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      // Get webhook secret from environment
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        console.error('STRIPE_WEBHOOK_SECRET environment variable is not set');
        return res.status(400).send('Webhook secret not configured');
      }
      
      // IMPORTANT: Firebase Functions needs raw body for Stripe signature verification
      const rawBody = req.rawBody || (Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body)));
      
      event = getStripe().webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log('Processing webhook event:', event.type);

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

**Purpose:** Handle Stripe webhook events  
**Type:** HTTP request function  
**Events Handled:** `payment_intent.succeeded`, `payment_intent.payment_failed`

---

### 2. Handle Payment Success

```javascript
async function handlePaymentSuccess(paymentIntent) {
  try {
    console.log('=== Payment succeeded (Destination Charge) ===');
    console.log('Payment Intent ID:', paymentIntent.id);
    
    // With destination charges, Stripe automatically:
    // 1. Transfers payment to connected account
    // 2. Collects application fee for platform
    // 3. Manages negative balance liabilities
    
    if (paymentIntent.metadata?.chargeType === 'direct_charge') {
      console.log('✅ Destination charge processed automatically');
      console.log('- Payment transferred to restaurant account:', paymentIntent.transfer_data?.destination);
      console.log('- Application fee collected for platform:', paymentIntent.application_fee_amount);
    }
    
    // CRITICAL: Create or update order from webhook
    // This ensures orders are created even if frontend fails to call confirmPayment
    try {
      const ordersRef = getDatabase().ref('orders');
      const existingOrders = await ordersRef.orderByChild('paymentIntentId').equalTo(paymentIntent.id).once('value');
      
      if (existingOrders.exists()) {
        // Order already exists, just update status
        const firstKey = Object.keys(existingOrders.val())[0];
        const orderRef = getDatabase().ref(`orders/${firstKey}`);
        await orderRef.update({
          status: 'confirmed',
          updatedAt: new Date().toISOString()
        });
        console.log('✅ Order updated from webhook:', firstKey);
      } else {
        // Order doesn't exist, create it from webhook
        const orderData = {
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          subtotal: parseFloat(paymentIntent.metadata.subtotal || '0'),
          serviceFee: parseFloat(paymentIntent.metadata.serviceFee || '0'),
          customerInfo: {
            firstName: paymentIntent.metadata.customerName?.split(' ')[0] || 'Customer',
            lastName: paymentIntent.metadata.customerName?.split(' ').slice(1).join(' ') || '',
            email: paymentIntent.metadata.customerEmail || '',
            phone: paymentIntent.metadata.customerPhone || '',
            address: '',
            orderType: paymentIntent.metadata.orderType || 'pickup'
          },
          items: paymentIntent.metadata.orderItems ? JSON.parse(paymentIntent.metadata.orderItems) : [],
          status: 'confirmed'
        };
        
        const order = await createOrder(orderData);
        
        // Update to confirmed status
        const orderRef = getDatabase().ref(`orders/${order.id}`);
        await orderRef.update({
          status: 'confirmed',
          updatedAt: new Date().toISOString()
        });
        
        console.log('✅ Order created from webhook:', order.id);
      }
    } catch (orderError) {
      console.error('❌ Error creating/updating order from webhook:', orderError);
      // Don't throw - webhook should still return success to Stripe
    }
    
  } catch (error) {
    console.error('❌ Error handling payment success:', error);
  }
}
```

**Purpose:** Handle successful payment webhook events  
**Type:** Internal async function  
**Actions:** Creates/updates orders in Firebase

---

### 3. Handle Payment Failure

```javascript
async function handlePaymentFailure(paymentIntent) {
  try {
    console.log('=== Payment failed ===');
    console.log('Payment Intent ID:', paymentIntent.id);
    console.log('Failure reason:', paymentIntent.last_payment_error);
    
    // Log the failure for monitoring
    const failureRef = getDatabase().ref('paymentFailures').push();
    await failureRef.set({
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      failureReason: paymentIntent.last_payment_error?.message || 'Unknown',
      timestamp: Date.now(),
      metadata: paymentIntent.metadata
    });
    
  } catch (error) {
    console.error('❌ Error handling payment failure:', error);
  }
}
```

**Purpose:** Handle failed payment webhook events  
**Type:** Internal async function  
**Actions:** Logs payment failures to Firebase

---

## 📊 Function Summary

### Callable Functions (Frontend → Backend)

| Function | Purpose | Input | Returns |
|----------|---------|-------|---------|
| `testStripeConnection` | Test Stripe API connection | `{}` | `{ success, message, paymentIntentId? }` |
| `createPaymentIntent` | Create payment intent with split payment | `{ amount, items, customerInfo }` | `{ clientSecret, paymentIntentId, amount, ... }` |
| `confirmPayment` | Confirm payment and create order | `{ paymentIntentId, orderData }` | `{ success, orderId, paymentIntentId }` |
| `createStripeOnboardingLink` | Create Stripe Connect account and onboarding link | `{ ownerEmail? }` | `{ success, accountId, onboardingLink, status, ... }` |
| `getStripeAccountStatus` | Get Stripe Connect account status | `{ accountId }` | `{ success, accountId, status, chargesEnabled, ... }` |
| `createExistingAccountOnboardingLink` | Create onboarding link for existing account | `{ accountId }` | `{ success, accountId, onboardingLink, status, ... }` |
| `updateConnectedAccount` | Update connected account ID in Firebase | `{ accountId }` | `{ success, message, accountId, status }` |

### HTTP Request Functions (Webhooks)

| Function | Purpose | Method | Events |
|----------|---------|--------|--------|
| `stripeWebhook` | Handle Stripe webhook events | POST | `payment_intent.succeeded`, `payment_intent.payment_failed` |

### Internal Helper Functions

| Function | Purpose |
|----------|---------|
| `getStripe()` | Initialize and return Stripe instance |
| `getDatabase()` | Initialize and return Firebase Database instance |
| `getFrontendAdminUrl()` | Get admin panel URL for redirects |
| `computeAccountStatus(account)` | Compute account status from Stripe fields |
| `getErrorMessage(error)` | Safely extract error message |
| `createOrder(orderData)` | Create order in Firebase Database |
| `handlePaymentSuccess(paymentIntent)` | Handle successful payment webhook |
| `handlePaymentFailure(paymentIntent)` | Handle failed payment webhook |

---

## 🔐 Environment Variables Required

```env
STRIPE_SECRET_KEY=sk_test_... or sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=https://nagisceylon.com.au (optional)
```

---

## 📝 Key Configuration

- **Restaurant Account ID**: `acct_1S50DoJyBQ7hZ0qi` (hardcoded, should be moved to environment variable)
- **Service Fee**: 5% of subtotal, capped at $3.00
- **Currency**: AUD (Australian Dollars)
- **Account Type**: Express (Stripe Connect)

---

This is the complete Firebase Functions codebase! 🎉






