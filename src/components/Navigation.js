import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaShoppingCart, FaBars, FaTimes } from 'react-icons/fa';
import { useCart } from '../context/CartContext';

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toggleCart, getTotalItems } = useCart();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const toggleMobileMenu = () => {
    const newState = !isMobileMenuOpen;
    setIsMobileMenuOpen(newState);
    
    // Add/remove class to body for CSS targeting
    if (newState) {
      document.body.classList.add('mobile-nav-open');
    } else {
      document.body.classList.remove('mobile-nav-open');
    }
  };

  // Cleanup effect to remove class when component unmounts
  useEffect(() => {
    return () => {
      document.body.classList.remove('mobile-nav-open');
    };
  }, []);

  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/" className="logo">
          <img 
            src="/images/text_logo.png" 
            alt="Nagi's Ceylon" 
            style={{ 
              height: '32px', 
              width: 'auto',
              objectFit: 'contain'
            }}
          />
        </Link>

        <ul className="nav-links">
          <li>
            <Link to="/" className={isActive('/') ? 'active' : ''}>
              Home
            </Link>
          </li>
          <li>
            <Link to="/menu" className={isActive('/menu') ? 'active' : ''}>
              Menu
            </Link>
          </li>
          <li>
            <Link to="/about" className={isActive('/about') ? 'active' : ''}>
              About
            </Link>
          </li>
          <li>
            <Link to="/catering" className={isActive('/catering') ? 'active' : ''}>
              Catering
            </Link>
          </li>
          <li>
            <Link to="/gallery" className={isActive('/gallery') ? 'active' : ''}>
              Gallery
            </Link>
          </li>
          <li>
            <Link to="/contact" className={isActive('/contact') ? 'active' : ''}>
              Contact
            </Link>
          </li>
        </ul>

        <div className={`mobile-nav ${isMobileMenuOpen ? 'open' : ''}`}>
          <div className="mobile-nav-header">
            <h3>Menu</h3>
            <button className="mobile-nav-close" onClick={toggleMobileMenu}>
              <FaTimes />
            </button>
          </div>
          <ul className="nav-links">
            <li>
              <Link to="/" className={isActive('/') ? 'active' : ''} onClick={() => {
                setIsMobileMenuOpen(false);
                document.body.classList.remove('mobile-nav-open');
              }}>
                Home
              </Link>
            </li>
            <li>
              <Link to="/menu" className={isActive('/menu') ? 'active' : ''} onClick={() => {
                setIsMobileMenuOpen(false);
                document.body.classList.remove('mobile-nav-open');
              }}>
                Menu
              </Link>
            </li>
            <li>
              <Link to="/about" className={isActive('/about') ? 'active' : ''} onClick={() => {
                setIsMobileMenuOpen(false);
                document.body.classList.remove('mobile-nav-open');
              }}>
                About
              </Link>
            </li>
            <li>
              <Link to="/catering" className={isActive('/catering') ? 'active' : ''} onClick={() => {
                setIsMobileMenuOpen(false);
                document.body.classList.remove('mobile-nav-open');
              }}>
                Catering
              </Link>
            </li>
            <li>
              <Link to="/gallery" className={isActive('/gallery') ? 'active' : ''} onClick={() => {
                setIsMobileMenuOpen(false);
                document.body.classList.remove('mobile-nav-open');
              }}>
                Gallery
              </Link>
            </li>
            <li>
              <Link to="/contact" className={isActive('/contact') ? 'active' : ''} onClick={() => {
                setIsMobileMenuOpen(false);
                document.body.classList.remove('mobile-nav-open');
              }}>
                Contact
              </Link>
            </li>
          </ul>
        </div>

        <div className="d-flex align-center">
          <div className="cart-icon" onClick={toggleCart}>
            <FaShoppingCart />
            {getTotalItems() > 0 && (
              <span className="cart-count">{getTotalItems()}</span>
            )}
          </div>

          <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
            {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 