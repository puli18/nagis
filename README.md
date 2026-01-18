# Nagi's Ceylon Catering Website

A modern, mobile-responsive website for Nagi's Ceylon Catering, a Sri Lankan restaurant and catering business located in Willetton, Perth, Western Australia.

**Last Deployment**: August 10, 2025 - Fixed submodule issues for Cloudflare deployment

## Features

### 🏠 Pages
- **Home Page**: Hero banner, featured dishes, testimonials, newsletter signup
- **Menu Page**: Categorized menu items with dietary tags and add-to-cart functionality
- **About Us Page**: Brand story, team information, and company values
- **Contact Page**: Contact form, business information, and embedded map
- **Catering Page**: Catering packages, quote form, and photo gallery
- **Gallery Page**: Full-width grid layout with clickable images
- **Cart Page**: Order summary with quantity controls and checkout

### 🛒 E-commerce Features
- **Shopping Cart**: Persistent cart with localStorage
- **Service Fee**: 5% service fee automatically calculated (capped at $3)
- **Quantity Controls**: Add/remove items and update quantities
- **Order Summary**: Subtotal, service fee, and total breakdown
- **Checkout Page**: Complete order form with customer information
- **Stripe Integration**: Split payment processing between restaurant and platform owner
- **Payment Processing**: Embedded Stripe Elements for secure card payments

### 📱 Responsive Design
- **Mobile-First**: Optimized for all screen sizes
- **Touch-Friendly**: Large buttons and easy navigation
- **Fast Loading**: Optimized images and efficient code

### 🎨 Design Features
- **Modern UI**: Clean, elegant design with orange accent color
- **Typography**: Playfair Display for headings, Inter for body text
- **Animations**: Smooth transitions and hover effects
- **Accessibility**: Proper contrast ratios and semantic HTML

## Technology Stack

- **Frontend**: React 19.1.1
- **Routing**: React Router DOM
- **Styling**: CSS3 with custom design system
- **Icons**: React Icons (Font Awesome)
- **State Management**: React Context API
- **Payment**: Stripe with Connect platform for split payments
- **Backend**: Firebase Functions (Cloud Functions)
- **Database**: Firebase Realtime Database

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd project-nagis
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Firebase Functions Setup

The backend uses Firebase Functions for payment processing. To set up:

1. **Install Firebase CLI** (if not already installed)
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Navigate to functions directory**
   ```bash
   cd firebase/functions
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Deploy functions**
   ```bash
   firebase deploy --only functions
   ```

For more details, see [FIREBASE_FUNCTIONS_SETUP.md](./FIREBASE_FUNCTIONS_SETUP.md)

### Environment Variables

Create a `.env` file in the root directory:

```env
REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_firebase_app_id
REACT_APP_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.asia-southeast1.firebasedatabase.app
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

**Note:** The Google Maps API key is required for the interactive map on the contact page. You can get one from the [Google Cloud Console](https://console.cloud.google.com/).

**Note:** The Firebase Realtime Database URL is required for the restaurant dashboard order management. For the asia-southeast1 region, use the format: `https://your_project_id-default-rtdb.asia-southeast1.firebasedatabase.app`. You can find this in your Firebase project settings under Realtime Database.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Navigation.js   # Header navigation
│   ├── Footer.js       # Footer component
│   └── CartSidebar.js  # Shopping cart sidebar
├── pages/              # Page components
│   ├── HomePage.js     # Home page
│   ├── MenuPage.js     # Menu page
│   ├── AboutPage.js    # About us page
│   ├── ContactPage.js  # Contact page
│   ├── CateringPage.js # Catering page
│   ├── GalleryPage.js  # Gallery page
│   ├── CartPage.js     # Cart page
│   └── CheckoutPage.js # Checkout page
├── context/            # React Context
│   └── CartContext.js  # Shopping cart state management
├── data/               # Static data
│   └── menuData.js     # Menu items and categories
├── utils/              # Utility functions
│   └── placeholderImage.js # Placeholder image utility
└── App.js              # Main app component
```

## Business Information

### Restaurant Details
- **Name**: Nagi's Ceylon Catering
- **Location**: 1A Whyalla St, Willetton, WA 6155
- **Phone**: (08) 6252 8222 / 401 090 451
- **Email**: info@nagisceylon.com.au
- **Hours**: 
  - Mon-Fri: 10:30 AM - 8:00 PM
  - Sat-Sun: 10:00 AM - 8:00 PM
  - Lunch: Fri-Sun 12:00 PM - 3:00 PM

### Services
- Dine-in restaurant
- Takeaway orders
- Delivery service (within 10km)
- Catering for events
- Private function room

## Customization

### Colors
The website uses a consistent color scheme:
- **Primary Orange**: #ff6b35
- **Dark Blue**: #2c3e50
- **Light Gray**: #f8f9fa
- **Text Gray**: #666

### Menu Items
Edit `src/data/menuData.js` to update menu items, prices, and categories.

### Business Information
Update business details in:
- `src/components/Footer.js`
- `src/pages/ContactPage.js`
- `public/index.html`

## Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Netlify
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `build`

### Deploy to Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`

## Future Enhancements

### Payment Integration
1. Set up Stripe account and Connect platform
2. Configure environment variables in Firebase Functions
3. Deploy Firebase Functions: `cd firebase && firebase deploy --only functions`
4. Configure Stripe webhook endpoint
5. Test with Stripe test cards

### Firebase Integration
1. Set up Firebase project (already configured)
2. Add environment variables
3. Implement order management and user accounts

### Additional Features
- User accounts and order history
- Real-time order tracking
- SMS notifications
- Advanced filtering and search
- Multi-language support
- SEO optimization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, contact:
- Email: info@nagisceylon.com.au
- Phone: (08) 6252 8222
