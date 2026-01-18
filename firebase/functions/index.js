const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Stripe client
// Note: Firebase Functions v2 does NOT support functions.config()
// We must use environment variables instead
let stripe = null;
const getStripe = () => {
  if (!stripe) {
    // For Firebase Functions v2, use environment variable
    let stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    
    // Stripe secret key must be set as environment variable
    // Set it using: firebase functions:secrets:set STRIPE_SECRET_KEY
    
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set. For Firebase Functions v2, you need to set it as an environment variable in the function configuration.');
    }
    
    console.log('✅ Stripe secret key found, initializing client...');
    stripe = require('stripe')(stripeSecretKey);
    console.log('✅ Stripe client initialized successfully');
  }
  return stripe;
};

// Get database reference
const getDatabase = () => admin.database();

// Generate sequential order number
const generateOrderNumber = async () => {
  try {
    const db = getDatabase();
    const counterRef = db.ref('orderCounter');
    const counterSnapshot = await counterRef.once('value');
    
    let currentNumber = 1;
    if (counterSnapshot.exists()) {
      currentNumber = counterSnapshot.val() + 1;
    }
    
    // Update the counter
    await counterRef.set(currentNumber);
    
    // Format the order number - use 3 digits for 1-999, then 4+ digits for 1000+
    const orderNumber = currentNumber <= 999 
      ? `#${currentNumber.toString().padStart(3, '0')}`  // #001 to #999
      : `#${currentNumber}`;  // #1000, #1001, etc.
    
    console.log('Generated order number:', orderNumber);
    return orderNumber;
  } catch (error) {
    console.error('Error generating order number:', error);
    // Fallback to timestamp-based number if counter fails
    const timestamp = Date.now();
    const fallbackNumber = `#${timestamp.toString().slice(-6)}`;
    console.log('Using fallback order number:', fallbackNumber);
    return fallbackNumber;
  }
};

// Helper to compute account status (Express accounts don't have status field)
const computeAccountStatus = (account) => {
  if (account.charges_enabled && account.payouts_enabled) {
    return 'active';
  }
  if (account.details_submitted) {
    return 'submitted';
  }
  return 'pending';
};

// Get frontend admin URL
const getFrontendAdminUrl = () => {
  return process.env.FRONTEND_URL || 'https://nagisceylon.com.au/admin';
};

// ============================================================================
// STRIPE EXPRESS ONBOARDING
// ============================================================================

/**
 * Create Stripe Express account and onboarding link
 * This function creates a new Express account or retrieves existing one
 */
exports.createStripeOnboardingLink = functions.https.onCall(async (data, context) => {
  try {
    console.log('=== createStripeOnboardingLink called ===');
    
    const stripeInstance = getStripe();
    const db = getDatabase();
    const adminUrl = getFrontendAdminUrl();
    
    // Check if account already exists in Firebase
    const accountRef = db.ref('stripe/connectedAccount');
    const snapshot = await accountRef.once('value');
    const existingAccount = snapshot.val();
    
    let account;
    let isNewAccount = false;
    
    if (existingAccount?.accountId) {
      // Try to retrieve existing account
      try {
        account = await stripeInstance.accounts.retrieve(existingAccount.accountId);
        console.log('✅ Retrieved existing account:', account.id);
      } catch (error) {
        console.log('⚠️ Existing account not found, creating new one...');
        account = null;
      }
    }
    
    // Create new account if none exists
    if (!account) {
      console.log('Creating new Stripe Express account...');
      account = await stripeInstance.accounts.create({
        type: 'express',
        country: 'AU', // Australia
        email: data.email || undefined, // Optional email
      });
      isNewAccount = true;
      console.log('✅ Created new account:', account.id);
    }
    
    // Compute account status
    const accountStatus = computeAccountStatus(account);
    
    // Determine link type
    const linkType = (account.charges_enabled && account.payouts_enabled) 
      ? 'account_update' 
      : 'account_onboarding';
    
    // Create account link
    const accountLink = await stripeInstance.accountLinks.create({
      account: account.id,
      refresh_url: adminUrl,
      return_url: adminUrl,
      type: linkType,
    });
    
    console.log(`✅ Created ${linkType} link for account ${account.id}`);
    
    // Save/update account info in Firebase
    await accountRef.set({
      accountId: account.id,
      status: accountStatus,
      chargesEnabled: account.charges_enabled || false,
      payoutsEnabled: account.payouts_enabled || false,
      detailsSubmitted: account.details_submitted || false,
      onboardingLink: accountLink.url,
      createdAt: existingAccount?.createdAt || Date.now(),
      updatedAt: Date.now(),
    });
    
    return {
      success: true,
      accountId: account.id,
      status: accountStatus,
      onboardingLink: accountLink.url,
      linkType: linkType,
      isNewAccount: isNewAccount,
    };
  } catch (error) {
    console.error('❌ Error creating onboarding link:', error);
    throw new functions.https.HttpsError(
      'internal',
      `Failed to create onboarding link: ${error.message}`
    );
  }
});

