import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaStar, FaLeaf, FaBook, FaMapMarkerAlt } from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import { placeholderImage } from '../utils/placeholderImage';
import VariationSelector from '../components/VariationSelector';
import { fetchPopularItems } from '../services/menuService';

const HomePage = () => {
  const [selectedVariations, setSelectedVariations] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [featuredItems, setFeaturedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addItem } = useCart();

  // Fetch popular items from Firebase
  useEffect(() => {
    const fetchFeaturedItems = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const popularItems = await fetchPopularItems();
        setFeaturedItems(popularItems);
        
        // Initialize selectedVariations with default variations for items that have variations
        const initialVariations = {};
        popularItems.forEach(item => {
          if (item.variations && item.variations.length > 0) {
            initialVariations[item.id] = item.variations[0]; // Set first variation as default
          }
        });
        setSelectedVariations(initialVariations);
        
      } catch (err) {
        console.error('Error fetching featured items:', err);
        setError('Failed to load featured dishes. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedItems();
  }, []);

  const testimonials = [
    {
      id: 1,
      name: 'Piyum M.',
      rating: 4,
      text: 'Really impressed with the food at Nagi\'s Ceylon WA. Tried Biriyani, Chicken Noodles, Nasi Goreng, Chicken & Cheese Kottu, and Chicken Kottu - every single dish was packed with flavor and absolutely delicious. Well-prepared dishes with the right balance of spices and generous portions. Highly recommend for authentic and tasty Sri Lankan food in WA!',
      location: 'Perth'
    },
    {
      id: 2,
      name: 'Prabath S.',
      rating: 5,
      text: 'The $25 Triple Treat is a must-try! Rich, flavorful biriyani, kottu roti, and delicious fried rice. Great portions and next level taste. Nagi\'s never disappoints! Highly recommend for a proper Sri Lankan food experience.',
      location: 'Willetton'
    },
    {
      id: 3,
      name: 'Teyanee G.',
      rating: 5,
      text: 'Great hospitality! Nagi\'s hosted around 50+ guests including kids for dinner buffet for my daughter\'s 2nd birthday party. They provided the whole venue with enough time for decoration and were flexible and cooperative. Owners and staff treated us like their family members - felt like having a house party. Great place for a party (35-45 guests), food and atmosphere. Warm welcoming and pleasant hospitality.',
      location: 'Perth'
    }
  ];

  const handleVariationSelect = (itemId, variation) => {
    setSelectedVariations(prev => ({
      ...prev,
      [itemId]: variation
    }));
  };

  const handleAddToCart = (item) => {
    const variation = selectedVariations[item.id];
    const itemToAdd = variation 
      ? { ...item, name: `${item.name} - ${variation.name}`, price: variation.price }
      : item;
    addItem(itemToAdd);
  };


  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <FaStar
        key={index}
        style={{
          color: index < rating ? 'var(--accent-gold)' : 'rgba(212, 175, 55, 0.3)'
        }}
      />
    ));
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section 
        className="section hero-section-home" 
        style={{ 
          paddingTop: '8rem', 
          paddingBottom: '6rem',
          ...(isMobile && {
            backgroundImage: `url('/images/nagisceyloncatering-hero-550x440-550x440.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          })
        }}
      >
        <div className="hero-container-home" style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '4rem', 
          alignItems: 'center' 
        }}>
          <div className="hero-content" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h1>Savor the flavors of Nagi's Ceylon</h1>
            <p>
              Explore our menu with fresh, flavorful dishes that celebrate our culinary traditions. Experience authentic Sri Lankan cuisine crafted with passion and premium ingredients.
            </p>
            <div className="hero-buttons">
              <Link to="/menu" className="btn btn-primary">
                Order Now
              </Link>
              <Link to="/menu" className="btn btn-outline">
                View Menu
              </Link>
            </div>
          </div>
          <div className="hero-image-card" style={{ display: 'flex', alignItems: 'center', maxHeight: '450px' }}>
            <img
              src="/images/nagisceyloncatering-hero-550x440-550x440.jpg"
              alt="Nagi's Ceylon Restaurant"
              style={{
                width: '100%',
                height: '400px',
                objectFit: 'cover',
                borderRadius: '16px',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), 0 0 20px var(--shadow-gold)',
                border: '1px solid rgba(212, 175, 55, 0.3)'
              }}
              onError={(e) => {
                e.target.src = placeholderImage;
              }}
            />
          </div>
        </div>
      </section>

      {/* Featured Dishes Section */}
      <section className="section">
        <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
          <div>
            <h2>Menu</h2>
          </div>
          <Link to="/menu" className="btn btn-outline" style={{ marginTop: 0 }}>
            View Full Menu
          </Link>
        </div>

        {loading ? (
          <div className="text-center" style={{ minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div>
              <div className="loading-spinner"></div>
              <h3>Loading featured dishes...</h3>
              <p>Please wait while we fetch the latest menu items.</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center">
            <p style={{ color: '#dc3545' }}>{error}</p>
            <button 
              className="btn btn-primary mt-3"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div className="menu-grid">
              {featuredItems.map((item) => (
                <div key={item.id} className="menu-item card">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="menu-item-image"
                      onError={(e) => {
                        e.target.src = placeholderImage;
                      }}
                    />
                  )}
                  <div className="menu-item-content">
                    <h3 className="menu-item-title">{item.name}</h3>
                    <div className="menu-item-price">
                      ${selectedVariations[item.id] 
                        ? selectedVariations[item.id].price.toFixed(2)
                        : item.price.toFixed(2)
                      }
                    </div>
                    <p className="menu-item-description">{item.description}</p>
                    <VariationSelector
                      item={item}
                      onVariationSelect={(variation) => handleVariationSelect(item.id, variation)}
                      selectedVariation={selectedVariations[item.id]}
                    />
                    <button
                      className="btn btn-primary w-full"
                      onClick={() => handleAddToCart(item)}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-4">
              <Link to="/menu" className="btn btn-primary">
                View Full Menu
              </Link>
            </div>
          </>
        )}
      </section>

      {/* House Specials & Signature Buffets */}
      <section className="section-full-width" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="section-title">
          <h2>House Specials & Signature Buffets</h2>
          <p>
            Experience our most popular specials and buffet events, perfect for sharing with family and friends.
          </p>
        </div>

        <div className="d-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          {/* Chef's Special Mix Grill */}
          <div className="card p-4" style={{ display: 'flex', flexDirection: 'column', minHeight: '350px' }}>
            <div className="mb-4">
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontFamily: "'Playfair Display', serif", fontSize: '24px' }}>Chef's Special Mix Grill</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent-gold)', marginBottom: '0.5rem', fontFamily: "'Inter', sans-serif" }}>$150</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Shared Platter</div>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(212, 175, 55, 0.2)', color: 'var(--text-secondary)' }}>Fried rice</li>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(212, 175, 55, 0.2)', color: 'var(--text-secondary)' }}>Chicken Maryland</li>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(212, 175, 55, 0.2)', color: 'var(--text-secondary)' }}>Sausages/Fried Eggs</li>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(212, 175, 55, 0.2)', color: 'var(--text-secondary)' }}>Crabs/Cuttlefish</li>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(212, 175, 55, 0.2)', color: 'var(--text-secondary)' }}>Prawns/Mussels</li>
              <li style={{ padding: '0.5rem 0', color: 'var(--text-secondary)' }}>Tomato/Cucumber</li>
            </ul>
          </div>

          {/* Friday Hopper Night Buffet */}
          <div className="card p-4" style={{ display: 'flex', flexDirection: 'column', minHeight: '350px' }}>
            <div className="mb-4">
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontFamily: "'Playfair Display', serif", fontSize: '24px' }}>Friday Hopper Night Buffet</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent-gold)', marginBottom: '0.5rem', fontFamily: "'Inter', sans-serif" }}>$35</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Per Person</div>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(212, 175, 55, 0.2)', color: 'var(--text-secondary)' }}>Egg & Plain hoppers</li>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(212, 175, 55, 0.2)', color: 'var(--text-secondary)' }}>Kottu & Fried Rice</li>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(212, 175, 55, 0.2)', color: 'var(--text-secondary)' }}>Chicken & Fish Curry</li>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(212, 175, 55, 0.2)', color: 'var(--text-secondary)' }}>Dhal or Potato Curry</li>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(212, 175, 55, 0.2)', color: 'var(--text-secondary)' }}>Lunumiris/PolSambol</li>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(212, 175, 55, 0.2)', color: 'var(--text-secondary)' }}>Caramelized Onions</li>
              <li style={{ padding: '0.5rem 0', color: 'var(--text-secondary)' }}>Dessert</li>
            </ul>
          </div>

          {/* Weekend Lunch Buffet */}
          <div className="card p-4" style={{ display: 'flex', flexDirection: 'column', minHeight: '350px' }}>
            <div className="mb-4">
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontFamily: "'Playfair Display', serif", fontSize: '24px' }}>Weekend Lunch Buffet</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent-gold)', marginBottom: '0.5rem', fontFamily: "'Inter', sans-serif" }}>$28</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Per Person</div>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(212, 175, 55, 0.2)', color: 'var(--text-secondary)' }}>Rice - Yellow/White/Red</li>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(212, 175, 55, 0.2)', color: 'var(--text-secondary)' }}>Chicken/ Fish Curry</li>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(212, 175, 55, 0.2)', color: 'var(--text-secondary)' }}>Dhal/Potato Curry</li>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(212, 175, 55, 0.2)', color: 'var(--text-secondary)' }}>Veggies</li>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(212, 175, 55, 0.2)', color: 'var(--text-secondary)' }}>Papadam</li>
              <li style={{ padding: '0.5rem 0', color: 'var(--text-secondary)' }}>Dessert</li>
            </ul>
          </div>

          {/* Weekday Lunch Buffet */}
          <div className="card p-4" style={{ display: 'flex', flexDirection: 'column', minHeight: '350px' }}>
            <div className="mb-4">
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontFamily: "'Playfair Display', serif", fontSize: '24px' }}>Weekday Lunch Buffet</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent-gold)', marginBottom: '0.5rem', fontFamily: "'Inter', sans-serif" }}>$23</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Per Person</div>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(212, 175, 55, 0.2)', color: 'var(--text-secondary)' }}>Rice - White/Red</li>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(212, 175, 55, 0.2)', color: 'var(--text-secondary)' }}>Chicken/Fish Curry</li>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(212, 175, 55, 0.2)', color: 'var(--text-secondary)' }}>Dhal Curry</li>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(212, 175, 55, 0.2)', color: 'var(--text-secondary)' }}>Veggies</li>
              <li style={{ padding: '0.5rem 0', color: 'var(--text-secondary)' }}>Papadam</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="section-full-width" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="section-title">
          <h2>Why Choose Nagi's Ceylon</h2>
        </div>

        <div className="d-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
          <div className="card p-3 text-center">
            <div className="mb-2">
              <div style={{ 
                width: '70px', 
                height: '70px', 
                borderRadius: '50%', 
                backgroundColor: 'var(--bg-card)', 
                border: '2px solid var(--accent-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                fontSize: '1.8rem',
                color: 'var(--accent-gold)',
                boxShadow: '0 4px 15px var(--shadow-gold)'
              }}>
                <FaLeaf />
              </div>
            </div>
            <h3 style={{ color: 'var(--text-primary)', fontFamily: "'Playfair Display', serif" }}>Fresh Daily</h3>
            <p style={{ color: 'var(--text-secondary)' }}>All dishes prepared fresh daily with locally sourced ingredients.</p>
          </div>

          <div className="card p-3 text-center">
            <div className="mb-2">
              <div style={{ 
                width: '70px', 
                height: '70px', 
                borderRadius: '50%', 
                backgroundColor: 'var(--bg-card)', 
                border: '2px solid var(--accent-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                fontSize: '1.8rem',
                color: 'var(--accent-gold)',
                boxShadow: '0 4px 15px var(--shadow-gold)'
              }}>
                <FaBook />
              </div>
            </div>
            <h3 style={{ color: 'var(--text-primary)', fontFamily: "'Playfair Display', serif" }}>Authentic Recipes</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Traditional family recipes from Sri Lanka passed down through generations.</p>
          </div>

          <div className="card p-3 text-center">
            <div className="mb-2">
              <div style={{ 
                width: '70px', 
                height: '70px', 
                borderRadius: '50%', 
                backgroundColor: 'var(--bg-card)', 
                border: '2px solid var(--accent-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                fontSize: '1.8rem',
                color: 'var(--accent-gold)',
                boxShadow: '0 4px 15px var(--shadow-gold)'
              }}>
                <FaMapMarkerAlt />
              </div>
            </div>
            <h3 style={{ color: 'var(--text-primary)', fontFamily: "'Playfair Display', serif" }}>Perth Local</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Proudly serving the Perth community with authentic Sri Lankan flavors.</p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="section">
        <div className="section-title">
          <h2>What Our Customers Say</h2>
        </div>

        <div className="d-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="card p-3">
              <div className="d-flex align-center mb-2">
                {renderStars(testimonial.rating)}
              </div>
              <p className="mb-2">{testimonial.text}</p>
              <div className="d-flex align-center">
                <strong>{testimonial.name}</strong>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

export default HomePage; 