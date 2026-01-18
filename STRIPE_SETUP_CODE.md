# Complete Stripe Setup Code

This document shows all the Stripe integration code for Nagi's Ceylon Catering.

## 📁 File Structure

```
project-nagis/
├── firebase/functions/index.js          # Backend: Firebase Functions
├── src/services/firebaseFunctions.js    # Frontend: Service layer
└── src/pages/CheckoutPage.js           # Frontend: Payment UI
```

---

## 🔧 Backend: Firebase Functions

### File: `firebase/functions/index.js`

#### 1. Stripe Initialization

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

// Lazy initialization of Stripe and database
let stripe = null;
let db = null;

const getStripe = () => {
  if (!stripe) {
    let stripeSecretKey;
    
    try {
      // Get from environment variable
      stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      
      if (!stripeSecretKey) {
        throw new Error('STRIPE_SECRET_KEY environment variable is not set');
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
```

#### 2. Create Payment Intent Function

```javascript
// Create payment intent with split payment
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
    
    // Create direct charge payment intent
    const paymentIntentData = {
      amount: Math.round(total * 100), // Convert to cents
      currency: 'aud',
      payment_method_types: paymentMethodTypes,
      // Direct charge: payment goes to connected account, platform gets application fee
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
        chargeType: 'direct_charge',
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

    console.log('✅ Direct charge payment intent created successfully:', paymentIntent.id);

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

  } catch (error) {
    console.error('❌ Payment intent creation error:', error);
    throw new functions.https.HttpsError('internal', 'Payment setup failed');
  }
});
```

#### 3. Confirm Payment Function

```javascript
// Confirm payment and create order
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
    throw new functions.https.HttpsError('internal', 'Payment confirmation failed');
  }
});
```

#### 4. Create Order Helper Function

```javascript
// Create order in Firebase Realtime Database
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

#### 5. Webhook Handler

```javascript
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
    
    // With direct charges, Stripe automatically:
    // 1. Transfers payment to connected account
    // 2. Collects application fee for platform
    // 3. Manages negative balance liabilities
    
    if (paymentIntent.metadata?.chargeType === 'direct_charge') {
      console.log('✅ Direct charge processed automatically');
      console.log('- Payment transferred to restaurant account:', paymentIntent.transfer_data?.destination);
      console.log('- Application fee collected for platform:', paymentIntent.application_fee_amount);
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

---

## 🎨 Frontend: Service Layer

### File: `src/services/firebaseFunctions.js`

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../firebase/config';

const functions = getFunctions(app);

// Create payment intent
export const createPaymentIntent = async (amount, items, customerInfo) => {
  try {
    console.log('Creating payment intent with Firebase Functions...');
    const createPaymentIntentFunction = httpsCallable(functions, 'createPaymentIntent');
    
    const result = await createPaymentIntentFunction({
      amount,
      items,
      customerInfo
    });
    
    console.log('Payment intent created successfully:', result.data);
    return result.data;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

// Confirm payment
export const confirmPayment = async (paymentIntentId, orderData) => {
  try {
    console.log('Confirming payment with Firebase Functions...');
    const confirmPaymentFunction = httpsCallable(functions, 'confirmPayment');
    
    const result = await confirmPaymentFunction({
      paymentIntentId,
      orderData
    });
    
    console.log('Payment confirmed successfully:', result.data);
    return result.data;
  } catch (error) {
    console.error('Error confirming payment:', error);
    throw error;
  }
};
```

---

## 💳 Frontend: Checkout Page

### File: `src/pages/CheckoutPage.js`

#### 1. Stripe Initialization

```javascript
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { createPaymentIntent, confirmPayment } from '../services/firebaseFunctions';

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
```

#### 2. Payment Form Component

