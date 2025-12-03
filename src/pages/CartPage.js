import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTrash, FaPlus, FaMinus, FaPhone } from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import { placeholderImage } from '../utils/placeholderImage';

const CartPage = () => {
  const navigate = useNavigate();
  const {
    items,
    removeItem,
    updateQuantity,
    getSubtotal,
    getServiceFee,
    getTotal,
    clearCart,
    createCartItemId
  } = useCart();

  const handleQuantityChange = (item, newQuantity) => {
    const cartItemId = createCartItemId(item);
    updateQuantity(cartItemId, newQuantity);
  };

  const handleRemoveItem = (item) => {
    const cartItemId = createCartItemId(item);
    removeItem(cartItemId);
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      clearCart();
    }
  };

  if (items.length === 0) {
    return (
      <div className="section">
        <div className="text-center">
          <h2>Your Cart is Empty</h2>
          <p>Add some delicious Sri Lankan dishes to get started!</p>
          <button
            className="btn btn-primary mt-3"
            onClick={() => navigate('/menu')}
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="section">
        <div className="d-flex justify-between align-center mb-4">
          <h1>Your Order</h1>
          <button
            className="btn btn-secondary"
            onClick={handleClearCart}
          >
            Clear Cart
          </button>
        </div>

        <div className="d-grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          {/* Cart Items */}
          <div>
            <div className="card p-3">
              <h3>Order Items</h3>
              <p>Review your selected items and proceed to checkout when ready.</p>
              
              <div className="cart-items">
                {items.map((item) => (
                  <div key={createCartItemId(item)} className="cart-item">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="cart-item-image"
                        onError={(e) => {
                          e.target.src = placeholderImage;
                        }}
                      />
                    )}
                    <div className="cart-item-details">
                      <h4 className="cart-item-title">{item.name}</h4>
                      <p className="cart-item-price">${item.price.toFixed(2)}</p>
                      <div className="dietary-tags">
                        {item.dietary && item.dietary.map((tag) => (
                          <span key={tag} className={`dietary-tag ${tag}`}>
                            {tag.charAt(0).toUpperCase() + tag.slice(1)}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="quantity-controls">
                      <button
                        className="quantity-btn"
                        onClick={() => handleQuantityChange(item, item.quantity - 1)}
                      >
                        <FaMinus />
                      </button>
                      <span style={{ minWidth: '30px', textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button
                        className="quantity-btn"
                        onClick={() => handleQuantityChange(item, item.quantity + 1)}
                      >
                        <FaPlus />
                      </button>
                    </div>
                    
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleRemoveItem(item)}
                      style={{ padding: '0.5rem', minWidth: 'auto' }}
                    >
                      <FaTrash style={{ color: '#dc3545' }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="card p-3">
              <h3>Order Summary</h3>
              
              <div className="cart-total">
                <div className="cart-total-row">
                  <span>Subtotal:</span>
                  <span>${getSubtotal().toFixed(2)}</span>
                </div>
                <div className="cart-total-row">
                  <span>Service Fee (5%):</span>
                  <span>${getServiceFee().toFixed(2)}</span>
                </div>
                <div className="cart-total-row total">
                  <span>Total:</span>
                  <span>${getTotal().toFixed(2)}</span>
                </div>
              </div>

              <button
                className="btn btn-primary w-full mt-3"
                onClick={handleCheckout}
                disabled={items.length === 0}
              >
                Proceed to Checkout
              </button>

              <div className="text-center mt-3">
                <p style={{ fontSize: '0.9rem', color: '#666' }}>
                  Call (08) 6252 8222 to place your order
                </p>
                <button className="btn btn-secondary mt-2">
                  <FaPhone style={{ marginRight: '0.5rem' }} />
                  Call to Order
                </button>
              </div>
            </div>

            {/* Additional Information */}
            <div className="card p-3 mt-3">
              <h4>Order Information</h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li style={{ marginBottom: '0.5rem' }}>
                  <span style={{ color: '#ff6b35', marginRight: '0.5rem' }}>•</span>
                  Free delivery within 10km
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <span style={{ color: '#ff6b35', marginRight: '0.5rem' }}>•</span>
                  Orders ready in 20-30 minutes
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <span style={{ color: '#ff6b35', marginRight: '0.5rem' }}>•</span>
                  Secure payment processing
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <span style={{ color: '#ff6b35', marginRight: '0.5rem' }}>•</span>
                  Contactless delivery available
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage; 