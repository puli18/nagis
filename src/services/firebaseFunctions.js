import { getFunctions, httpsCallable } from 'firebase/functions';
import { ref, push, set } from 'firebase/database';
import app, { realtimeDb } from '../firebase/config';
import { generateOrderNumber } from '../utils/orderNumberGenerator';

const functions = getFunctions(app);

console.log('Firebase Functions initialized');

// Test Stripe connection
export const testStripeConnection = async () => {
  try {
    console.log('Testing Stripe connection...');
    const testStripeFunction = httpsCallable(functions, 'testStripeConnection');
    
    const result = await testStripeFunction({});
    
    console.log('Stripe connection test result:', result.data);
    return result.data;
  } catch (error) {
    console.error('Stripe connection test failed:', error);
    throw error;
  }
};

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
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      details: error.details
    });
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
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      details: error.details
    });
    throw error;
  }
};

// Create order in Firebase Realtime Database
export const createOrderInFirebase = async (orderData) => {
  try {
    console.log('Creating order in Firebase Realtime Database...');
    
    // Generate sequential order number
    const orderNumber = await generateOrderNumber();
    
    const orderRef = ref(realtimeDb, 'orders');
    const newOrderRef = push(orderRef);
    
    const order = {
      id: newOrderRef.key,
      orderNumber: orderNumber,
      paymentIntentId: orderData.paymentIntentId,
      amount: orderData.amount,
      subtotal: orderData.subtotal,
      serviceFee: orderData.serviceFee,
      customerInfo: {
        name: `${orderData.customerInfo.firstName} ${orderData.customerInfo.lastName}`,
        firstName: orderData.customerInfo.firstName,
        lastName: orderData.customerInfo.lastName,
        email: orderData.customerInfo.email,
        phone: orderData.customerInfo.phone,
        address: orderData.customerInfo.address,
        orderType: orderData.customerInfo.orderType
      },
      items: orderData.items,
      orderType: orderData.customerInfo.orderType, // Add orderType at the top level
      status: 'pending',
      timestamp: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await set(newOrderRef, order);
    
    console.log('Order created successfully with ID:', order.id, 'Order Number:', orderNumber);
    return order;
  } catch (error) {
    console.error('Error creating order in Firebase:', error);
    throw error;
  }
};

// Update connected account ID
export const updateConnectedAccount = async () => {
  try {
    console.log('Updating connected account ID...');
    const updateConnectedAccountFunction = httpsCallable(functions, 'updateConnectedAccount');
    
    const result = await updateConnectedAccountFunction({});
    
    console.log('Connected account updated successfully:', result.data);
    return result.data;
  } catch (error) {
    console.error('Error updating connected account:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      details: error.details
    });
    throw error;
  }
};

// Health check
export const checkFirebaseFunctions = async () => {
  try {
    console.log('Checking Firebase Functions availability...');
    // Try to call a simple function to check if Firebase Functions are available
    const createPaymentIntentFunction = httpsCallable(functions, 'createPaymentIntent');
    
    // This will fail with invalid arguments, but it means the function exists
    await createPaymentIntentFunction({});
    
    console.log('Firebase Functions are available');
    return { available: true };
  } catch (error) {
    console.error('Firebase Functions check failed:', error);
    if (error.code === 'functions/invalid-argument') {
      // This means the function exists but we passed invalid arguments
      console.log('Firebase Functions are available (invalid argument expected)');
      return { available: true };
    }
    
    return { 
      available: false, 
      error: error.message 
    };
  }
};
