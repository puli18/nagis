# Stripe Payment Integration Guide

This guide explains how to implement Stripe payment processing with split payments for Nagi's Ceylon Catering.

## Overview

The payment system will:
- Process payments entirely on the website (no redirects)
- Split payments between restaurant and platform owner
- Handle service fees automatically
- Provide real-time payment processing

## Payment Flow

1. **Customer places order** → Cart total + service fee calculated
2. **Customer enters payment details** → Stripe Elements form
3. **Payment processed** → Single charge to customer
4. **Payment split** → Restaurant receives order amount, platform owner receives service fee
5. **Order confirmation** → Customer receives confirmation, restaurant gets order details

## Backend Requirements

### 1. Firebase Functions Setup

The backend uses Firebase Functions (Cloud Functions) for payment processing. The functions are located in `firebase/functions/index.js`.

**Key Functions:**
- `createPaymentIntent` - Creates Stripe payment intents with split payments
- `confirmPayment` - Confirms payment and creates orders in Firebase
- `stripeWebhook` - Handles Stripe webhook events

**Implementation:**
The payment functions are already implemented in `firebase/functions/index.js`. They handle:
- Payment intent creation with application fees
- Direct charges to connected accounts
- Order creation in Firebase Realtime Database
- Webhook event processing

For setup instructions, see [FIREBASE_FUNCTIONS_SETUP.md](./FIREBASE_FUNCTIONS_SETUP.md)

### 2. Environment Variables

**Frontend (.env in project root):**
```env
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Firebase Functions (set via Firebase CLI):**
```bash
# Set Stripe secret key
firebase functions:secrets:set STRIPE_SECRET_KEY

# Set webhook secret
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
```

Or configure via Firebase Console → Functions → Configuration → Environment variables

## Frontend Integration

### 1. Install Stripe Dependencies

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### 2. Update CheckoutPage.js

```javascript
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../firebase/config';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
const functions = getFunctions(app);

// Payment Form Component
const PaymentForm = ({ amount, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment intent using Firebase Functions
      const createPaymentIntentFunction = httpsCallable(functions, 'createPaymentIntent');
      const result = await createPaymentIntentFunction({
        amount,
        items,
        customerInfo
      });

      const { clientSecret } = result.data;

      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: customerInfo.firstName + ' ' + customerInfo.lastName,
            email: customerInfo.email
          }
        }
      });

      if (error) {
        onError(error.message);
      } else if (paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent);
      }
    } catch (error) {
      onError('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
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
        }}
      />
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="btn btn-primary w-full"
      >
        {isProcessing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </button>
    </form>
  );
};

// Updated CheckoutPage
const CheckoutPage = () => {
  // ... existing code ...

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
};
```

## Stripe Connect Setup

### 1. Platform Account Setup

1. Create Stripe account for platform owner
2. Enable Connect in Stripe Dashboard
3. Set up webhook endpoints for payment events

### 2. Restaurant Account Setup

1. Create connected account for restaurant:
```javascript
const account = await stripe.accounts.create({
  type: 'express',
  country: 'AU',
  email: 'restaurant@nagisceylon.com.au',
  capabilities: {
    card_payments: { requested: true },
    transfers: { requested: true },
  },
});
```

2. Restaurant completes onboarding in Stripe Dashboard
3. Get connected account ID for payment transfers

### 3. Webhook Handling

```javascript
// webhook.js
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      // Handle successful payment
      await handlePaymentSuccess(paymentIntent);
      break;
    
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      // Handle failed payment
      await handlePaymentFailure(failedPayment);
      break;
  }

  res.json({ received: true });
});
```

## Database Schema

### Orders Table
```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  payment_intent_id VARCHAR(255) UNIQUE,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  delivery_address TEXT,
  items JSONB,
  subtotal DECIMAL(10,2),
  service_fee DECIMAL(10,2),
  total DECIMAL(10,2),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Security Considerations

1. **Server-side validation** of all payment data
2. **HTTPS only** for all payment communications
3. **Webhook signature verification** for all Stripe events
4. **Rate limiting** on payment endpoints
5. **Input sanitization** for all customer data

## Testing

### Test Cards
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **3D Secure**: 4000 0025 0000 3155

### Test Environment
```javascript
// Use test keys for development
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

## Production Deployment

1. **Switch to live keys** in production
2. **Set up proper webhook endpoints**
3. **Configure SSL certificates**
4. **Set up monitoring and logging**
5. **Test with small amounts first**

## Error Handling

```javascript
const handlePaymentError = (error) => {
  switch (error.code) {
    case 'card_declined':
      return 'Your card was declined. Please try another card.';
    case 'insufficient_funds':
      return 'Insufficient funds. Please try another card.';
    case 'expired_card':
      return 'Your card has expired. Please try another card.';
    default:
      return 'An error occurred. Please try again.';
  }
};
```

## Monitoring

1. **Stripe Dashboard** for payment monitoring
2. **Webhook logs** for payment events
3. **Error tracking** for failed payments
4. **Order status tracking** for customer support

This implementation provides a complete payment solution with proper split payments, security, and error handling. 