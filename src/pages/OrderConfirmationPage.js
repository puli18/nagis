import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ref, get } from 'firebase/database';
import { realtimeDb } from '../firebase/config';
import { FaCheckCircle, FaClock, FaPhone, FaMapMarkerAlt, FaUtensils, FaBox, FaCar, FaHome } from 'react-icons/fa';

const OrderConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Suppress Firebase connection errors (they don't affect this page)
    const originalError = window.console.error;
    window.console.error = (...args) => {
      const errorMessage = args[0]?.toString() || '';
      // Suppress IndexedDB connection errors that don't affect functionality
      if (errorMessage.includes('Indexed Database server lost') || 
          errorMessage.includes('Connection to Indexed Database')) {
        return; // Suppress these errors
      }
      originalError.apply(console, args);
    };

    // Get order data from location state (passed from checkout page)
    const fetchOrderData = async () => {
      if (location.state?.order) {
        const orderFromState = location.state.order;
        
        // Try to fetch the latest order data from Firebase to ensure we have the correct orderNumber
        if (orderFromState.id) {
          try {
            const orderRef = ref(realtimeDb, `orders/${orderFromState.id}`);
            const snapshot = await get(orderRef);
            
            if (snapshot.exists()) {
              const orderFromFirebase = snapshot.val();
              // Use Firebase data (which has the correct orderNumber) but merge with state data for items
              setOrder({
                ...orderFromFirebase,
                id: orderFromState.id,
                // Ensure items are preserved from state if Firebase doesn't have them yet
                items: orderFromFirebase.items || orderFromState.items,
              });
            } else {
              // Fallback to state data if Firebase doesn't have it yet
              setOrder(orderFromState);
            }
          } catch (error) {
            console.error('Error fetching order from Firebase:', error);
            // Fallback to state data if fetch fails
            setOrder(orderFromState);
          }
        } else {
          setOrder(orderFromState);
        }
        setLoading(false);
      } else {
        // If no order data, redirect to home
        navigate('/');
        return;
      }
    };
    
    fetchOrderData();

    // Restore original console.error on cleanup
    return () => {
      window.console.error = originalError;
    };
  }, [location.state, navigate]);

  const getOrderTypeIcon = (orderType) => {
    switch (orderType) {
      case 'dine-in': return <FaUtensils />;
      case 'takeaway': return <FaBox />;
      case 'pickup': return <FaBox />;
      case 'delivery': return <FaCar />;
      default: return <FaHome />;
    }
  };

  const getOrderTypeLabel = (orderType) => {
    switch (orderType) {
      case 'dine-in': return 'Dine-In';
      case 'takeaway': return 'Takeaway';
      case 'pickup': return 'Takeaway';
      case 'delivery': return 'Delivery';
      default: return 'Unknown';
    }
  };

  const getOrderTypeColor = (orderType) => {
    switch (orderType) {
      case 'dine-in': return '#3b82f6';
      case 'takeaway': return '#f97316';
      case 'pickup': return '#f97316';
      case 'delivery': return '#10b981';
      default: return '#6b7280';
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const handleBackToMenu = () => {
    navigate('/menu');
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleCallRestaurant = () => {
    window.open('tel:+61401090451', '_blank');
  };

  const handleViewLocation = () => {
    window.open('https://maps.google.com/?q=1A+Whyalla+St,+Willetton+WA+6155', '_blank');
  };

  if (loading) {
    return (
      <div className="confirmation-page">
        <div className="confirmation-container">
          <div className="loading-spinner"></div>
          <h2>Loading your order confirmation...</h2>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="confirmation-page">
        <div className="confirmation-container">
          <div className="error-message">
            <h2>Order not found</h2>
            <p>We couldn't find your order details. Please contact us if you believe this is an error.</p>
            <button className="btn btn-primary" onClick={handleBackToHome}>
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="confirmation-page">
      <div className="confirmation-container">
        {/* Success Header */}
        <div className="success-header">
          <div className="success-icon">
            <FaCheckCircle />
          </div>
          <h1>Order Confirmed!</h1>
          <p>Thank you for your order. We're preparing your food with care.</p>
        </div>

        {/* Order Details Card */}
        <div className="order-details-card">
          <div className="order-header">
            <div className="order-number">
              <h2>Order {order.orderNumber}</h2>
              <span className="order-time">Placed on {formatTimestamp(order.timestamp)}</span>
            </div>
            <div className="order-type" style={{ color: getOrderTypeColor(order.orderType) }}>
              <span className="order-type-icon">
                {getOrderTypeIcon(order.orderType)}
              </span>
              <span>{getOrderTypeLabel(order.orderType)}</span>
            </div>
          </div>

          {/* Customer Information */}
          <div className="customer-info">
            <h3>Customer Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <strong>Name:</strong> {order.customerInfo?.firstName} {order.customerInfo?.lastName}
              </div>
              <div className="info-item">
                <strong>Phone:</strong> {order.customerInfo?.phone}
              </div>
              {order.orderType === 'dine-in' && (
                <div className="info-item">
                  <strong>Table:</strong> {order.customerInfo?.tableNumber || 'N/A'}
                </div>
              )}
              {order.orderType === 'delivery' && (
                <div className="info-item">
                  <strong>Address:</strong> {order.customerInfo?.address}
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="order-items">
            <h3>Order Items</h3>
            <div className="items-list">
              {order.items?.map((item, index) => (
                <div key={index} className="order-item">
                  <div className="item-details">
                    <span className="item-quantity">{item.quantity}x</span>
                    <span className="item-name">{item.name}</span>
                    {item.variation && (
                      <span className="item-variation">({item.variation})</span>
                    )}
                  </div>
                  <span className="item-price">${item.price}</span>
                </div>
              ))}
            </div>
            <div className="order-total">
              <div className="total-row">
                <span>Subtotal:</span>
                <span>${(order.amount - (order.serviceFee || 0)).toFixed(2)}</span>
              </div>
              {order.serviceFee && order.serviceFee > 0 && (
                <div className="total-row">
                  <span>Service Fee:</span>
                  <span>${order.serviceFee.toFixed(2)}</span>
                </div>
              )}
              <div className="total-row total">
                <span>Total:</span>
                <span>${order.amount?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="next-steps">
          <h3>What's Next?</h3>
          <div className="steps-grid">
            <div className="step-item">
              <div className="step-icon">
                <FaClock />
              </div>
              <div className="step-content">
                <h4>Estimated Ready Time</h4>
                <p>Your order will be ready in approximately <strong>15-20 minutes</strong></p>
              </div>
            </div>
            
            {order.orderType === 'takeaway' || order.orderType === 'pickup' ? (
              <div className="step-item">
                <div className="step-icon">
                  <FaBox />
                </div>
                <div className="step-content">
                  <h4>Pickup Instructions</h4>
                  <p>Please come to our restaurant to collect your order. Have your order number ready.</p>
                </div>
              </div>
            ) : order.orderType === 'delivery' ? (
              <div className="step-item">
                <div className="step-icon">
                  <FaCar />
                </div>
                <div className="step-content">
                  <h4>Delivery</h4>
                  <p>We'll deliver your order to the address provided. Please ensure someone is available to receive the order.</p>
                </div>
              </div>
            ) : (
              <div className="step-item">
                <div className="step-icon">
                  <FaUtensils />
                </div>
                <div className="step-content">
                  <h4>Dine-In</h4>
                  <p>Please proceed to your table. We'll bring your order when it's ready.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Restaurant Information */}
        <div className="restaurant-info">
          <h3>Restaurant Information</h3>
          <div className="restaurant-details">
            <div className="restaurant-item">
              <FaMapMarkerAlt />
              <div>
                <strong>Address:</strong><br/>
                1A Whyalla St, Willetton, WA 6155
              </div>
            </div>
            <div className="restaurant-item">
              <FaPhone />
              <div>
                <strong>Phone:</strong><br/>
                (08) 6252 8222 / 401 090 451
              </div>
            </div>
            <div className="restaurant-item">
              <FaClock />
              <div>
                <strong>Hours:</strong><br/>
                Mon-Fri: 10:30 AM - 8:00 PM<br/>
                Sat-Sun: 10:00 AM - 8:00 PM
              </div>
            </div>
          </div>
          <div className="restaurant-actions">
            <button className="btn btn-outline" onClick={handleCallRestaurant}>
              <FaPhone />
              Call Restaurant
            </button>
            <button className="btn btn-outline" onClick={handleViewLocation}>
              <FaMapMarkerAlt />
              View on Map
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="confirmation-actions">
          <button className="btn btn-primary" onClick={handleBackToMenu}>
            Order More Food
          </button>
          <button className="btn btn-secondary" onClick={handleBackToHome}>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;




