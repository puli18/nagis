require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Firebase Realtime Database
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, push, set } = require('firebase/database');

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL
};

const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    stripeKey: process.env.STRIPE_SECRET_KEY ? 'Loaded' : 'Not loaded'
  });
});

// Check restaurant account status
app.get('/api/account-status', async (req, res) => {
  try {
    const restaurantAccountId = process.env.RESTAURANT_STRIPE_ACCOUNT_ID;
    
    if (!restaurantAccountId) {
      return res.json({
        configured: false,
        message: 'No restaurant account configured'
      });
    }

    const account = await stripe.accounts.retrieve(restaurantAccountId);
    
    res.json({
      configured: true,
      accountId: account.id,
      status: account.status,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      requirements: account.requirements,
      canAcceptPayments: account.charges_enabled && account.status !== 'restricted'
    });
    
  } catch (error) {
    console.error('Error checking account status:', error);
    res.status(500).json({ 
      error: 'Failed to check account status',
      message: error.message 
    });
  }
});

// Create payment intent with split payment
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, items, customerInfo } = req.body;
    
    // Validate input
    if (!amount || !items || !customerInfo) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Calculate amounts
    const subtotal = parseFloat(amount.subtotal);
    const serviceFee = Math.min(subtotal * 0.05, 3); // 5% capped at $3
    const total = subtotal + serviceFee;
    
    // Validate amounts
    if (total <= 0 || subtotal <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Check if restaurant account is configured
    const restaurantAccountId = process.env.RESTAURANT_STRIPE_ACCOUNT_ID;
    
    if (!restaurantAccountId) {
      console.log('No restaurant account configured, creating payment without split');
      // Create payment intent without split payment
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(total * 100), // Convert to cents
        currency: 'aud',
        metadata: {
          subtotal: subtotal.toFixed(2),
          serviceFee: serviceFee.toFixed(2),
          itemCount: items.length.toString(),
          customerEmail: customerInfo.email,
          customerPhone: customerInfo.phone || '',
          customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
          orderType: customerInfo.orderType || 'pickup',
          splitPayment: 'false',
          platformFee: serviceFee.toFixed(2), // Track platform fee
          restaurantAmount: subtotal.toFixed(2) // Track restaurant amount
        },
        receipt_email: customerInfo.email,
        description: `Nagi's Ceylon Order - ${items.length} items`
      });

      return res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: {
          subtotal: subtotal,
          serviceFee: serviceFee,
          total: total
        },
        splitPayment: false,
        platformFee: serviceFee,
        restaurantAmount: subtotal
      });
    }

    // Try to create split payment
    try {
      console.log('Creating split payment with restaurant account:', restaurantAccountId);
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(total * 100), // Convert to cents
        currency: 'aud',
        application_fee_amount: Math.round(serviceFee * 100), // Service fee for platform
        transfer_data: {
          destination: restaurantAccountId, // Restaurant's connected account
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
          restaurantAccountId: restaurantAccountId,
          platformFee: serviceFee.toFixed(2),
          restaurantAmount: subtotal.toFixed(2)
        },
        receipt_email: customerInfo.email,
        description: `Nagi's Ceylon Order - ${items.length} items`
      });

      console.log('✅ Split payment intent created successfully:', paymentIntent.id);
      console.log('- Amount:', paymentIntent.amount);
      console.log('- Application Fee:', paymentIntent.application_fee_amount);
      console.log('- Transfer Data:', paymentIntent.transfer_data);

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: {
          subtotal: subtotal,
          serviceFee: serviceFee,
          total: total
        },
        splitPayment: true,
        platformFee: serviceFee,
        restaurantAmount: subtotal
      });

    } catch (splitError) {
      console.error('❌ Split payment failed:', splitError.message);
      console.error('Error type:', splitError.type);
      console.error('Error code:', splitError.code);
      
      // Check if it's a connection error or account restriction
      if (splitError.type === 'StripeConnectionError' || splitError.code === 'connection_error') {
        console.log('Connection error detected, falling back to regular payment...');
      } else if (splitError.code === 'account_invalid' || splitError.code === 'account_restricted') {
        console.log('Account restriction detected, falling back to regular payment...');
      } else {
        console.log('Unknown error, falling back to regular payment...');
      }
      
      // If split payment fails, create regular payment with manual transfer tracking
      try {
        console.log('Creating regular payment intent as fallback...');
        
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(total * 100), // Convert to cents
          currency: 'aud',
          metadata: {
            subtotal: subtotal.toFixed(2),
            serviceFee: serviceFee.toFixed(2),
            itemCount: items.length.toString(),
            customerEmail: customerInfo.email,
            customerPhone: customerInfo.phone || '',
            customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
            orderType: customerInfo.orderType || 'pickup',
            splitPayment: 'false',
            splitError: splitError.message,
            splitErrorCode: splitError.code || 'unknown',
            platformFee: serviceFee.toFixed(2), // Track platform fee
            restaurantAmount: subtotal.toFixed(2), // Track restaurant amount
            needsManualTransfer: 'true' // Flag for manual transfer
          },
          receipt_email: customerInfo.email,
          description: `Nagi's Ceylon Order - ${items.length} items`
        });

        console.log('✅ Regular payment intent created successfully:', paymentIntent.id);
        console.log('- Platform Fee:', serviceFee);
        console.log('- Restaurant Amount:', subtotal);
        console.log('- Manual Transfer Required: true');

        res.json({
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          amount: {
            subtotal: subtotal,
            serviceFee: serviceFee,
            total: total
          },
          splitPayment: false,
          platformFee: serviceFee,
          restaurantAmount: subtotal,
          warning: 'Split payment not available, manual transfer required',
          needsManualTransfer: true
        });
        
      } catch (fallbackError) {
        console.error('❌ Fallback payment also failed:', fallbackError.message);
        res.status(500).json({ error: 'Payment setup failed completely' });
      }
    }

  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({ error: 'Payment setup failed' });
  }
});

