import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { FaCreditCard, FaLock, FaPhone, FaEnvelope } from 'react-icons/fa';
import { placeholderImage } from '../utils/placeholderImage';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { createPaymentIntent, confirmPayment } from '../services/firebaseFunctions';
import { ref, get } from 'firebase/database';
import { realtimeDb } from '../firebase/config';
import { useBusinessHours } from '../context/BusinessHoursContext';
import { formatNextOpening } from '../utils/businessHours';

// Payment Method Selection Component
const PaymentMethodSelector = ({ selectedMethod, onMethodChange }) => {
  const paymentMethods = [
    {
      id: 'card',
      name: 'Credit / Debit Card',
      icon: <FaCreditCard />,
      description: 'Visa, Mastercard, American Express'
    }
  ];

  return (
    <div className="payment-method-selector">
      <label style={{ display: 'block', marginBottom: '1rem', fontWeight: '600' }}>
        Payment Method
      </label>
      <div className="payment-methods-grid">
        {paymentMethods.map((method) => (
          <div
            key={method.id}
            className={`payment-method-option ${selectedMethod === method.id ? 'selected' : ''}`}
            onClick={() => onMethodChange(method.id)}
          >
            <div className="payment-method-icon">
              {method.icon}
            </div>
            <div className="payment-method-details">
              <div className="payment-method-name">{method.name}</div>
              <div className="payment-method-description">{method.description}</div>
            </div>
            <div className="payment-method-radio">
              <input
                type="radio"
                name="paymentMethod"
                value={method.id}
                checked={selectedMethod === method.id}
                onChange={() => onMethodChange(method.id)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Enhanced Payment Form Component
const PaymentForm = ({ subtotal, total, formData, items, orderType, onSuccess, onError, isProcessing, setIsProcessing, paymentMethod, isCheckoutDisabled }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [paymentStatus, setPaymentStatus] = useState('');


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isCheckoutDisabled) {
      setPaymentStatus('We are currently closed. Please come back during business hours.');
      return;
    }
    
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('Creating payment...');

    try {
      // Create payment intent using Firebase Functions
      console.log('Sending payment request to Firebase Functions...');
      console.log('Subtotal:', subtotal);
      console.log('Total:', total);
      console.log('Payment Method:', paymentMethod);
      
      const responseData = await createPaymentIntent(
        { subtotal: subtotal },
        items,
        {
          ...formData,
          orderType: orderType
        }
      );

      console.log('Response data:', responseData);
      
      if (responseData.warning) {
        console.log('Payment warning:', responseData.warning);
        setPaymentStatus(responseData.warning);
      }
      
      const { clientSecret } = responseData;

      setPaymentStatus('Processing payment...');

      // Card payment
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

  // Render card payment form
  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
          Card Details
        </label>
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
      
      {paymentStatus && (
        <div style={{ 
          marginBottom: '1rem', 
          padding: '0.5rem', 
          backgroundColor: paymentStatus.toLowerCase().includes('warning') || paymentStatus.toLowerCase().includes('closed') ? '#fff3cd' : '#d4edda',
          border: paymentStatus.toLowerCase().includes('warning') || paymentStatus.toLowerCase().includes('closed') ? '1px solid #ffeaa7' : '1px solid #c3e6cb',
          borderRadius: '4px',
          fontSize: '0.9rem'
        }}>
          {paymentStatus}
        </div>
      )}
      
      <button
        type="submit"
        className="btn btn-primary w-full"
        disabled={!stripe || isProcessing || isCheckoutDisabled}
        style={{ fontSize: '1.1rem', padding: '1rem', marginTop: '1rem' }}
      >
        {isProcessing ? (
          <div className="d-flex align-center justify-center" style={{ gap: '0.5rem' }}>
            <div className="loading-spinner" style={{ margin: '0', width: '20px', height: '20px', borderWidth: '2px' }}></div>
            <span>Processing Payment...</span>
          </div>
        ) : (
          `Pay $${total.toFixed(2)}`
        )}
      </button>
    </form>
  );
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const {
    items,
    getSubtotal,
    getServiceFee,
    getTotal,
    clearCart
  } = useCart();
  const { isOpenNow, nextOpeningDate, isLoading: businessHoursLoading } = useBusinessHours();
  const checkoutDisabled = !businessHoursLoading && !isOpenNow;
  const nextOpeningLabel = formatNextOpening(nextOpeningDate);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postcode: '',
    deliveryInstructions: ''
  });

  const [orderType] = useState('pickup'); // Only pickup available
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [stripePromise, setStripePromise] = useState(null);

  // Load restaurant Stripe account ID and initialize Stripe with it
  useEffect(() => {
    const loadStripeAccount = async () => {
      try {
        const accountRef = ref(realtimeDb, 'stripe/connectedAccount');
        const snapshot = await get(accountRef);
        
        if (snapshot.exists()) {
          const accountData = snapshot.val();
          const accountId = accountData.accountId;
          
          if (accountId) {
            // Initialize Stripe with connected account for direct charges
            const stripe = await loadStripe(
              process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY,
              {
                stripeAccount: accountId, // This makes it work with direct charges
              }
            );
            setStripePromise(stripe);
            console.log('✅ Stripe initialized with connected account:', accountId);
          }
        } else {
          // Fallback: initialize without connected account (will fail for direct charges)
          const stripe = await loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
          setStripePromise(stripe);
          console.warn('⚠️ No Stripe account found, initializing without connected account');
        }
      } catch (error) {
        console.error('Error loading Stripe account:', error);
        // Fallback: initialize without connected account
        loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY).then(setStripePromise);
      }
    };

    loadStripeAccount();
  }, []);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      navigate('/menu');
    }
  }, [items, navigate]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePaymentSuccess = async (paymentIntent) => {
    try {
      // Create order using Firebase Functions confirmPayment
      console.log('Confirming payment and creating order...');
      console.log('Payment Intent ID:', paymentIntent.id);
      console.log('Subtotal:', getSubtotal());
      console.log('Total:', getTotal());
      console.log('Order Type:', orderType);
      console.log('Form Data:', formData);
      console.log('Items:', items);

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

      // Use confirmPayment Firebase Function instead of direct Firebase call
      const result = await confirmPayment(paymentIntent.id, orderData);

      console.log('Order confirmed successfully with ID:', result.orderId);
      console.log('Order number:', result.orderNumber);
      
      // Prepare order data for confirmation page - use actual order number from backend
      const confirmationOrder = {
        id: result.orderId,
        orderNumber: result.orderNumber || `#${result.orderId.slice(-6).toUpperCase()}`, // Use order number from backend
        timestamp: Date.now(),
        amount: orderData.amount,
        serviceFee: orderData.serviceFee,
        customerInfo: orderData.customerInfo,
        items: orderData.items,
        orderType: orderData.customerInfo.orderType
      };

      clearCart();
      
      // Navigate to order confirmation page with order data
      navigate('/order-confirmation', { 
        state: { order: confirmationOrder } 
      });
    } catch (error) {
      console.error('Error confirming payment and creating order:', error);
      alert('Payment successful, but order creation failed. Please try again or contact support.');
    }
  };

  const handlePaymentError = (error) => {
    console.error('Payment failed:', error);
    alert('Payment failed. Please try again.');
  };



  if (items.length === 0) {
    return null; // Will redirect to menu
  }

  // Wait for Stripe to be initialized
  if (!stripePromise) {
    return (
      <div className="checkout-page" style={{ paddingTop: '8rem', textAlign: 'center' }}>
        <p>Loading payment system...</p>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <div className="checkout-page">
      {/* Hero Section */}
      <section className="section" style={{ paddingTop: '8rem', paddingBottom: '4rem' }}>
        <div className="section-title" style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h1 style={{ marginBottom: '1rem' }}>Checkout</h1>
          <p style={{ fontSize: '18px', maxWidth: '700px', margin: '0 auto' }}>
            Complete your order and enjoy authentic Sri Lankan cuisine delivered to your door.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="d-grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '3rem' }}>
          {/* Left Column - Order Form */}
          <div>
            <div className="card p-4">
              <h2>Order Details</h2>

              {checkoutDisabled && (
                <div className="closed-order-note">
                  We are closed now. {nextOpeningLabel && `Next opening: ${nextOpeningLabel}.`}
                </div>
              )}
              
              {/* Order Items */}
              <div className="mb-4">
                <h3>Your Order</h3>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {items.map((item) => (
                    <div key={item.id} className="cart-item d-flex align-center mb-2" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '8px',
                          objectFit: 'cover',
                          marginRight: '1rem'
                        }}
                        onError={(e) => {
                          e.target.src = placeholderImage;
                        }}
                      />
                      <div className="cart-item-details" style={{ flex: 1 }}>
                        <h4 className="cart-item-title" style={{ margin: '0 0 0.25rem 0', fontSize: '1rem' }}>{item.name}</h4>
                        <p className="cart-item-price" style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                          Qty: {item.quantity} × ${item.price.toFixed(2)}
                        </p>
                      </div>
                      <div style={{ fontWeight: '600' }}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile Order Summary - Only visible on mobile */}
              <div className="mobile-order-summary mb-4">
                <div className="card p-3" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                  <h3 style={{ color: 'var(--text-primary)' }}>Order Summary</h3>
                  
                  <div className="mb-3">
                    <div className="d-flex justify-between mb-2" style={{ color: 'var(--text-secondary)' }}>
                      <span>Subtotal ({items.length} items):</span>
                      <span>${getSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="d-flex justify-between mb-2" style={{ color: 'var(--text-secondary)' }}>
                      <span>Service Fee:</span>
                      <span>${Math.min(getServiceFee(), 3).toFixed(2)}</span>
                    </div>
                    <div className="d-flex justify-between mb-2" style={{ borderTop: '1px solid rgba(212, 175, 55, 0.2)', paddingTop: '0.5rem' }}>
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Total:</span>
                      <span style={{ fontWeight: '600', fontSize: '1.1rem', color: 'var(--accent-gold)' }}>
                        ${(getSubtotal() + Math.min(getServiceFee(), 3)).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <h4 style={{ color: 'var(--text-primary)' }}>Pickup Information</h4>
                    <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.9rem' }}>
                      <li style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--accent-gold)', marginRight: '0.5rem' }}>•</span>
                        Collect from restaurant
                      </li>
                      <li style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--accent-gold)', marginRight: '0.5rem' }}>•</span>
                        Orders ready in 20-30 minutes
                      </li>
                      <li style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--accent-gold)', marginRight: '0.5rem' }}>•</span>
                        1A Whyalla St, Willetton, WA 6155
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Order Type Selection - Pickup Only */}
              <div className="mb-4">
                <h3>Order Type</h3>
                <div className="order-type-selection">
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    cursor: 'pointer',
                    padding: '1rem',
                    border: '2px solid var(--accent-gold)',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(212, 175, 55, 0.1)',
                    transition: 'all 0.3s ease'
                  }}>
                    <input
                      type="radio"
                      name="orderType"
                      value="pickup"
                      checked={true}
                      readOnly
                      style={{ marginRight: '0.5rem' }}
                    />
                    <div>
                      <div style={{ fontWeight: '600', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>Pickup</div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Collect from restaurant</div>
                    </div>
                  </label>
                </div>
              </div>



              {/* Customer Information */}
              <div>
                <h3>Customer Information</h3>
                
                <div className="d-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="First Name"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid rgba(212, 175, 55, 0.3)',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Last Name"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid rgba(212, 175, 55, 0.3)',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Email Address"
                  required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid rgba(212, 175, 55, 0.3)',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      marginBottom: '1rem',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)'
                    }}
                />

                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Phone Number"
                  required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid rgba(212, 175, 55, 0.3)',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      marginBottom: '1rem',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)'
                    }}
                />

                {/* Delivery Address - Only show for delivery orders */}
                {orderType === 'delivery' && (
                  <>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Delivery Address"
                      required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid rgba(212, 175, 55, 0.3)',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      marginBottom: '1rem',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)'
                    }}
                    />

                    <div className="d-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="City"
                        required
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          fontSize: '1rem'
                        }}
                      />
                      <input
                        type="text"
                        name="postcode"
                        value={formData.postcode}
                        onChange={handleInputChange}
                        placeholder="Postcode"
                        required
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          fontSize: '1rem'
                        }}
                      />
                    </div>
                  </>
                )}

                {/* Delivery Instructions - Only show for delivery orders */}
                {orderType === 'delivery' && (
                  <>
                    <textarea
                      name="deliveryInstructions"
                      value={formData.deliveryInstructions}
                      onChange={handleInputChange}
                      placeholder="Delivery Instructions (Optional)"
                      rows="3"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        marginBottom: '1rem',
                        resize: 'vertical'
                      }}
                    />
                  </>
                )}



                {/* Payment Method Selection */}
                <h3>Payment Method</h3>
                <PaymentMethodSelector selectedMethod={paymentMethod} onMethodChange={setPaymentMethod} />

                {/* Stripe Payment Form */}
                <div className="card p-3 mb-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                  <div className="d-flex align-center mb-2">
                    <FaLock style={{ color: 'var(--accent-gold)', marginRight: '0.5rem' }} />
                    <span style={{ color: 'var(--accent-gold)', fontWeight: '600' }}>Secure Payment</span>
                  </div>
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
                    isCheckoutDisabled={checkoutDisabled}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="order-summary">
            <div className="card p-4 order-summary-card" style={{ position: 'sticky', top: '100px' }}>
              <h3 style={{ color: 'var(--text-primary)' }}>Order Summary</h3>
              
              <div className="mb-4">
                <div className="d-flex justify-between mb-2" style={{ color: 'var(--text-secondary)' }}>
                  <span>Subtotal ({items.length} items):</span>
                  <span>${getSubtotal().toFixed(2)}</span>
                </div>
                <div className="d-flex justify-between mb-2" style={{ color: 'var(--text-secondary)' }}>
                  <span>Service Fee:</span>
                  <span>${Math.min(getServiceFee(), 3).toFixed(2)}</span>
                </div>
                <div className="d-flex justify-between mb-2" style={{ borderTop: '1px solid rgba(212, 175, 55, 0.2)', paddingTop: '0.5rem' }}>
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Total:</span>
                  <span style={{ fontWeight: '600', fontSize: '1.1rem', color: 'var(--accent-gold)' }}>
                    ${(getSubtotal() + Math.min(getServiceFee(), 3)).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="delivery-info mb-4">
                <h4>Pickup Information</h4>
                <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.9rem' }}>
                  <li style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--accent-gold)', marginRight: '0.5rem' }}>•</span>
                    Collect from restaurant
                  </li>
                  <li style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--accent-gold)', marginRight: '0.5rem' }}>•</span>
                    Orders ready in 20-30 minutes
                  </li>
                  <li style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--accent-gold)', marginRight: '0.5rem' }}>•</span>
                    1A Whyalla St, Willetton, WA 6155
                  </li>
                </ul>
              </div>

              <div className="help-section card p-3" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                <h4 style={{ color: 'var(--text-primary)' }}>Need Help?</h4>
                <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                  Contact us if you have any questions about your order.
                </p>
                <div className="d-flex align-center mb-2" style={{ color: 'var(--text-secondary)' }}>
                  <FaPhone style={{ color: 'var(--accent-gold)', marginRight: '0.5rem' }} />
                  <span>(08) 6252 8222</span>
                </div>
                <div className="d-flex align-center" style={{ color: 'var(--text-secondary)' }}>
                  <FaEnvelope style={{ color: 'var(--accent-gold)', marginRight: '0.5rem' }} />
                  <span>info@nagisceylon.com.au</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
    </Elements>
  );
};

export default CheckoutPage; 