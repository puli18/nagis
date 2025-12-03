# Firebase Menu Upload Guide

This guide explains how to upload all menu items and food images to Firebase Firestore database and Firebase Storage.

## Prerequisites

1. **Firebase Project Setup**
   - Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Enable Firestore Database in your project
   - Enable Firebase Storage in your project
   - Set up Firestore security rules (for development, you can use test mode)
   - Set up Storage security rules (for development, you can use test mode)

2. **Environment Variables**
   Create a `.env` file in the root directory with your Firebase configuration:

   ```env
   REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   ```

   You can find these values in your Firebase project settings.

## Upload Methods

### Method 1: Using the Admin Page (Web Interface)

1. **Start the development server:**
   ```bash
   npm start
   ```

2. **Navigate to the admin page:**
   Open your browser and go to `http://localhost:3000/admin`

3. **Upload menu items:**
   - Click the "Upload to Firebase" button
   - Wait for the upload to complete
   - Check the status message for confirmation

4. **Upload food images:**
   - Click the "Upload Images to Firebase" button
   - Wait for the image upload to complete
   - Check the status message for confirmation

### Method 2: Using the Node.js Scripts (Command Line)

1. **Upload menu items:**
   ```bash
   node uploadMenuToFirebase.js
   ```

2. **Upload food images:**
   ```bash
   node uploadImagesToFirebase.js
   ```

3. **Check the output:**
   The scripts will show progress and confirm when the upload is complete.

## What Gets Uploaded

### Categories
- **Mains** - Main dishes and rice specialties
- **Sides** - Curries, breads and accompaniments  
- **Finger Food** - Perfect for events and catering
- **Desserts & Drinks** - Sweet treats and refreshing beverages

### Menu Items
- **8 Mains items** (Kottu, Nasi Goreng, Rice & Curry, Biriyani, Fried Rice, Noodles, Lamprais, String Hopper Pilau)
- **9 Sides items** (Butter Chicken, Sri Lankan Curry, Devilled Chicken, Fish Curry, Prawn Curry, Lamb Curry, Beef Curry, Plain Naan, Garlic Naan)
- **8 Finger Food items** (Chicken Rolls, Chicken Roti, Egg Roti, Rolls, Fish Cutlets, etc.)
- **8 Desserts & Drinks items** (Ice Cream, Crème Caramel, Wattalappam, Biscuit Pudding, Faluda, Mango Lassi, Woodapple Shake, Tea/Coffee)

**Total: 33 menu items**

### Food Images
- **8 Food images** for main dishes:
  - Kottu (chickenkottu-506x405.png)
  - Nasi Goreng (nasigoreng-506x405.png)
  - Rice & Curry (riceandcurryfish-506x405.png)
  - Biriyani (chickenbiryani-506x405.png)
  - Fried Rice (chillichickenfriedrice-506x405.png)
  - Noodles (noodles-506x405.png)
  - Lamprais (lamprais-506x405.png)
  - String Hopper Pilau (stringhopperspilau-506x405.png)

## Firebase Database Structure

### Collections

#### `categories`
```javascript
{
  id: "mains",
  name: "Mains", 
  description: "Main dishes and rice specialties",
  createdAt: Timestamp
}
```

#### `menuItems`
```javascript
{
  id: "kottu",
  name: "Kottu",
  category: "mains",
  categoryId: "firebase_document_id",
  price: 25.00,
  description: "Sri Lankan street food classic...",
  dietary: ["spicy"],
  popular: true,
  variations: [...],
  image: "https://firebasestorage.googleapis.com/...", // Firebase Storage URL
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Firebase Storage

#### `menu-images/` folder
- `kottu.png`
- `nasi-goreng.png`
- `rice-curry.png`
- `biriyani.png`
- `fried-rice.png`
- `noodles.png`
- `lamprais.png`
- `string-hopper-pilau.png`

## Features

### ✅ What's Included
- **Complete menu data** with all items and categories
- **Price information** for all items
- **Dietary tags** (spicy, vegetarian, etc.)
- **Variations** for items with multiple options
- **Popular flags** for featured items
- **Firebase Storage URLs** for food images
- **Timestamps** for tracking creation and updates

### 🔄 Upload Process
1. **Clears existing data** to avoid duplicates
2. **Uploads categories** first
3. **Uploads menu items** with category references
4. **Uploads food images** to Firebase Storage
5. **Updates menu items** with Firebase Storage URLs
6. **Provides progress feedback** during upload
7. **Handles errors gracefully** with detailed error messages

## Image Upload Process

### Step 1: Upload Menu Items
- Uploads all menu items to Firestore
- Sets local image paths initially

### Step 2: Upload Images
- Reads images from `public/images/food/` directory
- Uploads each image to Firebase Storage
- Updates menu items with Firebase Storage URLs
- Replaces local paths with Firebase URLs

### Image Mapping
| Menu Item | Image File | Firebase Storage Path |
|-----------|------------|----------------------|
| Kottu | chickenkottu-506x405.png | menu-images/kottu.png |
| Nasi Goreng | nasigoreng-506x405.png | menu-images/nasi-goreng.png |
| Rice & Curry | riceandcurryfish-506x405.png | menu-images/rice-curry.png |
| Biriyani | chickenbiryani-506x405.png | menu-images/biriyani.png |
| Fried Rice | chillichickenfriedrice-506x405.png | menu-images/fried-rice.png |
| Noodles | noodles-506x405.png | menu-images/noodles.png |
| Lamprais | lamprais-506x405.png | menu-images/lamprais.png |
| String Hopper Pilau | stringhopperspilau-506x405.png | menu-images/string-hopper-pilau.png |

## Troubleshooting

### Common Issues

1. **"Firebase not initialized" error**
   - Check that your `.env` file exists and has correct Firebase config
   - Verify all environment variables are set

2. **"Permission denied" error**
   - Check your Firestore security rules
   - Check your Storage security rules
   - For development, you can use test mode rules

3. **"Network error"**
   - Check your internet connection
   - Verify Firebase project is active

4. **"Image file not found" error**
   - Ensure images exist in `public/images/food/` directory
   - Check file names match the mapping

### Firestore Security Rules (Development)

For testing, you can use these permissive rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Storage Security Rules (Development)

For testing, you can use these permissive rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

**⚠️ Warning:** These rules allow full access. Use more restrictive rules for production.

## Next Steps

After uploading to Firebase, you can:

1. **Update the app** to fetch data from Firebase instead of local data
2. **Add real-time updates** when menu items change
3. **Implement admin features** for managing menu items
4. **Add user authentication** for admin access
5. **Set up proper security rules** for production
6. **Optimize images** for better performance
7. **Add image compression** for faster loading

## Support

If you encounter any issues:

1. Check the browser console for error messages
2. Verify your Firebase configuration
3. Ensure your Firestore database is enabled
4. Ensure your Firebase Storage is enabled
5. Check that your environment variables are correct
6. Verify image files exist in the correct directory

For more help, refer to the [Firebase documentation](https://firebase.google.com/docs). 