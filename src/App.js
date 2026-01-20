import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { BusinessHoursProvider } from './context/BusinessHoursContext';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import BusinessHoursBanner from './components/BusinessHoursBanner';
import HomePage from './pages/HomePage';
import MenuPage from './pages/MenuPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import CateringPage from './pages/CateringPage';
import GalleryPage from './pages/GalleryPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import AdminPage from './pages/AdminPage';
import RestaurantDashboard from './pages/RestaurantDashboard';
import CartSidebar from './components/CartSidebar';
import './App.css';

const AppLayout = ({ children }) => {
  return (
    <div className="App">
      <BusinessHoursBanner />
      <Navigation />
      <main className="main-content">
        {children}
      </main>
      <Footer />
      <CartSidebar />
    </div>
  );
};

function App() {
  return (
    <CartProvider>
      <BusinessHoursProvider>
        <Router>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<AppLayout><HomePage /></AppLayout>} />
            <Route path="/menu" element={<AppLayout><MenuPage /></AppLayout>} />
            <Route path="/about" element={<AppLayout><AboutPage /></AppLayout>} />
            <Route path="/contact" element={<AppLayout><ContactPage /></AppLayout>} />
            <Route path="/catering" element={<AppLayout><CateringPage /></AppLayout>} />
            <Route path="/gallery" element={<AppLayout><GalleryPage /></AppLayout>} />
            <Route path="/cart" element={<AppLayout><CartPage /></AppLayout>} />
            <Route path="/checkout" element={<AppLayout><CheckoutPage /></AppLayout>} />
            <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/dashboard" element={<RestaurantDashboard />} />
          </Routes>
        </Router>
      </BusinessHoursProvider>
    </CartProvider>
  );
}

export default App;
