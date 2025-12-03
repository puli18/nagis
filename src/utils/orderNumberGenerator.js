import { ref, get, set } from 'firebase/database';
import { realtimeDb } from '../firebase/config';

// Generate sequential order number
export const generateOrderNumber = async () => {
  try {
    // Get the current order counter
    const counterRef = ref(realtimeDb, 'orderCounter');
    const counterSnapshot = await get(counterRef);
    
    let currentNumber = 1;
    if (counterSnapshot.exists()) {
      currentNumber = counterSnapshot.val() + 1;
    }
    
    // Update the counter
    await set(counterRef, currentNumber);
    
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

// Get the next order number without incrementing (for display purposes)
export const getNextOrderNumber = async () => {
  try {
    const counterRef = ref(realtimeDb, 'orderCounter');
    const counterSnapshot = await get(counterRef);
    
    let currentNumber = 0;
    if (counterSnapshot.exists()) {
      currentNumber = counterSnapshot.val();
    }
    
    const nextNumber = currentNumber + 1;
    const orderNumber = nextNumber <= 999 
      ? `#${nextNumber.toString().padStart(3, '0')}`  // #001 to #999
      : `#${nextNumber}`;  // #1000, #1001, etc.
    
    return orderNumber;
  } catch (error) {
    console.error('Error getting next order number:', error);
    return '#001';
  }
};