/**
 * Get Stripe account status
 * Retrieves the latest status from Stripe and updates Firebase
 */
exports.getStripeAccountStatus = functions.https.onCall(async (data, context) => {
  try {
    console.log('=== getStripeAccountStatus called ===');
    
    const stripeInstance = getStripe();
    const db = getDatabase();
    
    // Get account ID from Firebase
    const accountRef = db.ref('stripe/connectedAccount');
    const snapshot = await accountRef.once('value');
    const accountData = snapshot.val();
    
    if (!accountData?.accountId) {
      throw new functions.https.HttpsError(
        'not-found',
        'No Stripe account found. Please create an account first.'
      );
    }
    
    // Retrieve account from Stripe
    const account = await stripeInstance.accounts.retrieve(accountData.accountId);
    console.log('✅ Retrieved account:', account.id);
    
    // Compute status
    const accountStatus = computeAccountStatus(account);
    
    // Update Firebase
    await accountRef.update({
      status: accountStatus,
      chargesEnabled: account.charges_enabled || false,
      payoutsEnabled: account.payouts_enabled || false,
      detailsSubmitted: account.details_submitted || false,
      updatedAt: Date.now(),
    });
    
    return {
      success: true,
      accountId: account.id,
      status: accountStatus,
      chargesEnabled: account.charges_enabled || false,
      payoutsEnabled: account.payouts_enabled || false,
      detailsSubmitted: account.details_submitted || false,
    };
  } catch (error) {
    console.error('❌ Error getting account status:', error);
    throw new functions.https.HttpsError(
      'internal',
      `Failed to get account status: ${error.message}`
    );
  }
});

// ============================================================================
// PAYMENT PROCESSING
// ============================================================================

/**
 * Create payment intent with split payment (destination charge)
 */
exports.createPaymentIntent = functions.https.onCall(async (data, context) => {
  try {
    console.log('=== createPaymentIntent called ===');
    
    // Handle Firebase Functions v2 data structure (may wrap in data property)
    const requestData = data?.data || data;
    
    // Safe logging - only log primitive values and simple objects
    if (requestData) {
      console.log('Request data keys:', Object.keys(requestData));
      if (requestData.amount) {
        console.log('Amount:', typeof requestData.amount === 'object' ? JSON.stringify(requestData.amount) : requestData.amount);
      }
      if (requestData.items) {
        console.log('Items:', Array.isArray(requestData.items) ? `Array with ${requestData.items.length} items` : typeof requestData.items);
      }
      if (requestData.customerInfo) {
        console.log('CustomerInfo keys:', Object.keys(requestData.customerInfo));
      }
    }
    
    const { amount, items, customerInfo } = requestData || {};
    
    if (!amount || !items || !customerInfo) {
      console.error('Validation failed:');
      console.error('- amount exists:', !!amount, amount);
      console.error('- items exists:', !!items, Array.isArray(items) ? `Array(${items.length})` : typeof items);
      console.error('- customerInfo exists:', !!customerInfo, customerInfo ? Object.keys(customerInfo) : 'null');
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required fields: amount, items, customerInfo'
      );
    }
    
    const stripeInstance = getStripe();
    const db = getDatabase();
    
    // Get restaurant account ID
    const accountRef = db.ref('stripe/connectedAccount');
    const snapshot = await accountRef.once('value');
    const accountData = snapshot.val();
    
    if (!accountData?.accountId) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Restaurant Stripe account not set up. Please complete onboarding first.'
      );
    }
    
    const restaurantAccountId = accountData.accountId;
    
    // Calculate amounts
    const subtotal = parseFloat(amount.subtotal || amount);
    const serviceFee = Math.min(subtotal * 0.05, 3); // 5% capped at $3
    const total = subtotal + serviceFee;
    
    if (total <= 0 || subtotal <= 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid amount');
    }
    
    console.log('Amounts:', { subtotal, serviceFee, total });
    
    // Create payment intent as DIRECT CHARGE on the connected account
    // This means:
    // - Charge is created on the restaurant's account (not platform)
    // - Restaurant pays Stripe fees automatically
    // - Platform receives application_fee_amount
    // - Customer sees restaurant name on statement
    const paymentIntent = await stripeInstance.paymentIntents.create(
      {
        amount: Math.round(total * 100), // Convert to cents
        currency: 'aud',
        application_fee_amount: Math.round(serviceFee * 100), // Platform fee ($1-$3)
        payment_method_types: ['card'],
        metadata: {
          subtotal: subtotal.toFixed(2),
          serviceFee: serviceFee.toFixed(2),
          total: total.toFixed(2),
          customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
          customerEmail: customerInfo.email,
          orderType: customerInfo.orderType || 'delivery',
        },
      },
      {
        // 👇 THIS makes it a direct charge on the connected account
        stripeAccount: restaurantAccountId,
      }
    );
    
    console.log('✅ Payment intent created:', paymentIntent.id);
    
    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error('❌ Error creating payment intent:', error);
    throw new functions.https.HttpsError(
      'internal',
      `Failed to create payment intent: ${error.message}`
    );
  }
});

