import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';
import { updateMenuItem } from './firebaseUpload';

// Image mapping for food items
const imageMapping = {
  'kottu': '/images/food/chickenkottu-506x405.png',
  'nasi-goreng': '/images/food/nasigoreng-506x405.png',
  'rice-curry': '/images/food/riceandcurryfish-506x405.png',
  'biriyani': '/images/food/chickenbiryani-506x405.png',
  'fried-rice': '/images/food/chillichickenfriedrice-506x405.png',
  'noodles': '/images/food/noodles-506x405.png',
  'lamprais': '/images/food/lamprais-506x405.png',
  'string-hopper-pilau': '/images/food/stringhopperspilau-506x405.png'
};

// Upload a single image to Firebase Storage
export const uploadImageToFirebase = async (imagePath, itemId) => {
  try {
    console.log(`📤 Uploading image for ${itemId}: ${imagePath}`);
    
    // Fetch the image from the public directory
    const response = await fetch(imagePath);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${imagePath}`);
    }
    
    const blob = await response.blob();
    
    // Create a reference to the image in Firebase Storage
    const storageRef = ref(storage, `menu-images/${itemId}.png`);
    
    // Upload the image
    const snapshot = await uploadBytes(storageRef, blob);
    console.log(`✅ Image uploaded for ${itemId}`);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log(`🔗 Download URL for ${itemId}: ${downloadURL}`);
    
    return downloadURL;
  } catch (error) {
    console.error(`❌ Error uploading image for ${itemId}:`, error);
    throw error;
  }
};

// Upload all food images and update menu items
export const uploadAllFoodImages = async () => {
  try {
    console.log('🚀 Starting food image upload to Firebase Storage...');
    
    const uploadPromises = [];
    
    // Upload each image and prepare update promises
    for (const [itemId, imagePath] of Object.entries(imageMapping)) {
      const uploadPromise = uploadImageToFirebase(imagePath, itemId)
        .then(downloadURL => {
          // Prepare the update promise
          return updateMenuItem(itemId, { image: downloadURL });
        })
        .catch(error => {
          console.error(`❌ Failed to upload image for ${itemId}:`, error);
          return null;
        });
      
      uploadPromises.push(uploadPromise);
    }
    
    // Wait for all uploads to complete
    const results = await Promise.all(uploadPromises);
    
    // Count successful uploads
    const successfulUploads = results.filter(result => result !== null);
    
    console.log(`🎉 Image upload completed!`);
    console.log(`📊 Summary:`);
    console.log(`   - Total images: ${Object.keys(imageMapping).length}`);
    console.log(`   - Successfully uploaded: ${successfulUploads.length}`);
    console.log(`   - Failed: ${Object.keys(imageMapping).length - successfulUploads.length}`);
    
    return {
      success: true,
      message: `Successfully uploaded ${successfulUploads.length} images`,
      uploaded: successfulUploads.length,
      total: Object.keys(imageMapping).length
    };
    
  } catch (error) {
    console.error('❌ Error uploading food images:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get the download URL for a specific menu item
export const getImageDownloadURL = async (itemId) => {
  try {
    const storageRef = ref(storage, `menu-images/${itemId}.png`);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error(`❌ Error getting download URL for ${itemId}:`, error);
    return null;
  }
};

// Check if an image exists in Firebase Storage
export const checkImageExists = async (itemId) => {
  try {
    const storageRef = ref(storage, `menu-images/${itemId}.png`);
    await getDownloadURL(storageRef);
    return true;
  } catch (error) {
    return false;
  }
}; 