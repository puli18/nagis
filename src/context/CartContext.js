import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';

const CartContext = createContext();

// Helper function to create a unique cart item ID
const createCartItemId = (item) => {
  // If the item has a variation in its name (e.g., "Biriyani - Chicken"), 
  // use the full name as the unique identifier
  if (item.name.includes(' - ')) {
    return `${item.id}-${item.name.split(' - ')[1].toLowerCase().replace(/\s+/g, '-')}`;
  }
  // Otherwise, just use the item ID
  return item.id;
};

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM':
      const cartItemId = createCartItemId(action.payload);
      const existingItem = state.items.find(item => createCartItemId(item) === cartItemId);
      
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            createCartItemId(item) === cartItemId
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        };
      } else {
        return {
          ...state,
          items: [...state.items, { ...action.payload, quantity: 1 }]
        };
      }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => createCartItemId(item) !== action.payload)
      };

    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          createCartItemId(item) === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        )
      };

    case 'CLEAR_CART':
      return {
        ...state,
        items: []
      };

    case 'TOGGLE_CART':
      return {
        ...state,
        isOpen: !state.isOpen
      };

    case 'LOAD_CART':
      return {
        ...state,
        items: action.payload.items || [],
        isOpen: action.payload.isOpen || false
      };

    case 'INITIALIZE_CART':
      return {
        ...state,
        items: action.payload.items || [],
        isOpen: action.payload.isOpen || false
      };

    default:
      return state;
  }
};

const SERVICE_FEE_PERCENTAGE = 0.05; // 5% service fee

// Helper function to get initial cart state from localStorage
const getInitialCartState = () => {
  try {
    const savedCart = localStorage.getItem('nagisCart');
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      return {
        items: parsedCart.items || [],
        isOpen: parsedCart.isOpen || false
      };
    }
  } catch (error) {
    console.error('Error loading cart from localStorage:', error);
    localStorage.removeItem('nagisCart');
  }
  return {
    items: [],
    isOpen: false
  };
};

export const CartProvider = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [state, dispatch] = useReducer(cartReducer, getInitialCartState());

  // Save cart to localStorage whenever it changes (but not during initialization)
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('nagisCart', JSON.stringify(state));
    }
  }, [state, isInitialized]);

  // Mark as initialized after first render
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  const addItem = (item) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  };

  const removeItem = (itemId) => {
    dispatch({ type: 'REMOVE_ITEM', payload: itemId });
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeItem(itemId);
    } else {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { id: itemId, quantity } });
    }
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const toggleCart = () => {
    dispatch({ type: 'TOGGLE_CART' });
  };

  const getTotalItems = () => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  };

  const getSubtotal = () => {
    return state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getServiceFee = () => {
    const calculatedFee = getSubtotal() * SERVICE_FEE_PERCENTAGE;
    return Math.min(calculatedFee, 3); // Cap at $3
  };

  const getTotal = () => {
    return getSubtotal() + getServiceFee();
  };

  const value = {
    items: state.items,
    isOpen: state.isOpen,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    toggleCart,
    getTotalItems,
    getSubtotal,
    getServiceFee,
    getTotal,
    serviceFeePercentage: SERVICE_FEE_PERCENTAGE,
    createCartItemId
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 