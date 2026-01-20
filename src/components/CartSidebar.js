import React from 'react';
import { FaTimes, FaPlus, FaMinus, FaShoppingBag } from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import { placeholderImage } from '../utils/placeholderImage';
import { useNavigate } from 'react-router-dom';
import { useBusinessHours } from '../context/BusinessHoursContext';
import { formatNextOpening } from '../utils/businessHours';

const CartSidebar = () => {
  const navigate = useNavigate();
  const {
    items,
    isOpen,
    toggleCart,
    removeItem,
    updateQuantity,
    getSubtotal,
    getServiceFee,
    clearCart,
    createCartItemId
  } = useCart();
  const { isOpenNow, nextOpeningDate, isLoading } = useBusinessHours();
  const checkoutDisabled = !isLoading && !isOpenNow;
  const nextOpeningLabel = formatNextOpening(nextOpeningDate);

  const handleQuantityChange = (item, newQuantity) => {
    const cartItemId = createCartItemId(item);
    updateQuantity(cartItemId, newQuantity);
  };

  const handleRemoveItem = (item) => {
    const cartItemId = createCartItemId(item);
    removeItem(cartItemId);
  };

  const handleCheckout = () => {
    if (checkoutDisabled) {
      return;
    }
    toggleCart(); // Close the cart sidebar
    navigate('/checkout'); // Navigate to checkout page
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      clearCart();
    }
  };

  return (
    <div className={`cart-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="cart-header">
        <h3>Your Order</h3>
        <button className="cart-close" onClick={toggleCart}>
          <FaTimes />
        </button>
      </div>

      <div className="cart-items">
        {items.length === 0 ? (
          <div className="text-center p-4">
            <FaShoppingBag style={{ fontSize: '3rem', color: '#ccc', marginBottom: '1rem' }} />
            <p>Your cart is empty</p>
            <p style={{ fontSize: '0.9rem', color: '#666' }}>
              Add some delicious Sri Lankan dishes!
            </p>
          </div>
        ) : (
          <>
            <p style={{ padding: '0 1.5rem 1rem', color: '#666' }}>
              Review your selected items and proceed to checkout when ready.
            </p>
            
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
                </div>
                
                <div className="quantity-controls">
                  <button
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(item, item.quantity - 1)}
                  >
                    <FaMinus />
                  </button>
                  <span style={{ minWidth: '21px', width: '21px', height: '21px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                  style={{ 
                    padding: '0', 
                    minWidth: '21px', 
                    width: '21px', 
                    height: '21px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <FaTimes style={{ color: '#dc3545', fontSize: '12px' }} />
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      {items.length > 0 && (
        <div className="cart-total">
          <div className="cart-total-row">
            <span>Subtotal:</span>
            <span>${getSubtotal().toFixed(2)}</span>
          </div>
          <div className="cart-total-row">
            <span>Service Fee:</span>
            <span>${Math.min(getServiceFee(), 3).toFixed(2)}</span>
          </div>
          <div className="cart-total-row total">
            <span>Total:</span>
            <span>${(getSubtotal() + Math.min(getServiceFee(), 3)).toFixed(2)}</span>
          </div>

          {checkoutDisabled && (
            <div className="closed-order-note">
              We are closed now. {nextOpeningLabel && `Next opening: ${nextOpeningLabel}.`}
            </div>
          )}

          <button
            className="btn btn-primary w-full mt-3"
            onClick={handleCheckout}
            disabled={checkoutDisabled}
          >
            {checkoutDisabled ? 'Closed - Checkout Disabled' : 'Proceed to Checkout'}
          </button>

          <button
            className="btn btn-secondary w-full mt-2"
            onClick={handleClearCart}
          >
            Clear Cart
          </button>
        </div>
      )}
    </div>
  );
};

export default CartSidebar; 