```javascript
const PaymentForm = ({ subtotal, total, formData, items, orderType, onSuccess, onError, isProcessing, setIsProcessing, paymentMethod }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [paymentStatus, setPaymentStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('Creating payment...');

    try {
      // Create payment intent using Firebase Functions
      const responseData = await createPaymentIntent(
        { subtotal: subtotal },
        items,
        {
          ...formData,
          orderType: orderType
        }
      );
      
      const { clientSecret } = responseData;
      setPaymentStatus('Processing payment...');

      // Confirm card payment
      const paymentResult = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: formData.firstName + ' ' + formData.lastName,
            email: formData.email
          }
        }
      });

      const { error, paymentIntent } = paymentResult;

      if (error) {
        setPaymentStatus('');
        onError(error.message);
      } else if (paymentIntent.status === 'succeeded') {
        setPaymentStatus('Payment successful!');
        onSuccess(paymentIntent);
      }
    } catch (error) {
      setPaymentStatus('');
      onError('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: '1rem' }}>
        <label>Card Details</label>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
            hidePostalCode: true,
          }}
        />
      </div>
      
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="btn btn-primary w-full"
      >
        {isProcessing ? 'Processing Payment...' : `Pay $${total.toFixed(2)}`}
      </button>
    </form>
  );
};
```

#### 3. Payment Success Handler

```javascript
const handlePaymentSuccess = async (paymentIntent) => {
  try {
    const orderData = {
      paymentIntentId: paymentIntent.id,
      amount: getTotal(),
      subtotal: getSubtotal(),
      serviceFee: getServiceFee(),
      customerInfo: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        orderType: orderType
      },
      items: items
    };

    // Confirm payment and create order
    const result = await confirmPayment(paymentIntent.id, orderData);

    console.log('Order confirmed successfully with ID:', result.orderId);
    
    clearCart();
    
    // Navigate to order confirmation page
    navigate('/order-confirmation', { 
      state: { order: confirmationOrder } 
    });
  } catch (error) {
    console.error('Error confirming payment and creating order:', error);
    alert('Payment successful, but order creation failed. Please try again or contact support.');
  }
};
```

#### 4. Checkout Page Wrapper

```javascript
const CheckoutPage = () => {
  // ... component state and logic ...

  return (
    <Elements stripe={stripePromise}>
      <div className="checkout-page">
        {/* Checkout form with PaymentForm component */}
        <PaymentForm
          subtotal={getSubtotal()}
          total={getTotal()}
          formData={formData}
          items={items}
          orderType={orderType}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          isProcessing={isProcessing}
          setIsProcessing={setIsProcessing}
          paymentMethod={paymentMethod}
        />
      </div>
    </Elements>
  );
};
```

---

## 🔐 Environment Variables

### Frontend (.env)
```env
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_... # or pk_live_... for production
```

### Firebase Functions
Set via Firebase CLI:
```bash
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
```

Or via Firebase Console → Functions → Configuration → Environment variables

---

## 📊 Payment Flow

1. **Customer fills checkout form** → Enters card details
2. **Frontend calls `createPaymentIntent`** → Firebase Function creates Stripe payment intent
3. **Stripe returns `clientSecret`** → Frontend receives payment intent
4. **Customer confirms payment** → Stripe Elements processes card payment
5. **Payment succeeds** → Frontend calls `confirmPayment` Firebase Function
6. **Order created** → Order saved to Firebase Realtime Database
7. **Webhook received** → Stripe sends webhook event (optional, for logging)

---

## 💰 Split Payment Details

- **Total Charge**: Subtotal + Service Fee (5% capped at $3)
- **Restaurant Receives**: Subtotal (via direct charge to connected account)
- **Platform Receives**: Service Fee (via application_fee_amount)
- **Method**: Direct charges with `transfer_data.destination`

---

## 🧪 Testing

### Test Cards
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

### Test Flow
1. Add items to cart
2. Go to checkout
3. Fill customer information
4. Enter test card number
5. Complete payment
6. Verify order in Firebase Database

---

## 📝 Key Configuration

- **Connected Account ID**: `acct_1S50DoJyBQ7hZ0qi` (hardcoded, should be moved to environment variable)
- **Currency**: AUD (Australian Dollars)
- **Service Fee**: 5% of subtotal, capped at $3.00
- **Payment Methods**: Card (Apple Pay, Google Pay, AfterPay supported but not in UI yet)

---

This is the complete Stripe setup code for your application! 🎉






