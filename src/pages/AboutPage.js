import React from 'react';
import { FaUser, FaUserTie, FaUsers } from 'react-icons/fa';
import { placeholderImage } from '../utils/placeholderImage';

const AboutPage = () => {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="section" style={{ paddingTop: '8rem', paddingBottom: '4rem' }}>
        <div className="section-title" style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h1 style={{ marginBottom: '1rem' }}>About Nagi's Ceylon</h1>
          <p style={{ fontSize: '18px', maxWidth: '700px', margin: '0 auto' }}>
            Bringing the authentic taste of Sri Lanka to Perth, one dish at a time.
          </p>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="section">
        <div className="our-story-container d-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
          <div className="our-story-logo">
            <img
              src="/images/Logo.png"
              alt="Nagi's Ceylon Logo"
              style={{
                width: '100%',
                height: '400px',
                objectFit: 'contain',
                borderRadius: '15px',
                backgroundColor: 'var(--bg-card)',
                padding: '2rem'
              }}
              onError={(e) => {
                e.target.src = placeholderImage;
              }}
            />
          </div>
          <div className="our-story-text">
            <h2>Our Story</h2>
            <p>
              Nestled in the vibrant culinary landscape of Perth, Nagi's Ceylon stands as a testament to the passion and dedication of its founders, Nagina and Mahesh. Born and raised in Sri Lanka, Nagina and Mahesh grew up surrounded by the tantalizing aromas and bold spices that define Ceylonese cooking.
            </p>
            <p>
              For Nagi and Mahesh, Nagi's Ceylon is more than just a restaurant—it's a celebration of diversity and cultural exchange. By infusing their dishes with the exotic spices that are synonymous with Sri Lankan cuisine, they hope to transport diners on a sensory journey to the Pearl of the Indian Ocean.
            </p>
            <p>
              From aromatic curries infused with cinnamon, cloves, and cardamom to mouthwatering seafood dishes seasoned with turmeric and fenugreek, each recipe is a symphony of spices that dance on the palate and awaken the senses.
            </p>
          </div>
        </div>
      </section>

      {/* Our Mission Section */}
      <section className="section-full-width" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="section-title">
          <h2>Our Mission</h2>
          <p>
            To provide Perth with an authentic Sri Lankan dining experience while preserving and celebrating 
            our rich culinary heritage.
          </p>
        </div>
      </section>

      {/* Key Pillars Section */}
      <section className="section">
        <div className="d-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <div className="card p-3 text-center">
            <div className="mb-2">
              <div style={{ 
                width: '60px', 
                height: '60px', 
                borderRadius: '50%', 
                backgroundColor: 'rgba(212, 175, 55, 0.15)', 
                border: '2px solid var(--accent-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                fontSize: '1.5rem',
                color: 'var(--accent-gold)'
              }}>
                ✓
              </div>
            </div>
            <h3>Authenticity</h3>
            <p>
              We use traditional recipes and cooking methods to ensure every dish reflects the true taste of Sri Lanka.
            </p>
          </div>

          <div className="card p-3 text-center">
            <div className="mb-2">
              <div style={{ 
                width: '60px', 
                height: '60px', 
                borderRadius: '50%', 
                backgroundColor: 'rgba(212, 175, 55, 0.15)', 
                border: '2px solid var(--accent-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                fontSize: '1.5rem',
                color: 'var(--accent-gold)'
              }}>
                👥
              </div>
            </div>
            <h3>Community</h3>
            <p>
              Building connections within the Perth community and introducing new friends to Sri Lankan culture through food.
            </p>
          </div>

          <div className="card p-3 text-center">
            <div className="mb-2">
              <div style={{ 
                width: '60px', 
                height: '60px', 
                borderRadius: '50%', 
                backgroundColor: 'rgba(212, 175, 55, 0.15)', 
                border: '2px solid var(--accent-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                fontSize: '1.5rem',
                color: 'var(--accent-gold)'
              }}>
                ✓
              </div>
            </div>
            <h3>Quality</h3>
            <p>
              Using only the finest ingredients and spices, sourced both locally and from Sri Lanka, 
              to create exceptional dining experiences.
            </p>
          </div>
        </div>
      </section>

      {/* Meet Our Team Section */}
      <section className="section-full-width" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="section-title">
          <h2>Meet Our Team</h2>
          <p>
            The passionate people behind Nagi's Ceylon, dedicated to bringing you authentic Sri Lankan flavors.
          </p>
        </div>

        <div className="d-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <div className="card p-3 text-center">
            <div
              aria-hidden="true"
              style={{
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                backgroundColor: 'rgba(212, 175, 55, 0.15)',
                border: '2px solid var(--accent-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                fontSize: '3rem',
                color: 'var(--accent-gold)'
              }}
            >
              <FaUser />
            </div>
            <h3>Nagina</h3>
            <p style={{ color: 'var(--accent-gold)', fontWeight: '600' }}>Founder & Head Chef</p>
            <p>
              The heart and soul of Nagi's Ceylon, Nagina brings over 30 years of culinary expertise 
              and a deep passion for authentic Sri Lankan cuisine. Her traditional recipes and cooking 
              methods ensure every dish tells a story of heritage and love.
            </p>
          </div>

          <div className="card p-3 text-center">
            <div
              aria-hidden="true"
              style={{
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                backgroundColor: 'rgba(212, 175, 55, 0.15)',
                border: '2px solid var(--accent-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                fontSize: '3rem',
                color: 'var(--accent-gold)'
              }}
            >
              <FaUserTie />
            </div>
            <h3>Mahesh</h3>
            <p style={{ color: 'var(--accent-gold)', fontWeight: '600' }}>Co-Founder & Operations Manager</p>
            <p>
              Mahesh oversees the day-to-day operations and ensures that every aspect of our service 
              meets the highest standards. His commitment to excellence and customer satisfaction 
              drives our continued success.
            </p>
          </div>

          <div className="card p-3 text-center">
            <div
              aria-hidden="true"
              style={{
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                backgroundColor: 'rgba(212, 175, 55, 0.15)',
                border: '2px solid var(--accent-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                fontSize: '3rem',
                color: 'var(--accent-gold)'
              }}
            >
              <FaUsers />
            </div>
            <h3>Our Kitchen Team</h3>
            <p style={{ color: 'var(--accent-gold)', fontWeight: '600' }}>Dedicated Chefs</p>
            <p>
              Our talented team of chefs work together to bring you the most authentic Sri Lankan 
              flavors. Each member brings their unique skills and passion to create memorable dining experiences.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="section">
        <div className="section-title">
          <h2>Our Values</h2>
        </div>

        <div className="d-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
          <div className="text-center p-3">
            <h3>Family Tradition</h3>
            <p>Every recipe tells a story of our family's journey and cultural heritage.</p>
          </div>
          <div className="text-center p-3">
            <h3>Fresh Ingredients</h3>
            <p>We source the finest ingredients to ensure authentic flavors and quality.</p>
          </div>
          <div className="text-center p-3">
            <h3>Community Focus</h3>
            <p>Building lasting relationships with our customers and the Perth community.</p>
          </div>
          <div className="text-center p-3">
            <h3>Sustainability</h3>
            <p>Committed to environmentally responsible practices in our operations.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage; 