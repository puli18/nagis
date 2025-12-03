import React, { useState } from 'react';
import { FaUsers, FaCalendar, FaPhone, FaEnvelope } from 'react-icons/fa';
import { placeholderImage } from '../utils/placeholderImage';

const CateringPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    eventType: '',
    eventDate: '',
    guestCount: '',
    message: ''
  });


  const galleryImages = [
    { id: 1, src: '/images/catering-1.jpg', alt: 'Wedding catering setup' },
    { id: 2, src: '/images/catering-2.jpg', alt: 'Corporate event buffet' },
    { id: 3, src: '/images/catering-3.jpg', alt: 'Birthday celebration' },
    { id: 4, src: '/images/catering-4.jpg', alt: 'Private function room' },
    { id: 5, src: '/images/catering-5.jpg', alt: 'Catering service staff' },
    { id: 6, src: '/images/catering-6.jpg', alt: 'Food presentation' }
  ];

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement form submission
    alert('Thank you for your catering inquiry! We will contact you soon.');
    setFormData({
      name: '',
      email: '',
      phone: '',
      eventType: '',
      eventDate: '',
      guestCount: '',
      message: ''
    });
  };

  return (
    <div className="catering-page">
      {/* Hero Section */}
      <section className="section" style={{ paddingTop: '8rem', paddingBottom: '4rem' }}>
        <div className="section-title" style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h1 style={{ marginBottom: '1rem' }}>Catering Services</h1>
          <p style={{ fontSize: '18px', maxWidth: '700px', margin: '0 auto' }}>
            Let us cater your next special event with authentic Sri Lankan cuisine and professional service.
          </p>
        </div>
      </section>

      {/* Photo Gallery */}
      <section className="section">
        <div className="section-title">
          <h2>Past Catering Events</h2>
          <p>Take a look at some of our recent catering events</p>
        </div>

        <div className="d-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          {galleryImages.map((image) => (
            <div key={image.id} className="card" style={{ overflow: 'hidden' }}>
              <img
                src={image.src}
                alt={image.alt}
                style={{
                  width: '100%',
                  height: '200px',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  e.target.src = placeholderImage;
                }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Get Quote Form */}
      <section className="section-full-width" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="section-title">
          <h2>Get a Quote</h2>
          <p>Tell us about your event and we'll provide a customized quote</p>
        </div>

        <div className="d-grid get-quote-container" style={{ gridTemplateColumns: '1fr 1fr', gap: '4rem', maxWidth: '1000px', margin: '0 auto' }}>
          <div className="card p-3">
            <h3>Contact Information</h3>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Your name"
                required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid rgba(212, 175, 55, 0.3)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    marginBottom: '1rem',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)'
                  }}
              />
              
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Your email"
                required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid rgba(212, 175, 55, 0.3)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    marginBottom: '1rem',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)'
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
                    border: '2px solid rgba(212, 175, 55, 0.3)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    marginBottom: '1rem',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)'
                  }}
              />
              
              <select
                name="eventType"
                value={formData.eventType}
                onChange={handleInputChange}
                required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid rgba(212, 175, 55, 0.3)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    marginBottom: '1rem',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)'
                  }}
              >
                <option value="">Select Event Type</option>
                <option value="wedding">Wedding</option>
                <option value="corporate">Corporate Event</option>
                <option value="birthday">Birthday Party</option>
                <option value="other">Other</option>
              </select>
              
              <input
                type="date"
                name="eventDate"
                value={formData.eventDate}
                onChange={handleInputChange}
                required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid rgba(212, 175, 55, 0.3)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    marginBottom: '1rem',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)'
                  }}
              />
              
              <input
                type="number"
                name="guestCount"
                value={formData.guestCount}
                onChange={handleInputChange}
                placeholder="Number of guests"
                required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid rgba(212, 175, 55, 0.3)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    marginBottom: '1rem',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)'
                  }}
              />
              
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Tell us about your event requirements..."
                rows="4"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid rgba(212, 175, 55, 0.3)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  marginBottom: '1rem',
                  resize: 'vertical'
                }}
              />
              
              <button type="submit" className="btn btn-primary w-full">
                Get Quote
              </button>
            </form>
          </div>

          <div>
            <div className="card p-3 mb-4">
              <h3>Why Choose Our Catering?</h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li style={{ marginBottom: '1rem' }}>
                  <div className="d-flex align-center">
                    <FaUsers style={{ color: 'var(--accent-gold)', marginRight: '1rem' }} />
                    <div>
                      <strong>Professional Service</strong>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
                        Experienced staff for seamless events
                      </p>
                    </div>
                  </div>
                </li>
                <li style={{ marginBottom: '1rem' }}>
                  <div className="d-flex align-center">
                    <FaCalendar style={{ color: 'var(--accent-gold)', marginRight: '1rem' }} />
                    <div>
                      <strong>Flexible Scheduling</strong>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
                        Available for events any day of the week
                      </p>
                    </div>
                  </div>
                </li>
                <li style={{ marginBottom: '1rem' }}>
                  <div className="d-flex align-center">
                    <FaPhone style={{ color: 'var(--accent-gold)', marginRight: '1rem' }} />
                    <div>
                      <strong>Personal Consultation</strong>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
                        One-on-one planning sessions available
                      </p>
                    </div>
                  </div>
                </li>
                <li style={{ marginBottom: '1rem' }}>
                  <div className="d-flex align-center">
                    <FaEnvelope style={{ color: 'var(--accent-gold)', marginRight: '1rem' }} />
                    <div>
                      <strong>Custom Menus</strong>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
                        Tailored to your preferences and dietary needs
                      </p>
                    </div>
                  </div>
                </li>
              </ul>
            </div>

            <div className="card p-3">
              <h3>Contact Us</h3>
              <p>Ready to discuss your event? Contact us directly:</p>
              <p><strong>Phone:</strong> (08) 6252 8222</p>
              <p><strong>Mobile:</strong> 401 090 451</p>
              <p><strong>Email:</strong> info@nagisceylon.com.au</p>
              <button className="btn btn-primary w-full mt-2">
                Call Now
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default CateringPage; 