/**
 * Confirm payment and create order
 */
exports.confirmPayment = functions.https.onCall(async (data, context) => {
  try {
    console.log('=== confirmPayment called ===');
    
    // Handle Firebase Functions v2 data structure (may wrap in data property)
    const requestData = data?.data || data;
    
    // Safe logging
    if (requestData) {
      console.log('Request data keys:', Object.keys(requestData));
      console.log('PaymentIntentId:', requestData.paymentIntentId);
      console.log('OrderData exists:', !!requestData.orderData);
      if (requestData.orderData) {
        console.log('OrderData keys:', Object.keys(requestData.orderData));
      }
    }
    
    const { paymentIntentId, orderData } = requestData || {};
    
    if (!paymentIntentId || !orderData) {
      console.error('Validation failed:');
      console.error('- paymentIntentId exists:', !!paymentIntentId, paymentIntentId);
      console.error('- orderData exists:', !!orderData, orderData ? Object.keys(orderData) : 'null');
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required fields: paymentIntentId, orderData'
      );
    }
    
    const stripeInstance = getStripe();
    const db = getDatabase();
    
    // Get restaurant account ID (payment intent was created on connected account)
    const accountRef = db.ref('stripe/connectedAccount');
    const accountSnapshot = await accountRef.once('value');
    const accountData = accountSnapshot.val();
    
    if (!accountData?.accountId) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Restaurant Stripe account not set up. Please complete onboarding first.'
      );
    }
    
    const restaurantAccountId = accountData.accountId;
    
    // Verify payment intent - must retrieve from connected account (direct charge)
    const paymentIntent = await stripeInstance.paymentIntents.retrieve(
      paymentIntentId,
      {
        stripeAccount: restaurantAccountId, // Retrieve from connected account
      }
    );
    
    if (paymentIntent.status !== 'succeeded') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        `Payment not completed. Status: ${paymentIntent.status}`
      );
    }
    
    // Check if order already exists
    const ordersRef = db.ref('orders');
    const ordersSnapshot = await ordersRef
      .orderByChild('paymentIntentId')
      .equalTo(paymentIntentId)
      .once('value');
    
    if (ordersSnapshot.exists()) {
      console.log('⚠️ Order already exists for this payment intent');
      const existingOrderKey = Object.keys(ordersSnapshot.val())[0];
      return {
        success: true,
        orderId: existingOrderKey,
        message: 'Order already exists',
      };
    }
    
    // Create order
    const orderRef = ordersRef.push();
    const orderId = orderRef.key;
    
    // Generate order number
    const orderNumber = await generateOrderNumber();
    
    // Ensure customerInfo has firstName and lastName properly structured
    const customerInfo = orderData.customerInfo || {};
    const structuredCustomerInfo = {
      firstName: customerInfo.firstName || '',
      lastName: customerInfo.lastName || '',
      email: customerInfo.email || '',
      phone: customerInfo.phone || '',
      address: customerInfo.address || '',
      orderType: customerInfo.orderType || 'pickup'
    };
    
    const order = {
      id: orderId,
      orderNumber: orderNumber,
      paymentIntentId: paymentIntentId,
      status: 'pending', // Changed from 'confirmed' to 'pending' for dashboard
      amount: orderData.amount,
      subtotal: orderData.subtotal,
      serviceFee: orderData.serviceFee,
      customerInfo: structuredCustomerInfo,
      items: orderData.items || [],
      orderType: customerInfo.orderType || 'pickup', // Add orderType at top level
      timestamp: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    await orderRef.set(order);
    console.log('✅ Order created:', orderId);
    
    return {
      success: true,
      orderId: orderId,
      orderNumber: orderNumber, // Return order number so frontend can use it
      order: order,
    };
  } catch (error) {
    console.error('❌ Error confirming payment:', error);
    throw new functions.https.HttpsError(
      'internal',
      `Failed to confirm payment: ${error.message}`
    );
  }
});

