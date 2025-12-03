const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin (lightweight)
admin.initializeApp();

// Lazy initialization of Stripe and database
let stripe = null;
let db = null;

const getStripe = () => {
  if (!stripe) {
    // For Firebase Functions v2, we need to use the runtime config
    let stripeSecretKey;
    
    try {
      // Try environment variable first
      stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      
      // If not found, throw an error - secret key must be set via environment variable
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

const getDatabase = () => {
  if (!db) {
    db = admin.database();
  }
  return db;
};

// Helper to get frontend URL for Stripe Connect redirects
const getFrontendAdminUrl = () => {
  const baseUrl = process.env.FRONTEND_URL || 'https://nagisceylon.com.au';
  if (baseUrl.endsWith('/admin')) {
    return baseUrl;
  }
  return `${baseUrl.replace(/\/$/, '')}/admin`;
};


// Helper to safely extract error message without circular reference issues
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

// Test function to verify Stripe connection
exports.testStripeConnection = functions.https.onCall(async (data, context) => {
  try {
    console.log('=== testStripeConnection called (UPDATED) ===');
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

// Create payment intent with split payment
exports.createPaymentIntent = functions.https.onCall(async (data, context) => {
  try {
    console.log('=== createPaymentIntent called ===');
    console.log('Input data keys:', Object.keys(data || {}));
    console.log('Amount:', data?.amount);
    console.log('Items count:', data?.items?.length);
    console.log('Customer info keys:', Object.keys(data?.customerInfo || {}));
    
    // Handle Firebase Functions v2 data structure
    const requestData = data.data || data;
    const { amount, items, customerInfo } = requestData;
    
    // Validate input
    if (!amount || !items || !customerInfo) {
      console.error('Missing required fields:', { amount: !!amount, items: !!items, customerInfo: !!customerInfo });
      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    // Calculate amounts
    const subtotal = parseFloat(amount.subtotal);
    const serviceFee = Math.min(subtotal * 0.05, 3); // 5% capped at $3
    const total = subtotal + serviceFee;
    
    console.log('Calculated amounts:', {
      subtotal,
      serviceFee,
      total,
      totalInCents: Math.round(total * 100)
    });
    
    // Validate amounts
    if (total <= 0 || subtotal <= 0) {
      console.error('Invalid amounts:', { subtotal, total });
      throw new functions.https.HttpsError('invalid-argument', 'Invalid amount');
    }

    // Use the new connected account ID
    const restaurantAccountId = 'acct_1S50DoJyBQ7hZ0qi';
    
    console.log('Using new restaurant account ID:', restaurantAccountId);
    
    // Determine payment method types based on customer info
    const paymentMethod = customerInfo.paymentMethod || 'card';
    const paymentMethodTypes = [];
    
    switch (paymentMethod) {
      case 'apple_pay':
        paymentMethodTypes.push('card', 'apple_pay');
        break;
      case 'google_pay':
        paymentMethodTypes.push('card', 'google_pay');
        break;
      case 'afterpay':
        paymentMethodTypes.push('card', 'afterpay_clearpay');
        break;
      default:
        paymentMethodTypes.push('card');
    }
    
    // Create direct charge - payment goes directly to connected account
    // Platform collects application fee automatically
    try {
      console.log('Creating direct charge to restaurant account:', restaurantAccountId);
      console.log('Using direct charges - Stripe manages negative balance liabilities');
      
      const paymentIntentData = {
        amount: Math.round(total * 100), // Convert to cents
        currency: 'aud',
        payment_method_types: paymentMethodTypes,
        // Direct charge: payment goes to connected account, platform gets application fee
        application_fee_amount: Math.round(serviceFee * 100), // Platform service fee
        transfer_data: {
          destination: restaurantAccountId, // Payment goes directly to restaurant
          // DO NOT use on_behalf_of - this is for direct charges
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
          chargeType: 'direct_charge', // Direct charge to connected account
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
      
      console.log('Creating direct charge payment intent with data:', JSON.stringify(paymentIntentData, null, 2));
      
      const paymentIntent = await getStripe().paymentIntents.create(paymentIntentData);

      console.log('✅ Direct charge payment intent created successfully:', paymentIntent.id);
      console.log('- Payment goes directly to restaurant account:', restaurantAccountId);
      console.log('- Platform collects application fee:', serviceFee);

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: {
          subtotal: subtotal,
          serviceFee: serviceFee,
          total: total
        },
        splitPayment: true,
        chargeType: 'direct_charge',
        platformFee: serviceFee,
        restaurantAmount: subtotal,
        paymentMethod: paymentMethod
      };

    } catch (directChargeError) {
      console.error('❌ Direct charge failed:', directChargeError.message);
      console.error('Direct charge error details:', {
        type: directChargeError.type,
        code: directChargeError.code,
        param: directChargeError.param,
        message: directChargeError.message
      });
      
      // If direct charge fails, throw error - no fallback needed
      // Direct charges should work if account is properly configured
      throw new functions.https.HttpsError('internal', `Direct charge failed: ${directChargeError.message}. Please ensure the connected account is properly configured.`);
    }

  } catch (error) {
    console.error('❌ Payment intent creation error:', error);
    console.error('Error details:', {
      type: error.type,
      code: error.code,
      param: error.param,
      message: error.message
    });
    throw new functions.https.HttpsError('internal', 'Payment setup failed');
  }
});

// Confirm payment and create order
exports.confirmPayment = functions.https.onCall(async (data, context) => {
  try {
    // Handle Firebase Functions v2 data structure
    const requestData = data.data || data;
    const { paymentIntentId, orderData } = requestData;
    
    if (!paymentIntentId || !orderData) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    console.log('=== confirmPayment called ===');
    console.log('Payment Intent ID:', paymentIntentId);
    console.log('Order Data:', JSON.stringify(orderData, null, 2));

    // Verify payment intent
    const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId);
    
    console.log('Payment Intent Status:', paymentIntent.status);
    console.log('Payment Intent Metadata:', paymentIntent.metadata);
    
    if (paymentIntent.status === 'succeeded') {
      // Check if order already exists
      const ordersRef = getDatabase().ref('orders');
      const existingOrders = await ordersRef.orderByChild('paymentIntentId').equalTo(paymentIntentId).once('value');
      
      if (existingOrders.exists()) {
        console.log('✅ Order already exists for payment:', paymentIntentId);
        const existingOrder = Object.values(existingOrders.val())[0];
        return { 
          success: true, 
          orderId: existingOrder.id,
          paymentIntentId: paymentIntentId
        };
      }
      
      // Create order in Firebase
      const order = await createOrder({
        paymentIntentId,
        amount: orderData.amount,
        items: orderData.items,
        customerInfo: orderData.customerInfo,
        status: 'confirmed',
        subtotal: orderData.subtotal,
        serviceFee: orderData.serviceFee
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
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      details: error.details
    });
    throw new functions.https.HttpsError('internal', 'Payment confirmation failed');
  }
});

// Create Stripe Connect onboarding link
exports.createStripeOnboardingLink = functions.https.onCall(async (data, context) => {
  try {
    console.log('=== createStripeOnboardingLink called ===');
    
    const stripeInstance = getStripe();
    const adminUrl = getFrontendAdminUrl();

    // Create a new Stripe Connect Express account
    console.log('Creating new Stripe Connect Express account...');
    
    const account = await stripeInstance.accounts.create({
      type: 'express',
      country: 'AU',
      email: 'restaurant@nagisceylon.com.au',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_profile: {
        mcc: '5814', // Restaurant MCC code
        product_description: 'Sri Lankan restaurant and catering services',
        support_phone: '+61401090451',
        url: 'https://nagisceylon.com.au'
      }
    });

    console.log('✅ Stripe Connect account created:', account.id);

    // Create onboarding link
    const accountLink = await stripeInstance.accountLinks.create({
      account: account.id,
      refresh_url: adminUrl,
      return_url: adminUrl,
      type: 'account_onboarding',
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

    // Update stored status
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

// Create order in Firebase Realtime Database
async function createOrder(orderData) {
  try {
    console.log('Creating order in Firebase:', orderData.paymentIntentId);
    
    // Create order object for Firebase
    const order = {
      paymentIntentId: orderData.paymentIntentId,
      amount: orderData.amount,
      subtotal: orderData.subtotal,
      serviceFee: orderData.serviceFee,
      status: 'pending', // Start with pending status
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

// Stripe webhook handler for payment events
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
      
      event = getStripe().webhooks.constructEvent(req.body, sig, webhookSecret);
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

// Handle successful payment
async function handlePaymentSuccess(paymentIntent) {
  try {
    console.log('=== Payment succeeded (Direct Charge) ===');
    console.log('Payment Intent ID:', paymentIntent.id);
    console.log('Amount:', paymentIntent.amount);
    console.log('Metadata:', paymentIntent.metadata);
    
    // With direct charges, Stripe automatically:
    // 1. Transfers payment to connected account
    // 2. Collects application fee for platform
    // 3. Manages negative balance liabilities
    // No manual transfer needed!
    
    if (paymentIntent.metadata?.chargeType === 'direct_charge') {
      console.log('✅ Direct charge processed automatically');
      console.log('- Payment transferred to restaurant account:', paymentIntent.transfer_data?.destination);
      console.log('- Application fee collected for platform:', paymentIntent.application_fee_amount);
      console.log('- Stripe manages negative balance liabilities');
    } else {
      console.log('⚠️ Payment not using direct charge - check configuration');
    }
    
  } catch (error) {
    console.error('❌ Error handling payment success:', error);
  }
}

// Handle failed payment
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