// Confirm payment and create order
app.post('/api/confirm-payment', async (req, res) => {
  try {
    const { paymentIntentId, orderData } = req.body;
    
    if (!paymentIntentId || !orderData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      // Create order in database (implement your database logic here)
      const order = await createOrder({
        paymentIntentId,
        amount: paymentIntent.amount / 100,
        items: orderData.items,
        customerInfo: orderData.customerInfo,
        status: 'confirmed',
        subtotal: parseFloat(paymentIntent.metadata.subtotal),
        serviceFee: parseFloat(paymentIntent.metadata.serviceFee)
      });
      
      // Send confirmation emails
      await sendCustomerConfirmation(order);
      await sendRestaurantNotification(order);
      
      res.json({ 
        success: true, 
        orderId: order.id,
        paymentIntentId: paymentIntentId
      });
    } else {
      res.status(400).json({ error: 'Payment not completed' });
    }
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ error: 'Payment confirmation failed' });
  }
});

// Webhook endpoint for Stripe events
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    console.log('Processing webhook event:', event.type);
    
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('Payment succeeded:', {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          splitPayment: paymentIntent.metadata?.splitPayment === 'true',
          restaurantAccount: paymentIntent.metadata?.restaurantAccountId,
          needsManualTransfer: paymentIntent.metadata?.needsManualTransfer === 'true'
        });
        await handlePaymentSuccess(paymentIntent);
        break;
      
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log('Payment failed:', {
          id: failedPayment.id,
          lastPaymentError: failedPayment.last_payment_error?.message
        });
        await handlePaymentFailure(failedPayment);
        break;

      case 'transfer.created':
        const transfer = event.data.object;
        console.log('Transfer created:', {
          id: transfer.id,
          amount: transfer.amount,
          destination: transfer.destination,
          status: transfer.status
        });
        await handleTransferCreated(transfer);
        break;

      case 'transfer.failed':
        const failedTransfer = event.data.object;
        console.log('Transfer failed:', {
          id: failedTransfer.id,
          failureCode: failedTransfer.failure_code,
          failureMessage: failedTransfer.failure_message
        });
        await handleTransferFailed(failedTransfer);
        break;

      case 'account.updated':
        const account = event.data.object;
        console.log('Connected account updated:', {
          id: account.id,
          status: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled
        });
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Handle successful payment
async function handlePaymentSuccess(paymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id);
  
  // Check if this was a regular payment that needs manual transfer
  const needsManualTransfer = paymentIntent.metadata?.needsManualTransfer === 'true';
  const restaurantAccountId = process.env.RESTAURANT_STRIPE_ACCOUNT_ID;
  
  if (needsManualTransfer && restaurantAccountId) {
    try {
      const restaurantAmount = parseFloat(paymentIntent.metadata.restaurantAmount);
      const platformFee = parseFloat(paymentIntent.metadata.platformFee);
      
      console.log('Processing manual transfer for payment:', paymentIntent.id);
      console.log('- Restaurant Amount:', restaurantAmount);
      console.log('- Platform Fee:', platformFee);
      console.log('- Restaurant Account:', restaurantAccountId);
      
      // Create manual transfer to restaurant
      const transfer = await stripe.transfers.create({
        amount: Math.round(restaurantAmount * 100), // Convert to cents
        currency: 'aud',
        destination: restaurantAccountId,
        description: `Manual transfer for payment ${paymentIntent.id}`,
        metadata: {
          paymentIntentId: paymentIntent.id,
          restaurantAmount: restaurantAmount.toFixed(2),
          platformFee: platformFee.toFixed(2),
          manualTransfer: 'true'
        }
      });
      
      console.log('✅ Manual transfer created successfully:', transfer.id);
      console.log('- Transfer Amount:', transfer.amount);
      console.log('- Transfer Status:', transfer.status);
      
      // Log the transfer details for accounting
      console.log('Manual Transfer Summary:');
      console.log('- Payment Intent ID:', paymentIntent.id);
      console.log('- Total Payment:', (paymentIntent.amount / 100).toFixed(2));
      console.log('- Restaurant Transfer:', restaurantAmount.toFixed(2));
      console.log('- Platform Keeps:', platformFee.toFixed(2));
      console.log('- Transfer ID:', transfer.id);
      
    } catch (transferError) {
      console.error('❌ Manual transfer failed:', transferError.message);
      console.error('Transfer error details:', {
        code: transferError.code,
        type: transferError.type,
        message: transferError.message
      });
      
      // Log the failure for manual intervention
      console.log('MANUAL INTERVENTION REQUIRED:');
      console.log('- Payment Intent ID:', paymentIntent.id);
      console.log('- Restaurant Amount:', paymentIntent.metadata.restaurantAmount);
      console.log('- Platform Fee:', paymentIntent.metadata.platformFee);
      console.log('- Restaurant Account:', restaurantAccountId);
    }
  } else if (paymentIntent.metadata?.splitPayment === 'true') {
    console.log('✅ Split payment processed automatically');
    console.log('- Application Fee:', paymentIntent.application_fee_amount);
    console.log('- Transfer Data:', paymentIntent.transfer_data);
  } else {
    console.log('✅ Regular payment processed (no transfer needed)');
  }
  
  // Create order in Firebase if it doesn't exist
  try {
    console.log('Creating order from webhook for payment:', paymentIntent.id);
    
    // Extract order data from payment intent metadata
    const orderData = {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      subtotal: parseFloat(paymentIntent.metadata.subtotal),
      serviceFee: parseFloat(paymentIntent.metadata.serviceFee),
      customerInfo: {
        firstName: paymentIntent.metadata.customerName?.split(' ')[0] || 'Customer',
        lastName: paymentIntent.metadata.customerName?.split(' ').slice(1).join(' ') || '',
        email: paymentIntent.metadata.customerEmail,
        phone: paymentIntent.metadata.customerPhone,
        address: paymentIntent.metadata.deliveryAddress || '',
        orderType: paymentIntent.metadata.orderType || 'pickup'
      },
      items: JSON.parse(paymentIntent.metadata.orderItems || '[]'),
      status: 'confirmed'
    };
    
    const order = await createOrder(orderData);
    console.log('✅ Order created from webhook:', order.id);
    
  } catch (error) {
    console.error('❌ Error creating order from webhook:', error);
  }
}

// Handle failed payment
async function handlePaymentFailure(paymentIntent) {
  console.log('Payment failed:', paymentIntent.id);
  
  // Update order status in database
  // await updateOrderStatus(paymentIntent.id, 'failed');
  
  // Send failure notification
  // await sendPaymentFailureNotification(paymentIntent);
}

// Handle transfer creation
async function handleTransferCreated(transfer) {
  console.log('Transfer created:', transfer.id);
  
  // Log transfer details for accounting
  // await logTransfer(transfer);
}

// Handle transfer failure
async function handleTransferFailed(transfer) {
  console.log('Transfer failed:', transfer.id);
  
  // Log transfer failure details for accounting
  // await logTransferFailure(transfer);
}

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
    const ordersRef = ref(database, 'orders');
    const newOrderRef = push(ordersRef);
    await set(newOrderRef, order);
    
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

// Send customer confirmation email
async function sendCustomerConfirmation(order) {
  // Implement email sending logic
  console.log('Sending customer confirmation email for order:', order.id);
}

// Send restaurant notification
async function sendRestaurantNotification(order) {
  // Implement restaurant notification logic
  console.log('Sending restaurant notification for order:', order.id);
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app; 