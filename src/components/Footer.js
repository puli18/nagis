import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaInstagram, FaTwitter } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>Nagi's Ceylon</h3>
          <p>
            Authentic Sri Lankan cuisine in the heart of Perth. Experience the vibrant flavors of Ceylon.
          </p>
          <div className="social-links">
            <a href="https://www.facebook.com/nagifoods" target="_blank" rel="noopener noreferrer">
              <FaFacebook />
            </a>
            <a href="https://www.instagram.com/nagis_ceylon_restaurent" target="_blank" rel="noopener noreferrer">
              <FaInstagram />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
              <FaTwitter />
            </a>
          </div>
        </div>

        <div className="footer-section">
          <h3>Quick Links</h3>
          <Link to="/">Home</Link>
          <Link to="/menu">Menu</Link>
          <Link to="/about">About Us</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/catering">Catering</Link>
        </div>

        <div className="footer-section">
          <h3>Contact</h3>
          <p>1A Whyalla St, Willetton, WA 6155</p>
          <p>Phone: (08) 6252 8222</p>
          <p>Mobile: 401 090 451</p>
          <p>Email: info@nagisceylon.com.au</p>
        </div>

        <div className="footer-section">
          <h3>Opening Hours</h3>
          <p>Mon-Tue: 10:30 AM - 8:00 PM</p>
          <p>Wednesday: Closed</p>
          <p>Thu: 10:30 AM - 8:00 PM</p>
          <p>Fri: 10:30 AM - 8:00 PM</p>
          <p>Sat-Sun: 10:00 AM - 8:00 PM</p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2025 Nagi's Ceylon Catering. All rights reserved. | Perth, Western Australia</p>
      </div>
    </footer>
  );
};

export default Footer; 