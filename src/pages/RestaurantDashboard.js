import React, { useState, useEffect } from 'react';
import { ref, onValue, off, update } from 'firebase/database';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { FaPhone, FaTimes, FaPrint, FaUtensils, FaCar, FaHome, FaCheck, FaSignInAlt, FaSignOutAlt, FaBox } from 'react-icons/fa';
import { realtimeDb, auth } from '../firebase/config';

const RestaurantDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderType, setSelectedOrderType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });
  const [currentTime, setCurrentTime] = useState('');
  const [previousOrderCount, setPreviousOrderCount] = useState(0);
  const [showNewOrderNotification, setShowNewOrderNotification] = useState(false);


  // Authentication state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Update current time
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  // Fetch orders from Firebase
  useEffect(() => {
    const ordersRef = ref(realtimeDb, 'orders');
    
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      if (snapshot.exists()) {
        const ordersData = snapshot.val();
        
        const ordersArray = Object.entries(ordersData).map(([id, order]) => ({
          id,
          ...order,
          orderNumber: order.orderNumber || `#${id.slice(-6).toUpperCase()}`, // Use generated order number or fallback
          // Improve order type detection
          orderType: getOrderTypeFromOrder(order),
        })).sort((a, b) => b.timestamp - a.timestamp);
        
        // Check for new orders and play sound notification
        const activeOrders = ordersArray.filter(order => order.status !== 'completed');
        if (activeOrders.length > previousOrderCount && previousOrderCount > 0) {
          playNewOrderSound();
          setShowNewOrderNotification(true);
          // Hide notification after 5 seconds
          setTimeout(() => setShowNewOrderNotification(false), 5000);
        }
        setPreviousOrderCount(activeOrders.length);
        
        setOrders(ordersArray);
      } else {
        setOrders([]);
        setPreviousOrderCount(0);
      }
      setLoading(false);
    }, (error) => {
      console.error('Firebase error:', error);
      setLoading(false);
    });

    return () => off(ordersRef, 'value', unsubscribe);
  }, [previousOrderCount]);

  // Function to play new order notification sound
  const playNewOrderSound = () => {
    try {
      // Check if Web Audio API is available
      if (typeof window.AudioContext !== 'undefined' || typeof window.webkitAudioContext !== 'undefined') {
        // Create a simple notification sound using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      }
      
      // Also show a browser notification if permitted
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('New Order Received!', {
          body: 'A new order has been placed. Please check the dashboard.',
          icon: '/favicon.ico'
        });
      }
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  };

  // Function to determine order type from order data
  const getOrderTypeFromOrder = (order) => {
    // Check if orderType is explicitly set at the top level
    if (order.orderType) {
      return order.orderType;
    }
    
    // Check if orderType is in customerInfo (fallback)
    if (order.customerInfo?.orderType) {
      return order.customerInfo.orderType;
    }
    
    // Check if delivery address is provided (indicates delivery)
    if (order.customerInfo?.address && order.customerInfo.address.trim() !== '') {
      return 'delivery';
    }
    
    // Check if pickup time is mentioned or if it's a pickup order
    if (order.customerInfo?.pickupTime || 
        order.customerInfo?.deliveryAddress === '' ||
        !order.customerInfo?.address) {
      return 'takeaway';
    }
    
    // Default to takeaway if no clear indication
    return 'takeaway';
  };

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    
    try {
      await signInWithEmailAndPassword(auth, loginForm.email, loginForm.password);
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Invalid email or password. Please try again.');
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Handle login form changes
  const handleLoginChange = (e) => {
    setLoginForm({
      ...loginForm,
      [e.target.name]: e.target.value
    });
  };

  // Show login form if not authenticated
  if (authLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f8fafc'
      }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="restaurant-login-container">
        <div className="restaurant-login-card">
          <div className="restaurant-login-header">
            <h2>Restaurant Dashboard</h2>
            <p>Please sign in to access the dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="restaurant-login-form">
            <div>
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                value={loginForm.email}
                onChange={handleLoginChange}
                required
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={loginForm.password}
                onChange={handleLoginChange}
                required
                placeholder="Enter your password"
              />
            </div>

            {loginError && (
              <div className="restaurant-login-error">
                {loginError}
              </div>
            )}

            <button type="submit" className="restaurant-login-button">
              <FaSignInAlt />
              Sign In
            </button>
          </form>

          <div className="restaurant-login-note">
            <strong>Note:</strong> This dashboard is restricted to authorized restaurant staff only.
          </div>
        </div>
      </div>
    );
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = ref(realtimeDb, `orders/${orderId}`);
      await update(orderRef, { status: newStatus });
      console.log(`Order ${orderId} status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'preparing': return '#f59e0b';
      case 'ready': return '#10b981';
      case 'completed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getOrderTypeColor = (orderType) => {
    switch (orderType) {
      case 'dine-in': return '#3b82f6';
      case 'takeaway': return '#f97316';
      case 'pickup': return '#f97316'; // Use same color as takeaway
      case 'delivery': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getOrderTypeIcon = (orderType) => {
    switch (orderType) {
      case 'dine-in': return <FaUtensils />;
      case 'takeaway': return <FaBox />;
      case 'pickup': return <FaBox />; // Use box icon for pickup orders
      case 'delivery': return <FaCar />;
      default: return <FaHome />;
    }
  };

  const getOrderTypeLabel = (orderType) => {
    switch (orderType) {
      case 'dine-in': return 'Dine-In';
      case 'takeaway': return 'Takeaway';
      case 'pickup': return 'Takeaway'; // Map pickup to Takeaway for display
      case 'delivery': return 'Delivery';
      default: return 'Unknown';
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };



  const handlePrintOrder = (order) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head><title>Order ${order.orderNumber}</title></head>
        <body>
          <h1>Order ${order.orderNumber}</h1>
          <p><strong>Customer:</strong> ${order.customerInfo?.firstName} ${order.customerInfo?.lastName}</p>
          <p><strong>Phone:</strong> ${order.customerInfo?.phone}</p>
          <p><strong>Order Type:</strong> ${getOrderTypeLabel(order.customerInfo?.orderType)}</p>
          <p><strong>Items:</strong></p>
          <ul>
            ${order.items?.map(item => `<li>${item.quantity}x ${item.name} - $${item.price}</li>`).join('')}
          </ul>
          <p><strong>Total:</strong> $${order.amount}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const filteredOrders = orders.filter(order => {
    // Use the improved order type detection
    let orderTypeMatch = false;
    if (selectedOrderType === 'all') {
      orderTypeMatch = true;
    } else if (selectedOrderType === 'takeaway') {
      // Show both 'takeaway' and 'pickup' orders when takeaway is selected
      orderTypeMatch = order.orderType === 'takeaway' || order.orderType === 'pickup';
    } else {
      orderTypeMatch = order.orderType === selectedOrderType;
    }
    
    const statusMatch = selectedStatus === 'all' || order.status === selectedStatus;
    
    // Hide completed orders from main view unless specifically selected
    if (selectedStatus !== 'completed' && order.status === 'completed') {
      return false;
    }
    
    return orderTypeMatch && statusMatch;
  });

  const getOrderTypeCount = (type) => {
    // Only count active orders (not completed) for order type counts
    if (type === 'takeaway') {
      // Include both 'takeaway' and 'pickup' orders in the takeaway count
      return orders.filter(order => 
        (order.orderType === 'takeaway' || order.orderType === 'pickup') && 
        order.status !== 'completed'
      ).length;
    }
    return orders.filter(order => order.orderType === type && order.status !== 'completed').length;
  };

  const getStatusCount = (status) => {
    return orders.filter(order => order.status === status).length;
  };

  // Function to group orders by status for better organization
  const getGroupedOrders = () => {
    if (selectedStatus !== 'all') {
      // If a specific status is selected, return orders normally
      return filteredOrders;
    }

    // Group orders by status for "All Status" view
    const grouped = {
      pending: [],
      preparing: [],
      ready: [],
      completed: []
    };

    filteredOrders.forEach(order => {
      if (grouped[order.status]) {
        grouped[order.status].push(order);
      }
    });

    return grouped;
  };

  // Function to render status section header
  const renderStatusSectionHeader = (status, count) => {
    if (count === 0) return null;

    const statusLabels = {
      pending: 'New Orders',
      preparing: 'Preparing',
      ready: 'Ready',
      completed: 'Completed'
    };

    const statusColors = {
      pending: '#6b7280',
      preparing: '#f59e0b',
      ready: '#10b981',
      completed: '#6b7280'
    };

    return (
      <div className={`status-section-header ${status}`}>
        <span className="status-dot" style={{ backgroundColor: statusColors[status] }}></span>
        {statusLabels[status]} ({count})
      </div>
    );
  };



  if (loading) {
    return (
      <div className="restaurant-dashboard">
        <div className="text-center p-8">
          <div className="loading-spinner"></div>
          <p className="mt-4">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="restaurant-dashboard">
      {/* New Order Notification Banner */}
      {showNewOrderNotification && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          backgroundColor: '#10b981',
          color: 'white',
          padding: '1rem',
          textAlign: 'center',
          zIndex: 9999,
          animation: 'slideDown 0.5s ease-out'
        }}>
          <strong>🎉 New Order Received!</strong> Check the dashboard for the latest order.
          <button
            onClick={() => setShowNewOrderNotification(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              marginLeft: '1rem',
              cursor: 'pointer',
              fontSize: '1.2rem'
            }}
          >
            ×
          </button>
        </div>
      )}
      
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>Restaurant Orders</h1>
          <p>Manage and track all incoming orders</p>
        </div>
        <div className="header-right">
          <div className="status-bar">
            <div className="status-item">
              <span className="status-dot preparing"></span>
              <span>Preparing ({getStatusCount('preparing')})</span>
            </div>
            <div className="status-item">
              <span className="status-dot ready"></span>
              <span>Ready ({getStatusCount('ready')})</span>
            </div>
            <div className="status-item">
              <span className="status-dot completed"></span>
              <span>Completed ({getStatusCount('completed')})</span>
            </div>
            <div className="current-time">{currentTime}</div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              marginLeft: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.9rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'background-color 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#c82333'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#dc3545'}
          >
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Main Content */}
        <div className="main-content">
          {/* Filters */}
          <div className="filters-section">
            {/* Order Type Filter */}
            <div className="filter-group">
              <div className="filter-buttons">
                <button 
                  className={`filter-btn ${selectedOrderType === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedOrderType('all')}
                >
                  <FaCheck />
                  All Orders ({orders.filter(order => order.status !== 'completed').length})
                </button>
                <button 
                  className={`filter-btn ${selectedOrderType === 'dine-in' ? 'active' : ''}`}
                  onClick={() => setSelectedOrderType('dine-in')}
                >
                  <FaUtensils />
                  Dine-In ({getOrderTypeCount('dine-in')})
                </button>
                <button 
                  className={`filter-btn ${selectedOrderType === 'takeaway' ? 'active' : ''}`}
                  onClick={() => setSelectedOrderType('takeaway')}
                >
                  <FaPhone />
                  Takeaway ({getOrderTypeCount('takeaway')})
                </button>
                <button 
                  className={`filter-btn ${selectedOrderType === 'delivery' ? 'active' : ''}`}
                  onClick={() => setSelectedOrderType('delivery')}
                >
                  <FaCar />
                  Delivery ({getOrderTypeCount('delivery')})
                </button>
              </div>
            </div>

            {/* Status Filter */}
            <div className="filter-group">
              <div className="status-filters">
                <button 
                  className={`status-filter ${selectedStatus === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedStatus('all')}
                >
                  <FaCheck />
                  All Status
                </button>
                <button 
                  className={`status-filter ${selectedStatus === 'preparing' ? 'active' : ''}`}
                  onClick={() => setSelectedStatus('preparing')}
                >
                  <span className="status-dot preparing"></span>
                  Preparing
                </button>
                <button 
                  className={`status-filter ${selectedStatus === 'ready' ? 'active' : ''}`}
                  onClick={() => setSelectedStatus('ready')}
                >
                  <span className="status-dot ready"></span>
                  Ready
                </button>
                <button 
                  className={`status-filter ${selectedStatus === 'completed' ? 'active' : ''}`}
                  onClick={() => setSelectedStatus('completed')}
                >
                  <span className="status-dot completed"></span>
                  Completed
                </button>
              </div>
            </div>
          </div>

                    {/* Orders Grid */}
          <div className="orders-grid">
            {(() => {
              const groupedOrders = getGroupedOrders();
              
              if (selectedStatus !== 'all') {
                // Render orders normally for specific status selection
                return filteredOrders.map((order) => (
                  <div 
                    key={order.id} 
                    className={`order-card ${selectedOrder?.id === order.id ? 'selected' : ''}`}
                    onClick={() => setSelectedOrder(order)}
                    style={{ cursor: 'pointer' }}
                  >
                <div className="order-header">
                  <div className="order-type">
                    <span className="order-type-icon" style={{ color: getOrderTypeColor(order.orderType) }}>
                      {getOrderTypeIcon(order.orderType)}
                    </span>
                    <span style={{ color: getOrderTypeColor(order.orderType) }}>
                      {getOrderTypeLabel(order.orderType)}
                    </span>
                  </div>
                  <div className="order-status">
                    <span className="status-dot" style={{ backgroundColor: getStatusColor(order.status) }}></span>
                    <span style={{ color: getStatusColor(order.status) }}>
                      {order.status === 'preparing' ? 'Preparing' : 
                       order.status === 'ready' ? 'Ready' : 
                       order.status === 'completed' ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                  <div className="order-number">{order.orderNumber}</div>
                </div>

                <div className="order-customer">
                  <div className="customer-name">{order.customerInfo?.firstName} {order.customerInfo?.lastName}</div>
                  <div className="order-time">Ordered at {formatTimestamp(order.timestamp)}</div>
                  <div className="customer-details">
                    {order.orderType === 'dine-in' && `Table ${order.customerInfo?.tableNumber || 'N/A'}`}
                    {(order.orderType === 'takeaway' || order.orderType === 'pickup') && order.customerInfo?.phone}
                    {order.orderType === 'delivery' && (
                      <>
                        {order.customerInfo?.phone}<br/>
                        {order.customerInfo?.address}
                      </>
                    )}
                  </div>
                </div>

                <div className="order-summary">
                  <div className="items-count">{order.items?.length || 0} items</div>
                  <div className="items-list">
                    {order.items?.slice(0, 2).map((item, index) => (
                      <div key={index} className="item">
                        {item.quantity}x {item.name} ${item.price}
                      </div>
                    ))}
                    {order.items?.length > 2 && (
                      <div className="more-items">+{order.items.length - 2} more item{order.items.length - 2 !== 1 ? 's' : ''}</div>
                    )}
                  </div>
                </div>



                <div className="order-estimate">
                  {order.status === 'ready' ? (
                    <span style={{ color: '#10b981' }}>Ready</span>
                  ) : order.status === 'completed' ? (
                    <span style={{ color: '#6b7280' }}>Completed</span>
                  ) : (
                    <span style={{ color: '#f59e0b' }}>Est. ready 15 min</span>
                  )}
                </div>


              </div>
            ));
              } else {
                // Render grouped orders for "All Status" view
                return Object.entries(groupedOrders).map(([status, orders]) => {
                  if (orders.length === 0) return null;
                  
                  return (
                    <React.Fragment key={status}>
                      {renderStatusSectionHeader(status, orders.length)}
                      {orders.map((order) => (
                        <div 
                          key={order.id} 
                          className={`order-card ${selectedOrder?.id === order.id ? 'selected' : ''}`}
                          onClick={() => setSelectedOrder(order)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="order-header">
                            <div className="order-type">
                              <span className="order-type-icon" style={{ color: getOrderTypeColor(order.orderType) }}>
                                {getOrderTypeIcon(order.orderType)}
                              </span>
                              <span style={{ color: getOrderTypeColor(order.orderType) }}>
                                {getOrderTypeLabel(order.orderType)}
                              </span>
                            </div>
                            <div className="order-status">
                              <span className="status-dot" style={{ backgroundColor: getStatusColor(order.status) }}></span>
                              <span style={{ color: getStatusColor(order.status) }}>
                                {order.status === 'preparing' ? 'Preparing' : 
                                 order.status === 'ready' ? 'Ready' : 
                                 order.status === 'completed' ? 'Completed' : 'Pending'}
                              </span>
                            </div>
                            <div className="order-number">{order.orderNumber}</div>
                          </div>

                          <div className="order-customer">
                            <div className="customer-name">{order.customerInfo?.firstName} {order.customerInfo?.lastName}</div>
                            <div className="order-time">Ordered at {formatTimestamp(order.timestamp)}</div>
                            <div className="customer-details">
                              {order.orderType === 'dine-in' && `Table ${order.customerInfo?.tableNumber || 'N/A'}`}
                              {(order.orderType === 'takeaway' || order.orderType === 'pickup') && order.customerInfo?.phone}
                              {order.orderType === 'delivery' && (
                                <>
                                  {order.customerInfo?.phone}<br/>
                                  {order.customerInfo?.address}
                                </>
                              )}
                            </div>
                          </div>

                          <div className="order-summary">
                            <div className="items-count">{order.items?.length || 0} items</div>
                            <div className="items-list">
                              {order.items?.slice(0, 2).map((item, index) => (
                                <div key={index} className="item">
                                  {item.quantity}x {item.name} ${item.price}
                                </div>
                              ))}
                              {order.items?.length > 2 && (
                                <div className="more-items">+{order.items.length - 2} more item{order.items.length - 2 !== 1 ? 's' : ''}</div>
                              )}
                            </div>
                          </div>



                          <div className="order-estimate">
                            {order.status === 'ready' ? (
                              <span style={{ color: '#10b981' }}>Ready</span>
                            ) : order.status === 'completed' ? (
                              <span style={{ color: '#6b7280' }}>Completed</span>
                            ) : (
                              <span style={{ color: '#f59e0b' }}>Est. ready 15 min</span>
                            )}
                          </div>


                        </div>
                      ))}
                    </React.Fragment>
                  );
                });
              }
            })()}
          </div>
        </div>

        {/* Order Details Sidebar */}
        {selectedOrder && (
          <div className="order-details-sidebar">
            <div className="sidebar-header">
              <h3>Order Details {selectedOrder.orderNumber}</h3>
              <button 
                className="close-btn"
                onClick={() => setSelectedOrder(null)}
              >
                <FaTimes />
              </button>
            </div>

            <div className="sidebar-content">
              <div className="order-status-display">
                <div className="order-type-display">
                  <span className="order-type-icon" style={{ color: getOrderTypeColor(selectedOrder.orderType) }}>
                    {getOrderTypeIcon(selectedOrder.orderType)}
                  </span>
                  <span style={{ color: getOrderTypeColor(selectedOrder.orderType) }}>
                    {getOrderTypeLabel(selectedOrder.orderType)}
                  </span>
                </div>
                <div className="order-status-display">
                  <span className="status-dot" style={{ backgroundColor: getStatusColor(selectedOrder.status) }}></span>
                  <span style={{ color: getStatusColor(selectedOrder.status) }}>
                    {selectedOrder.status === 'preparing' ? 'Preparing' : 
                     selectedOrder.status === 'ready' ? 'Ready' : 
                     selectedOrder.status === 'completed' ? 'Completed' : 'Pending'}
                  </span>
                </div>
              </div>

              {selectedOrder.status !== 'completed' && (
                <button 
                  className="mark-ready-btn"
                  onClick={() => {
                    const nextStatus = selectedOrder.status === 'pending' ? 'preparing' : 
                                     selectedOrder.status === 'preparing' ? 'ready' : 'completed';
                    updateOrderStatus(selectedOrder.id, nextStatus);
                  }}
                >
                  <FaCheck />
                  {selectedOrder.status === 'pending' ? 'Mark as Preparing' :
                   selectedOrder.status === 'preparing' ? 'Mark as Ready' : 'Mark as Completed'}
                </button>
              )}

              <div className="customer-info">
                <div className="info-item">
                  <FaPhone />
                  <span>{selectedOrder.customerInfo?.firstName} {selectedOrder.customerInfo?.lastName}</span>
                </div>
                {selectedOrder.orderType === 'dine-in' && (
                  <div className="info-item">
                    <FaUtensils />
                    <span>Table {selectedOrder.customerInfo?.tableNumber || 'N/A'}</span>
                  </div>
                )}
              </div>

              <div className="timing-info">
                <div className="timing-item">
                  <span>Ordered at</span>
                  <span>{formatTimestamp(selectedOrder.timestamp)}</span>
                </div>
                <div className="timing-item">
                  <span>Estimated ready</span>
                  <span style={{ color: '#f59e0b' }}>15 min</span>
                </div>
              </div>

              <div className="order-items">
                <h4>Order Items</h4>
                {selectedOrder.items?.map((item, index) => (
                  <div key={index} className="order-item">
                    <span>{item.quantity}x {item.name}</span>
                    <span>${item.price}</span>
                  </div>
                ))}
                <div className="order-total-row">
                  <span>Subtotal</span>
                  <span>${(selectedOrder.amount - (selectedOrder.serviceFee || 0)).toFixed(2)}</span>
                </div>
                <div className="order-total-row total">
                  <span>Total</span>
                  <span>${selectedOrder.amount?.toFixed(2) || '0.00'}</span>
                </div>
              </div>

              <div className="customer-actions">
                <div className="customer-action-btn" style={{ 
                  backgroundColor: '#f8fafc', 
                  color: '#374151', 
                  cursor: 'default',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <FaPhone />
                  <span>Customer: {selectedOrder.customerInfo?.phone || 'N/A'}</span>
                </div>
                <button 
                  className="customer-action-btn"
                  onClick={() => handlePrintOrder(selectedOrder)}
                >
                  <FaPrint />
                  Print Order
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantDashboard; 