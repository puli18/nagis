import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FaMapMarkerAlt, FaPhone, FaClock, FaInfoCircle } from 'react-icons/fa';

const ContactPage = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  // Restaurant coordinates
  const restaurantLocation = useMemo(() => ({
    lat: -32.0089, // Willetton, WA coordinates
    lng: 115.8867,
    address: '1A Whyalla St, Willetton, WA 6155, Australia'
  }), []);

  // Initialize Google Maps
  useEffect(() => {
    const loadGoogleMaps = () => {
      // Check if Google Maps is already loaded
      if (window.google && window.google.maps) {
        initializeMap();
        return;
      }

      // Load Google Maps script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        // Add a small delay to ensure Google Maps is fully loaded
        setTimeout(initializeMap, 100);
      };
      script.onerror = () => {
        console.error('Failed to load Google Maps API');
      };
      document.head.appendChild(script);
    };

    const initializeMap = () => {
      if (!mapRef.current || !window.google || !window.google.maps) {
        console.error('Google Maps not available');
        return;
      }

      try {
        const mapInstance = new window.google.maps.Map(mapRef.current, {
          center: restaurantLocation,
          zoom: 15,
          mapTypeId: window.google.maps.MapTypeId.ROADMAP,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        });

        // Add marker for restaurant
        const marker = new window.google.maps.Marker({
          position: restaurantLocation,
          map: mapInstance,
          title: "Nagi's Ceylon Catering",
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="16" fill="var(--accent-gold)"/>
                <path d="M16 8c-4.4 0-8 3.6-8 8 0 6 8 12 8 12s8-6 8-12c0-4.4-3.6-8-8-8zm0 12c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z" fill="white"/>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(32, 32),
            anchor: new window.google.maps.Point(16, 32)
          }
        });

        // Add info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 10px; max-width: 200px;">
              <h3 style="margin: 0 0 5px 0; color: var(--accent-gold); font-size: 14px;">Nagi's Ceylon Catering</h3>
              <p style="margin: 0; font-size: 12px; color: #666;">${restaurantLocation.address}</p>
            </div>
          `
        });

        // Add click listener to marker
        marker.addListener('click', () => {
          infoWindow.open(mapInstance, marker);
        });

        setMap(mapInstance);
      } catch (error) {
        console.error('Error initializing Google Maps:', error);
      }
    };

    // Only load if API key is available
    if (process.env.REACT_APP_GOOGLE_MAPS_API_KEY) {
      loadGoogleMaps();
    }

    // Cleanup
    return () => {
      if (map) {
        // Clean up map instance if needed
      }
    };
  }, [map, restaurantLocation]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement form submission
    alert('Thank you for your message! We will get back to you soon.');
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    });
  };

  const handleCallNow = () => {
    window.open('tel:+61862528222', '_self');
  };

  const handleSendEmail = () => {
    window.open('mailto:info@nagisceylon.com.au?subject=Inquiry from Nagi\'s Ceylon Catering', '_self');
  };

  const handleViewOnGoogleMaps = () => {
    const address = '1A Whyalla St, Willetton, WA 6155, Australia';
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  return (
    <div className="contact-page">
      {/* Hero Section */}
      <section className="section" style={{ paddingTop: '8rem', paddingBottom: '4rem' }}>
        <div className="section-title" style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h1 style={{ marginBottom: '1rem' }}>Contact Us</h1>
          <p style={{ fontSize: '18px', maxWidth: '700px', margin: '0 auto' }}>
            Get in touch with us for reservations, catering, or any questions about our authentic Sri Lankan cuisine.
          </p>
        </div>
      </section>

      {/* Contact Information and Form */}
      <section className="section">
        <div className="d-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '4rem' }}>
          {/* Left Column - Contact Information */}
          <div>
            {/* Location */}
            <div className="card p-3 mb-4">
              <div className="d-flex align-center mb-2">
                <FaMapMarkerAlt style={{ color: 'var(--accent-gold)', marginRight: '1rem', fontSize: '1.5rem' }} />
                <h3>Location</h3>
              </div>
              <p>1A Whyalla St, Willetton, WA 6155, Perth, Australia</p>
              <button 
                className="btn btn-secondary mt-2"
                onClick={handleViewOnGoogleMaps}
              >
                View on Google Maps
              </button>
            </div>

            {/* Phone & Email */}
            <div className="card p-3 mb-4">
              <div className="d-flex align-center mb-2">
                <FaPhone style={{ color: 'var(--accent-gold)', marginRight: '1rem', fontSize: '1.5rem' }} />
                <h3>Phone & Email</h3>
              </div>
              <p>Phone: (08) 6252 8222</p>
              <p>Mobile: 401 090 451</p>
              <p>Email: info@nagisceylon.com.au</p>
              <p>Orders: orders@nagisceylon.com.au</p>
              <div className="d-flex gap-2 mt-2">
                <button 
                  className="btn btn-primary"
                  onClick={handleCallNow}
                >
                  Call Now
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={handleSendEmail}
                >
                  Send Email
                </button>
              </div>
            </div>

            {/* Opening Hours */}
            <div className="card p-3 mb-4">
              <div className="d-flex align-center mb-2">
                <FaClock style={{ color: 'var(--accent-gold)', marginRight: '1rem', fontSize: '1.5rem' }} />
                <h3>Opening Hours</h3>
              </div>
              <p>
                <strong>Wednesday - Monday</strong>
                <br />
                10:30 AM - 8:00 PM
              </p>
              <p>
                <strong>Tuesday</strong>
                <br />
                Closed
              </p>
              <p style={{ color: 'var(--accent-gold)', fontWeight: '600' }}>
                Lunch service available Friday - Sunday: 12:00 PM - 3:00 PM
              </p>
            </div>

            {/* Services */}
            <div className="card p-3">
              <div className="d-flex align-center mb-2">
                <FaInfoCircle style={{ color: 'var(--accent-gold)', marginRight: '1rem', fontSize: '1.5rem' }} />
                <h3>Services</h3>
              </div>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li style={{ marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--accent-gold)', marginRight: '0.5rem' }}>•</span>
                  Dine-in Restaurant
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--accent-gold)', marginRight: '0.5rem' }}>•</span>
                  Takeaway Orders
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--accent-gold)', marginRight: '0.5rem' }}>•</span>
                  Delivery Service (within 10km)
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--accent-gold)', marginRight: '0.5rem' }}>•</span>
                  Catering for Events
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--accent-gold)', marginRight: '0.5rem' }}>•</span>
                  Private Function Room
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column - Contact Form and Map */}
          <div>
            {/* Contact Form */}
            <div className="card p-3 mb-4">
              <h3>Send us a Message</h3>
              <p>Have a question or want to make a reservation? We'd love to hear from you!</p>
              
              <form onSubmit={handleSubmit}>
                <div className="d-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Your first name"
                    required
                    style={{
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Your last name"
                    required
                    style={{
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your.email@example.com"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    marginBottom: '1rem'
                  }}
                />
                
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Your phone number"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    marginBottom: '1rem'
                  }}
                />
                
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="What is this regarding?"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    marginBottom: '1rem'
                  }}
                />
                
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Tell us how we can help you....."
                  required
                  rows="5"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    marginBottom: '1rem',
                    resize: 'vertical'
                  }}
                />
                
                <button type="submit" className="btn btn-primary w-full">
                  Send Message
                </button>
              </form>
            </div>

            {/* Interactive Google Map */}
            <div className="card p-3">
              <h3>Find Us</h3>
              <div 
                ref={mapRef}
                style={{
                  width: '100%',
                  height: '300px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  overflow: 'hidden'
                }}
              >
                {/* Map will be rendered here */}
                {!process.env.REACT_APP_GOOGLE_MAPS_API_KEY && (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#f8f9fa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    border: '2px dashed #ddd'
                  }}>
                    <FaMapMarkerAlt style={{ fontSize: '3rem', color: 'var(--accent-gold)', marginBottom: '1rem' }} />
                    <p style={{ textAlign: 'center', color: '#666' }}>
                      Interactive Map
                    </p>
                    <p style={{ textAlign: 'center', color: '#666' }}>
                      1A Whyalla St, Willetton
                    </p>
                    <p style={{ textAlign: 'center', color: 'var(--accent-gold)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                      Click to open in Google Maps
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default ContactPage; 