// ============================================================================
// WEBHOOK HANDLER
// ============================================================================

/**
 * Stripe webhook handler
 * Handles payment events from Stripe
 */
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    
    if (!sig) {
      return res.status(400).send('Missing stripe-signature header');
    }
    
    // Get webhook secret (v2 functions use environment variables, not config)
    let webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    // Webhook secret must be set as environment variable
    // Set it using: firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
    
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return res.status(400).send('Webhook secret not configured');
    }
    
    // Get raw body for signature verification
    const rawBody = req.rawBody || (Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body)));
    
    // Verify webhook signature
    let event;
    try {
      event = getStripe().webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    console.log('Processing webhook event:', event.type);
    
    // Log account info for connected account events
    if (event.account) {
      console.log('Event from connected account:', event.account);
    }
    
    // Handle events
    const db = getDatabase();
    
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('✅ Payment succeeded:', paymentIntent.id);
        if (event.account) {
          console.log('Payment from connected account:', event.account);
        }
        
        // Check if order exists, create if not
        const ordersRef = db.ref('orders');
        const ordersSnapshot = await ordersRef
          .orderByChild('paymentIntentId')
          .equalTo(paymentIntent.id)
          .once('value');
        
        if (!ordersSnapshot.exists()) {
          // Extract customer info from metadata
          const metadata = paymentIntent.metadata || {};
          
          // Parse order items from metadata
          let items = [];
          try {
            items = JSON.parse(metadata.orderItems || '[]');
          } catch (e) {
            console.error('Error parsing orderItems from metadata:', e);
          }
          
          // Only create order from webhook if we have items (fallback for cases where confirmPayment wasn't called)
          // This prevents creating incomplete orders
          if (items && items.length > 0) {
            // Create order from webhook (fallback only)
            const orderRef = ordersRef.push();
            
            // Generate order number
            const orderNumber = await generateOrderNumber();
            
            const customerName = metadata.customerName || '';
            const nameParts = customerName.split(' ');
            const firstName = nameParts[0] || 'Customer';
            const lastName = nameParts.slice(1).join(' ') || '';
            
            const customerInfo = {
              firstName: firstName,
              lastName: lastName,
              email: metadata.customerEmail || '',
              phone: metadata.customerPhone || '',
              address: metadata.deliveryAddress || '',
              orderType: metadata.orderType || 'pickup'
            };
            
            const order = {
              id: orderRef.key,
              orderNumber: orderNumber,
              paymentIntentId: paymentIntent.id,
              status: 'pending', // Changed from 'confirmed' to 'pending' for dashboard
              amount: paymentIntent.amount / 100,
              subtotal: parseFloat(metadata.subtotal || '0'),
              serviceFee: parseFloat(metadata.serviceFee || '0'),
              currency: paymentIntent.currency,
              customerInfo: customerInfo, // Properly structured customer info
              items: items,
              orderType: metadata.orderType || 'pickup', // Add orderType at top level
              timestamp: Date.now(),
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            await orderRef.set(order);
            console.log('✅ Order created from webhook (fallback):', orderRef.key);
          } else {
            console.log('⚠️ Webhook received but order items missing - order will be created by confirmPayment function');
          }
        } else {
          console.log('✅ Order already exists - skipping webhook order creation');
        }
        break;
        
      case 'payment_intent.payment_failed':
        console.log('❌ Payment failed:', event.data.object.id);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: error.message });
  }
});
