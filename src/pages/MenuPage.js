import React, { useState, useEffect } from 'react';
import { FaPlus } from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import { placeholderImage } from '../utils/placeholderImage';
import VariationSelector from '../components/VariationSelector';
import { fetchMenuItems, fetchCategories } from '../services/menuService';

const MenuPage = () => {
  const { addItem } = useCart();
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVariations, setSelectedVariations] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('');

  // Fetch menu data from Firebase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [itemsData, categoriesData] = await Promise.all([
          fetchMenuItems(),
          fetchCategories()
        ]);
        
        setMenuItems(itemsData);
        setCategories(categoriesData);
        
        // Initialize selectedVariations with default variations for items that have variations
        const initialVariations = {};
        itemsData.forEach(item => {
          if (item.variations && item.variations.length > 0) {
            initialVariations[item.id] = item.variations[0]; // Set first variation as default
          }
        });
        setSelectedVariations(initialVariations);
        
      } catch (err) {
        console.error('Error fetching menu data:', err);
        setError('Failed to load menu items. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  const scrollToCategory = (categoryId) => {
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      // Calculate the total offset needed
      const navigationHeight = 70; // Navigation header height
      const categoryFilterHeight = 60; // Category filter height
      const sectionTitleHeight = 80; // Section title height
      const totalOffset = navigationHeight + categoryFilterHeight + sectionTitleHeight;
      
      const elementPosition = element.offsetTop;
      const offsetPosition = elementPosition - totalOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Handle scroll events for sticky category bar
  useEffect(() => {
    const handleScroll = () => {
      const categoryBar = document.querySelector('.menu-page .sticky-category-bar');
      const heroSection = document.querySelector('.menu-page .section');
      
      if (categoryBar && heroSection) {
        const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Only make it fixed when we've scrolled past the hero section
        if (scrollTop > heroBottom - 70) { // 70px is the header height
          categoryBar.classList.add('fixed');
        } else {
          categoryBar.classList.remove('fixed');
        }
      }
    };

    // Add scroll event listener with passive option for better performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Call once on mount to set initial state
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getItemsByCategory = (categoryId) => {
    return menuItems.filter(item => item.category === categoryId);
  };

  if (loading) {
    return (
      <div className="menu-page">
        <div className="section" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="text-center">
            <div className="loading-spinner"></div>
            <h2>Loading Menu...</h2>
            <p>Please wait while we fetch the latest menu items.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="menu-page">
        <div className="section">
          <div className="text-center">
            <h2>Error Loading Menu</h2>
            <p style={{ color: '#dc3545' }}>{error}</p>
            <button 
              className="btn btn-primary mt-3"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="menu-page">
      {/* Hero Section */}
      <section className="section" style={{ paddingTop: '8rem', paddingBottom: '4rem' }}>
        <div className="section-title" style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h1 style={{ marginBottom: '1rem' }}>Our Menu</h1>
          <p style={{ fontSize: '18px', maxWidth: '700px', margin: '0 auto' }}>
            Explore our authentic Sri Lankan dishes, made with traditional recipes and the finest spices. Each dish tells a story of our rich culinary heritage.
          </p>
        </div>
      </section>

      {/* Sticky Category Bar */}
      <div className="sticky-category-bar">
        <div className="category-buttons">
          {categories.map((category) => (
            <button
              key={category.id}
              className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory(category.id);
                scrollToCategory(category.id);
              }}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Content with top margin */}
      <div className="menu-content">

      {/* Menu Items by Category */}
      <section className="section">
        {categories.map((category) => {
            const categoryItems = getItemsByCategory(category.id);
            
            if (categoryItems.length === 0) return null;

            return (
              <div key={category.id} id={`category-${category.id}`} className="category-section">
                <div className="section-title" style={{ marginBottom: '2rem' }}>
                  <h2>{category.name}</h2>
                  <p>{category.description}</p>
                </div>

                <div className="menu-grid">
                  {categoryItems.map((item) => (
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
                        <FaPlus style={{ marginRight: '0.5rem' }} />
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>
      </div> {/* Close menu-content div */}
    </div>
  );
};

export default MenuPage; 