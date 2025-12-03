import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

// Check if Firebase is properly configured
const isFirebaseConfigured = () => {
  return process.env.REACT_APP_FIREBASE_API_KEY && 
         process.env.REACT_APP_FIREBASE_PROJECT_ID;
};

// Category order for sorting
const categoryOrder = ['mains', 'sides', 'finger-food', 'desserts-drinks'];

// Fetch all menu items from Firebase
export const fetchMenuItems = async () => {
  try {
    // Check if Firebase is configured
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase is not configured. Please set up your Firebase environment variables.');
    }

    const menuItemsSnapshot = await getDocs(collection(db, 'menuItems'));
    const menuItems = [];
    
    menuItemsSnapshot.forEach(doc => {
      const data = doc.data();
      menuItems.push({
        id: data.id,
        name: data.name,
        category: data.category,
        price: data.price,
        description: data.description,
        dietary: data.dietary || [],
        popular: data.popular || false,
        variations: data.variations || [],
        image: data.image || null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      });
    });
    
    // If no items found in Firebase, throw error
    if (menuItems.length === 0) {
      throw new Error('No menu items found in Firebase. Please upload menu data first.');
    }
    
    return menuItems;
  } catch (error) {
    console.error('Error fetching menu items from Firebase:', error);
    throw error;
  }
};

// Fetch all categories from Firebase
export const fetchCategories = async () => {
  try {
    // Check if Firebase is configured
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase is not configured. Please set up your Firebase environment variables.');
    }

    const categoriesSnapshot = await getDocs(collection(db, 'categories'));
    const categories = [];
    
    categoriesSnapshot.forEach(doc => {
      const data = doc.data();
      categories.push({
        id: data.id,
        name: data.name,
        description: data.description,
        createdAt: data.createdAt
      });
    });
    
    // If no categories found in Firebase, throw error
    if (categories.length === 0) {
      throw new Error('No categories found in Firebase. Please upload menu data first.');
    }
    
    // Sort categories according to the specified order
    const sortedCategories = categories.sort((a, b) => {
      const aIndex = categoryOrder.indexOf(a.id);
      const bIndex = categoryOrder.indexOf(b.id);
      
      // If both categories are in the order array, sort by their position
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      
      // If only one is in the order array, prioritize it
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      
      // If neither is in the order array, sort alphabetically
      return a.name.localeCompare(b.name);
    });
    
    return sortedCategories;
  } catch (error) {
    console.error('❌ Error fetching categories from Firebase:', error);
    throw error;
  }
};

// Fetch menu items by category
export const fetchMenuItemsByCategory = async (categoryId) => {
  try {
    // Check if Firebase is configured
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase is not configured. Please set up your Firebase environment variables.');
    }

    const menuItemsSnapshot = await getDocs(collection(db, 'menuItems'));
    const menuItems = [];
    
    menuItemsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.category === categoryId) {
        menuItems.push({
          id: data.id,
          name: data.name,
          category: data.category,
          price: data.price,
          description: data.description,
          dietary: data.dietary || [],
          popular: data.popular || false,
          variations: data.variations || [],
          image: data.image || null,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      }
    });
    
    return menuItems;
  } catch (error) {
    console.error('❌ Error fetching menu items by category from Firebase:', error);
    throw error;
  }
};

// Fetch popular menu items
export const fetchPopularItems = async () => {
  try {
    // Check if Firebase is configured
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase is not configured. Please set up your Firebase environment variables.');
    }

    const menuItemsSnapshot = await getDocs(collection(db, 'menuItems'));
    const popularItems = [];
    
    menuItemsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.popular) {
        popularItems.push({
          id: data.id,
          name: data.name,
          category: data.category,
          price: data.price,
          description: data.description,
          dietary: data.dietary || [],
          popular: data.popular || false,
          variations: data.variations || [],
          image: data.image || null,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      }
    });
    
    return popularItems;
  } catch (error) {
    console.error('❌ Error fetching popular items from Firebase:', error);
    throw error;
  }
};

// Fetch a single menu item by ID
export const fetchMenuItemById = async (itemId) => {
  try {
    // Check if Firebase is configured
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase is not configured. Please set up your Firebase environment variables.');
    }

    const menuItemsSnapshot = await getDocs(collection(db, 'menuItems'));
    
    for (const doc of menuItemsSnapshot.docs) {
      const data = doc.data();
      if (data.id === itemId) {
        return {
          id: data.id,
          name: data.name,
          category: data.category,
          price: data.price,
          description: data.description,
          dietary: data.dietary || [],
          popular: data.popular || false,
          variations: data.variations || [],
          image: data.image || null,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error fetching menu item by ID from Firebase:', error);
    throw error;
  }
}; 