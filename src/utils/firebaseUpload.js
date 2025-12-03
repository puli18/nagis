import { collection, addDoc, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { menuData } from '../data/menuData';

// Upload all menu items to Firebase
export const uploadMenuItemsToFirebase = async () => {
  try {
    console.log('Starting menu upload to Firebase...');
    
    // First, clear existing menu items
    await clearMenuItems();
    
    // Upload categories
    const categoriesCollection = collection(db, 'categories');
    const categoryIds = {};
    
    for (const category of menuData.categories) {
      const docRef = await addDoc(categoriesCollection, {
        id: category.id,
        name: category.name,
        description: category.description,
        createdAt: new Date()
      });
      categoryIds[category.id] = docRef.id;
      console.log(`Uploaded category: ${category.name}`);
    }
    
    // Upload menu items
    const menuItemsCollection = collection(db, 'menuItems');
    
    for (const item of menuData.items) {
      const menuItemData = {
        id: item.id,
        name: item.name,
        category: item.category,
        categoryId: categoryIds[item.category],
        price: item.price,
        description: item.description,
        dietary: item.dietary || [],
        popular: item.popular || false,
        variations: item.variations || [],
        image: item.image || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await addDoc(menuItemsCollection, menuItemData);
      console.log(`Uploaded menu item: ${item.name}`);
    }
    
    console.log('✅ All menu items uploaded successfully to Firebase!');
    return { success: true, message: 'Menu items uploaded successfully' };
    
  } catch (error) {
    console.error('❌ Error uploading menu items to Firebase:', error);
    return { success: false, error: error.message };
  }
};

// Clear all existing menu items
export const clearMenuItems = async () => {
  try {
    console.log('Clearing existing menu items...');
    
    // Clear menu items
    const menuItemsSnapshot = await getDocs(collection(db, 'menuItems'));
    const menuItemsDeletePromises = menuItemsSnapshot.docs.map(doc => 
      deleteDoc(doc.ref)
    );
    await Promise.all(menuItemsDeletePromises);
    
    // Clear categories
    const categoriesSnapshot = await getDocs(collection(db, 'categories'));
    const categoriesDeletePromises = categoriesSnapshot.docs.map(doc => 
      deleteDoc(doc.ref)
    );
    await Promise.all(categoriesDeletePromises);
    
    console.log('✅ Cleared existing menu items and categories');
  } catch (error) {
    console.error('❌ Error clearing menu items:', error);
    throw error;
  }
};

// Get all menu items from Firebase
export const getMenuItemsFromFirebase = async () => {
  try {
    const menuItemsSnapshot = await getDocs(collection(db, 'menuItems'));
    const menuItems = [];
    
    menuItemsSnapshot.forEach(doc => {
      menuItems.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return menuItems;
  } catch (error) {
    console.error('❌ Error fetching menu items from Firebase:', error);
    throw error;
  }
};

// Get all categories from Firebase
export const getCategoriesFromFirebase = async () => {
  try {
    const categoriesSnapshot = await getDocs(collection(db, 'categories'));
    const categories = [];
    
    categoriesSnapshot.forEach(doc => {
      categories.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return categories;
  } catch (error) {
    console.error('❌ Error fetching categories from Firebase:', error);
    throw error;
  }
};

// Update a specific menu item
export const updateMenuItem = async (itemId, updates) => {
  try {
    const menuItemsSnapshot = await getDocs(collection(db, 'menuItems'));
    const itemDoc = menuItemsSnapshot.docs.find(doc => doc.data().id === itemId);
    
    if (itemDoc) {
      await updateDoc(itemDoc.ref, {
        ...updates,
        updatedAt: new Date()
      });
      console.log(`✅ Updated menu item: ${itemId}`);
      return { success: true };
    } else {
      throw new Error(`Menu item with ID ${itemId} not found`);
    }
  } catch (error) {
    console.error('❌ Error updating menu item:', error);
    return { success: false, error: error.message };
  }
}; 