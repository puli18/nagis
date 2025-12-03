import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { placeholderImage } from '../utils/placeholderImage';

const GalleryPage = () => {
  const [selectedImage, setSelectedImage] = useState(null);

  const galleryImages = [
    { id: 1, src: '/images/gallery-1.jpg', alt: 'Fish Curry with Rice', category: 'Food' },
    { id: 2, src: '/images/gallery-2.jpg', alt: 'Hoppers with Curry', category: 'Food' },
    { id: 3, src: '/images/gallery-3.jpg', alt: 'Kottu Roti', category: 'Food' },
    { id: 4, src: '/images/gallery-4.jpg', alt: 'String Hoppers', category: 'Food' },
    { id: 5, src: '/images/gallery-5.jpg', alt: 'Samosas', category: 'Food' },
    { id: 6, src: '/images/gallery-6.jpg', alt: 'Chicken Curry', category: 'Food' },
    { id: 7, src: '/images/gallery-7.jpg', alt: 'Restaurant Interior', category: 'Restaurant' },
    { id: 8, src: '/images/gallery-8.jpg', alt: 'Kitchen Preparation', category: 'Kitchen' },
    { id: 9, src: '/images/gallery-9.jpg', alt: 'Catering Setup', category: 'Catering' },
    { id: 10, src: '/images/gallery-10.jpg', alt: 'Wedding Catering', category: 'Catering' },
    { id: 11, src: '/images/gallery-11.jpg', alt: 'Corporate Event', category: 'Catering' },
    { id: 12, src: '/images/gallery-12.jpg', alt: 'Birthday Celebration', category: 'Catering' }
  ];

  const categories = ['All', 'Food', 'Restaurant', 'Kitchen', 'Catering'];
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredImages = selectedCategory === 'All' 
    ? galleryImages 
    : galleryImages.filter(img => img.category === selectedCategory);

  const handleImageClick = (image) => {
    setSelectedImage(image);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  return (
    <div className="gallery-page">
      {/* Hero Section */}
      <section className="section" style={{ paddingTop: '8rem', paddingBottom: '4rem' }}>
        <div className="section-title" style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h1 style={{ marginBottom: '1rem' }}>Gallery</h1>
          <p style={{ fontSize: '18px', maxWidth: '700px', margin: '0 auto' }}>
            Explore our collection of authentic Sri Lankan dishes and memorable events.
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="section">
        <div className="d-flex justify-center mb-4" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          {categories.map((category) => (
            <button
              key={category}
              className={`btn ${selectedCategory === category ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="d-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {filteredImages.map((image) => (
            <div
              key={image.id}
              className="card"
              style={{ 
                overflow: 'hidden', 
                cursor: 'pointer',
                transition: 'transform 0.3s ease'
              }}
              onClick={() => handleImageClick(image)}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
              }}
            >
              <img
                src={image.src}
                alt={image.alt}
                style={{
                  width: '100%',
                  height: '250px',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  e.target.src = placeholderImage;
                }}
              />
              <div className="p-3">
                <h4 style={{ margin: '0', fontSize: '1rem' }}>{image.alt}</h4>
                <p style={{ margin: '0.5rem 0 0 0', color: '#666', fontSize: '0.9rem' }}>
                  {image.category}
                </p>
              </div>
            </div>
          ))}
        </div>

        {filteredImages.length === 0 && (
          <div className="text-center p-4">
            <p>No images found in this category.</p>
          </div>
        )}
      </section>

      {/* Image Modal */}
      {selectedImage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '2rem'
          }}
          onClick={closeModal}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '2rem',
                cursor: 'pointer',
                zIndex: 2001
              }}
            >
              <FaTimes />
            </button>
            <img
              src={selectedImage.src}
              alt={selectedImage.alt}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
              onError={(e) => {
                e.target.src = '/images/placeholder.jpg';
              }}
            />
            <div style={{ color: 'white', textAlign: 'center', marginTop: '1rem' }}>
              <h3>{selectedImage.alt}</h3>
              <p>{selectedImage.category}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryPage; 