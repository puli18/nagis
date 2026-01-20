import React, { useState, useEffect, useRef } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { FaPhone, FaTimes, FaPrint, FaUtensils, FaCar, FaHome, FaCheck, FaSignInAlt, FaSignOutAlt, FaBox, FaHistory, FaSearch, FaChevronDown, FaChevronUp, FaChevronLeft, FaChevronRight, FaListAlt } from 'react-icons/fa';
import { realtimeDb, auth, db } from '../firebase/config';

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
  const previousOrderIdsRef = useRef(new Set());
  const [showNewOrderNotification, setShowNewOrderNotification] = useState(false);
  const [viewMode, setViewMode] = useState('today'); // 'today' or 'history'
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('all');
  const [historyOrderTypeFilter, setHistoryOrderTypeFilter] = useState('all');
  const [historySelectedDate, setHistorySelectedDate] = useState('');
  const [historyDateInputType, setHistoryDateInputType] = useState('text');
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [pingingOrders, setPingingOrders] = useState(new Set()); // Orders that are currently pinging
  const [audioRef, setAudioRef] = useState(null); // Reference to audio element
  const [isSideMenuExpanded, setIsSideMenuExpanded] = useState(true);
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState('');
  const [menuSearch, setMenuSearch] = useState('');
  const [menuCategoryFilter, setMenuCategoryFilter] = useState('all');
  const [menuSavingKeys, setMenuSavingKeys] = useState(new Set());


  // Authentication state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Request notification permission on first user gesture
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      const handleUserGesture = () => {
        Notification.requestPermission().catch(() => {});
        window.removeEventListener('click', handleUserGesture);
        window.removeEventListener('keydown', handleUserGesture);
      };

      window.addEventListener('click', handleUserGesture, { once: true });
      window.addEventListener('keydown', handleUserGesture, { once: true });

      return () => {
        window.removeEventListener('click', handleUserGesture);
        window.removeEventListener('keydown', handleUserGesture);
      };
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
        
        // Check for new orders (only today's orders with pending status)
        const todayOrders = ordersArray.filter(order => {
          if (!order.timestamp) return false;
          const orderDate = new Date(order.timestamp);
          const today = new Date();
          return orderDate.toDateString() === today.toDateString() && order.status === 'pending';
        });
        
        const currentOrderIds = new Set(todayOrders.map(order => order.id));
        const newOrderIds = new Set();
        
        // Find truly new orders (only if previousOrderIds is not empty, meaning we've loaded orders before)
        if (previousOrderIdsRef.current.size > 0) {
          currentOrderIds.forEach(id => {
            if (!previousOrderIdsRef.current.has(id)) {
              newOrderIds.add(id);
            }
          });
        }
        
        // Add new orders to pinging list (only if they're truly new)
        if (newOrderIds.size > 0) {
          setPingingOrders(prev => {
            const updated = new Set(prev);
            newOrderIds.forEach(id => updated.add(id));
            return updated;
          });
          setShowNewOrderNotification(true);
          setTimeout(() => setShowNewOrderNotification(false), 5000);
        }
        
        // Update previous order IDs
        previousOrderIdsRef.current = currentOrderIds;
        setOrders(ordersArray);
      } else {
        setOrders([]);
        previousOrderIdsRef.current = new Set();
      }
      setLoading(false);
    }, (error) => {
      console.error('Firebase error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch menu items for availability management
  useEffect(() => {
    setMenuLoading(true);
    setMenuError('');

    const menuItemsRef = collection(db, 'menuItems');
    const unsubscribe = onSnapshot(
      menuItemsRef,
      (snapshot) => {
        const items = snapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data();
          return {
            docId: docSnapshot.id,
            ...data,
            available: data.available !== false,
            variations: (data.variations || []).map((variation) => ({
              ...variation,
              available: variation.available !== false
            }))
          };
        }).sort((a, b) => {
          const categoryCompare = (a.category || '').localeCompare(b.category || '');
          if (categoryCompare !== 0) return categoryCompare;
          return (a.name || '').localeCompare(b.name || '');
        });

        setMenuItems(items);
        setMenuLoading(false);
      },
      (error) => {
        console.error('Error loading menu items:', error);
        setMenuError('Failed to load menu items. Please try again.');
        setMenuLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Sync selectedOrder with updated order data when orders change
  useEffect(() => {
    if (selectedOrder && orders.length > 0) {
      const updatedOrder = orders.find(order => order.id === selectedOrder.id);
      if (updatedOrder) {
        // Only update if status changed to avoid unnecessary re-renders
        if (updatedOrder.status !== selectedOrder.status) {
          setSelectedOrder(updatedOrder);
        }
      } else {
        // Order was deleted, close sidebar
        setSelectedOrder(null);
      }
    } else if (orders.length === 0 && selectedOrder) {
      // No orders, close sidebar
      setSelectedOrder(null);
    }
  }, [orders, selectedOrder]);

  // Play ping sound continuously for pinging orders
  useEffect(() => {
    if (pingingOrders.size > 0) {
      // Create or reuse audio element
      let audio = audioRef;
      if (!audio) {
        audio = new Audio('/sounds/New Order.mp3');
        audio.loop = true;
        audio.volume = 0.7;
        setAudioRef(audio);
      }
      
      // Ensure loop is set and audio is ready
      audio.loop = true;
      
      // Only play if not already playing
      if (audio.paused) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log('Could not play ping sound:', error);
          });
        }
      }
    } else {
      // Stop audio when no pinging orders
      if (audioRef) {
        audioRef.pause();
        audioRef.currentTime = 0;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pingingOrders.size]);

  // Handle order click - stop pinging for that order
  const handleOrderClick = (orderId) => {
    setPingingOrders(prev => {
      const updated = new Set(prev);
      updated.delete(orderId);
      return updated;
    });
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
    // Store previous status for potential revert
    const previousStatus = orders.find(order => order.id === orderId)?.status;
    
    // Optimistic update - update UI immediately
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(prev => ({
        ...prev,
        status: newStatus
      }));
    }
    
    // Update orders array immediately for instant UI feedback
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
    
    // Update Firebase in the background (don't await)
    try {
      const orderRef = ref(realtimeDb, `orders/${orderId}`);
      update(orderRef, { status: newStatus }).then(() => {
        console.log(`Order ${orderId} status updated to ${newStatus}`);
      }).catch(error => {
        console.error('Error updating order status:', error);
        // Revert optimistic update on error
        if (previousStatus) {
          setOrders(prevOrders => 
            prevOrders.map(order => 
              order.id === orderId ? { ...order, status: previousStatus } : order
            )
          );
          if (selectedOrder && selectedOrder.id === orderId) {
            setSelectedOrder(prev => ({
              ...prev,
              status: previousStatus
            }));
          }
          alert('Failed to update order status. Please try again.');
        }
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      // Revert on error
      if (previousStatus) {
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId ? { ...order, status: previousStatus } : order
          )
        );
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(prev => ({
            ...prev,
            status: previousStatus
          }));
        }
      }
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

  // Helper function to check if order is from today
  const isToday = (timestamp) => {
    if (!timestamp) return false;
    const orderDate = new Date(timestamp);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  };

  // Filter orders based on view mode and filters
  const filteredOrders = orders.filter(order => {
    // If viewing today's orders, filter by date
    if (viewMode === 'today' && !isToday(order.timestamp)) {
      return false;
    }

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
    if (viewMode === 'today' && selectedStatus !== 'completed' && order.status === 'completed') {
      return false;
    }
    
    return orderTypeMatch && statusMatch;
  });

  const todayOrders = orders.filter(order => isToday(order.timestamp));

  // Filter orders for history view with search and filters
  const filteredHistoryOrders = orders.filter(order => {
    // Search filter
    if (historySearch) {
      const searchLower = historySearch.toLowerCase();
      const matchesSearch = 
        order.orderNumber?.toLowerCase().includes(searchLower) ||
        order.customerInfo?.firstName?.toLowerCase().includes(searchLower) ||
        order.customerInfo?.lastName?.toLowerCase().includes(searchLower) ||
        order.customerInfo?.phone?.includes(searchLower) ||
        order.customerInfo?.email?.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }

    // Status filter
    if (historyStatusFilter !== 'all' && order.status !== historyStatusFilter) {
      return false;
    }

    // Order type filter
    if (historyOrderTypeFilter !== 'all') {
      if (historyOrderTypeFilter === 'takeaway') {
        if (order.orderType !== 'takeaway' && order.orderType !== 'pickup') {
          return false;
        }
      } else if (order.orderType !== historyOrderTypeFilter) {
        return false;
      }
    }

    // Date filter (single day)
    if (historySelectedDate) {
      if (!order.timestamp) return false;
      const orderDate = new Date(order.timestamp);
      if (Number.isNaN(orderDate.getTime())) return false;
      const selectedDate = new Date(historySelectedDate);
      if (orderDate.toDateString() !== selectedDate.toDateString()) return false;
    }

    return true;
  }).sort((a, b) => b.timestamp - a.timestamp);

  const updateMenuSavingKeys = (key, isSaving) => {
    setMenuSavingKeys(prev => {
      const updated = new Set(prev);
      if (isSaving) {
        updated.add(key);
      } else {
        updated.delete(key);
      }
      return updated;
    });
  };

  const updateMenuItemAvailability = async (item, available) => {
    if (!item.docId) return;
    const savingKey = `item-${item.docId}`;
    updateMenuSavingKeys(savingKey, true);
    try {
      const itemRef = doc(db, 'menuItems', item.docId);
      await updateDoc(itemRef, {
        available,
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error('Error updating item availability:', error);
      alert('Failed to update item availability. Please try again.');
    } finally {
      updateMenuSavingKeys(savingKey, false);
    }
  };

  const updateMenuVariationAvailability = async (item, variationId, variationIndex, available) => {
    if (!item.docId) return;
    const savingKey = `variation-${item.docId}-${variationId ?? variationIndex}`;
    updateMenuSavingKeys(savingKey, true);

    try {
      const updatedVariations = (item.variations || []).map((variation, index) => {
        const matches = variation.id ? variation.id === variationId : index === variationIndex;
        if (matches) {
          return { ...variation, available };
        }
        return variation;
      });

      const itemRef = doc(db, 'menuItems', item.docId);
      await updateDoc(itemRef, {
        variations: updatedVariations,
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error('Error updating variation availability:', error);
      alert('Failed to update variation availability. Please try again.');
    } finally {
      updateMenuSavingKeys(savingKey, false);
    }
  };

  const menuCategories = Array.from(
    new Set(menuItems.map(item => item.category).filter(Boolean))
  ).sort();

  const filteredMenuItems = menuItems.filter(item => {
    const matchesCategory = menuCategoryFilter === 'all' || item.category === menuCategoryFilter;
    if (!matchesCategory) return false;

    if (!menuSearch.trim()) return true;
    const search = menuSearch.trim().toLowerCase();
    const nameMatch = item.name?.toLowerCase().includes(search);
    const variationMatch = (item.variations || []).some(variation =>
      variation.name?.toLowerCase().includes(search)
    );
    return nameMatch || variationMatch;
  });

  // Toggle order expansion in history view
  const toggleOrderExpansion = (orderId) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const getOrderTypeCount = (type) => {
    // Only count active orders (not completed) for today's orders
    const sourceOrders = todayOrders.filter(order => order.status !== 'completed');
    if (type === 'takeaway') {
      // Include both 'takeaway' and 'pickup' orders in the takeaway count
      return sourceOrders.filter(order => 
        order.orderType === 'takeaway' || order.orderType === 'pickup'
      ).length;
    }
    return sourceOrders.filter(order => order.orderType === type).length;
  };

  const getStatusCount = (status) => {
    return todayOrders.filter(order => order.status === status).length;
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

  const headerContent = {
    today: {
      title: 'Restaurant Orders',
      subtitle: 'Manage and track all incoming orders'
    },
    history: {
      title: 'Order History',
      subtitle: 'View and search through all past orders'
    },
    menu: {
      title: 'Menu Availability',
      subtitle: 'Manage menu items and availability on the main website'
    }
  };

  const activeHeader = headerContent[viewMode] || headerContent.today;

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
          <div>
            <h1>{activeHeader.title}</h1>
            <p>{activeHeader.subtitle}</p>
          </div>
        </div>
        <div className="header-right">
          {viewMode !== 'menu' && (
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
          )}
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
        <div className={`side-menu ${isSideMenuExpanded ? 'expanded' : 'collapsed'}`}>
          <div className="menu-header">
            {isSideMenuExpanded && <span className="menu-title">Menu</span>}
            <button
              className="menu-toggle"
              onClick={() => setIsSideMenuExpanded(prev => !prev)}
              aria-label={isSideMenuExpanded ? 'Collapse side menu' : 'Expand side menu'}
            >
              {isSideMenuExpanded ? <FaChevronLeft /> : <FaChevronRight />}
            </button>
          </div>
          <div className="menu-list">
            <button
              className={`menu-item ${viewMode === 'today' ? 'active' : ''}`}
              onClick={() => setViewMode('today')}
            >
              <FaUtensils />
              <span className="menu-text">Dashboard</span>
            </button>
            <button
              className={`menu-item ${viewMode === 'history' ? 'active' : ''}`}
              onClick={() => {
                setViewMode('history');
                setSelectedOrder(null);
              }}
            >
              <FaHistory />
              <span className="menu-text">Order History</span>
            </button>
            <button
              className={`menu-item ${viewMode === 'menu' ? 'active' : ''}`}
              onClick={() => {
                setViewMode('menu');
                setSelectedOrder(null);
              }}
            >
              <FaListAlt />
              <span className="menu-text">Menu Availability</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          {/* Filters - Only show for today's view */}
          {viewMode === 'today' && (
          <div className="filters-section">
            {/* Order Type Filter */}
            <div className="filter-group">
              <div className="filter-buttons">
                <button 
                  className={`filter-btn ${selectedOrderType === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedOrderType('all')}
                >
                  <FaCheck />
                  All Orders ({todayOrders.filter(order => order.status !== 'completed').length})
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
          )}

          {/* Orders Grid - Only show for today's view */}
          {viewMode === 'today' && (
          <div className="orders-grid">
            {(() => {
              const groupedOrders = getGroupedOrders();
              
              if (selectedStatus !== 'all') {
                // Render orders normally for specific status selection
                return filteredOrders.map((order) => {
                  const isPinging = pingingOrders.has(order.id);
                  return (
                  <div 
                    key={order.id} 
                    className={`order-card ${selectedOrder?.id === order.id ? 'selected' : ''} ${isPinging ? 'pinging' : ''}`}
                    onClick={() => {
                      handleOrderClick(order.id);
                      setSelectedOrder(order);
                    }}
                    style={{ 
                      cursor: 'pointer',
                      animation: isPinging ? 'pingPulse 1s ease-in-out infinite' : 'none',
                      boxShadow: isPinging ? '0 0 0 3px rgba(255, 107, 53, 0.3)' : undefined
                    }}
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
                  );
                });
              } else {
                // Render grouped orders for "All Status" view
                return Object.entries(groupedOrders).map(([status, orders]) => {
                  if (orders.length === 0) return null;
                  
                  return (
                    <React.Fragment key={status}>
                      {renderStatusSectionHeader(status, orders.length)}
                      {orders.map((order) => {
                        const isPinging = pingingOrders.has(order.id);
                        return (
                        <div 
                          key={order.id} 
                          className={`order-card ${selectedOrder?.id === order.id ? 'selected' : ''} ${isPinging ? 'pinging' : ''}`}
                          onClick={() => {
                            handleOrderClick(order.id);
                            setSelectedOrder(order);
                          }}
                          style={{ 
                            cursor: 'pointer',
                            animation: isPinging ? 'pingPulse 1s ease-in-out infinite' : 'none',
                            boxShadow: isPinging ? '0 0 0 3px rgba(255, 107, 53, 0.3)' : undefined
                          }}
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
                        );
                      })}
                    </React.Fragment>
                  );
                });
              }
            })()}
          </div>
          )}

          {/* Order History Table View */}
          {viewMode === 'history' && (
            <div style={{ padding: '1rem' }}>
              {/* Search and Filters */}
              <div style={{ 
                marginBottom: '1.5rem', 
                display: 'flex', 
                gap: '1rem', 
                flexWrap: 'wrap',
                alignItems: 'center'
              }}>
                <div style={{ flex: '1', minWidth: '200px' }}>
                  <div style={{ position: 'relative' }}>
                    <FaSearch style={{ 
                      position: 'absolute', 
                      left: '0.75rem', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      color: '#6b7280'
                    }} />
                    <input
                      type="text"
                      placeholder="Search by order number, customer name, phone, or email..."
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        height: '48px'
                      }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <input
                      type={historyDateInputType}
                      value={historySelectedDate}
                      onChange={(e) => setHistorySelectedDate(e.target.value)}
                      onFocus={() => setHistoryDateInputType('date')}
                      onBlur={(e) => {
                        if (!e.target.value) {
                          setHistoryDateInputType('text');
                        }
                      }}
                      placeholder="Select date"
                      aria-label="Select date"
                      className="history-date-input"
                      style={{
                        padding: '0.75rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        minWidth: '150px',
                        height: '48px'
                      }}
                    />
                  </div>
                  {historySelectedDate && (
                    <button
                      type="button"
                      onClick={() => setHistorySelectedDate('')}
                      style={{
                        padding: '0.6rem 0.9rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        backgroundColor: '#f9fafb',
                        color: '#374151',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        height: '48px'
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>
                <select
                  value={historyStatusFilter}
                  onChange={(e) => setHistoryStatusFilter(e.target.value)}
                  style={{
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    minWidth: '150px'
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="completed">Completed</option>
                </select>
                <select
                  value={historyOrderTypeFilter}
                  onChange={(e) => setHistoryOrderTypeFilter(e.target.value)}
                  style={{
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    minWidth: '150px'
                  }}
                >
                  <option value="all">All Types</option>
                  <option value="dine-in">Dine-In</option>
                  <option value="takeaway">Takeaway</option>
                  <option value="delivery">Delivery</option>
                </select>
              </div>

              {/* Orders Table */}
              <div style={{ 
                backgroundColor: 'white', 
                borderRadius: '8px', 
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Order #</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Customer</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Type</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Status</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Items</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Total</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Date/Time</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistoryOrders.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                          No orders found
                        </td>
                      </tr>
                    ) : (
                      filteredHistoryOrders.map((order) => {
                        const isExpanded = expandedOrders.has(order.id);
                        return (
                          <React.Fragment key={order.id}>
                            <tr 
                              style={{ 
                                borderBottom: '1px solid #e5e7eb',
                                cursor: 'pointer',
                                backgroundColor: isExpanded ? '#f9fafb' : 'white'
                              }}
                              onClick={() => toggleOrderExpansion(order.id)}
                            >
                              <td style={{ padding: '1rem', fontWeight: '600', color: '#111827' }}>
                                {order.orderNumber || `#${order.id.slice(-6).toUpperCase()}`}
                              </td>
                              <td style={{ padding: '1rem', color: '#111827', fontWeight: '500' }}>
                                {(() => {
                                  const firstName = order.customerInfo?.firstName || '';
                                  const lastName = order.customerInfo?.lastName || '';
                                  const fullName = `${firstName} ${lastName}`.trim();
                                  const name = order.customerInfo?.name || '';
                                  
                                  if (fullName) {
                                    return fullName;
                                  } else if (name) {
                                    return name;
                                  } else {
                                    return 'Customer';
                                  }
                                })()}
                              </td>
                              <td style={{ padding: '1rem' }}>
                                <span style={{ 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  gap: '0.5rem',
                                  color: getOrderTypeColor(order.orderType)
                                }}>
                                  {getOrderTypeIcon(order.orderType)}
                                  {getOrderTypeLabel(order.orderType)}
                                </span>
                              </td>
                              <td style={{ padding: '1rem' }}>
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  color: getStatusColor(order.status)
                                }}>
                                  <span className="status-dot" style={{ backgroundColor: getStatusColor(order.status) }}></span>
                                  {order.status === 'preparing' ? 'Preparing' : 
                                   order.status === 'ready' ? 'Ready' : 
                                   order.status === 'completed' ? 'Completed' : 'Pending'}
                                </span>
                              </td>
                              <td style={{ padding: '1rem', color: '#6b7280' }}>
                                {order.items?.length || 0} items
                              </td>
                              <td style={{ padding: '1rem', fontWeight: '600', color: '#111827' }}>
                                ${order.amount?.toFixed(2) || '0.00'}
                              </td>
                              <td style={{ padding: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                                {formatTimestamp(order.timestamp)}
                                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                                  {new Date(order.timestamp).toLocaleDateString()}
                                </div>
                              </td>
                              <td style={{ padding: '1rem', textAlign: 'center' }}>
                                {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr>
                                <td colSpan="8" style={{ padding: '1.5rem', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div>
                                      <h4 style={{ marginBottom: '0.75rem', color: '#111827', fontSize: '1rem', fontWeight: '600' }}>Customer Information</h4>
                                      <div style={{ fontSize: '0.875rem', color: '#374151', lineHeight: '1.75' }}>
                                        <div><strong>Name:</strong> {order.customerInfo?.firstName} {order.customerInfo?.lastName}</div>
                                        <div><strong>Email:</strong> {order.customerInfo?.email || 'N/A'}</div>
                                        <div><strong>Phone:</strong> {order.customerInfo?.phone || 'N/A'}</div>
                                        {order.customerInfo?.address && (
                                          <div><strong>Address:</strong> {order.customerInfo.address}</div>
                                        )}
                                      </div>
                                    </div>
                                    <div>
                                      <h4 style={{ marginBottom: '0.75rem', color: '#111827', fontSize: '1rem', fontWeight: '600' }}>Order Items</h4>
                                      <div style={{ fontSize: '0.875rem', color: '#374151' }}>
                                        {order.items?.map((item, index) => (
                                          <div key={index} style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                            <span>{item.quantity}x {item.name}</span>
                                            <span style={{ fontWeight: '600' }}>${(item.price * item.quantity).toFixed(2)}</span>
                                          </div>
                                        ))}
                                        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #e5e7eb' }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                            <span>Subtotal:</span>
                                            <span>${order.subtotal?.toFixed(2) || '0.00'}</span>
                                          </div>
                                          {order.serviceFee > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                              <span>Service Fee:</span>
                                              <span>${order.serviceFee?.toFixed(2) || '0.00'}</span>
                                            </div>
                                          )}
                                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #e5e7eb' }}>
                                            <span>Total:</span>
                                            <span>${order.amount?.toFixed(2) || '0.00'}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePrintOrder(order);
                                      }}
                                      style={{
                                        padding: '0.5rem 1rem',
                                        backgroundColor: '#6b7280',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        fontSize: '0.875rem'
                                      }}
                                    >
                                      <FaPrint />
                                      Print Order
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Menu Availability View */}
          {viewMode === 'menu' && (
            <div style={{ padding: '1rem' }}>
              {menuLoading ? (
                <div className="text-center p-8">
                  <div className="loading-spinner"></div>
                  <p className="mt-4">Loading menu items...</p>
                </div>
              ) : menuError ? (
                <div className="text-center p-8">
                  <p style={{ color: '#dc3545' }}>{menuError}</p>
                </div>
              ) : (
                <>
                  <div className="menu-availability-toolbar">
                    <input
                      type="text"
                      className="menu-availability-search"
                      placeholder="Search menu items or variations..."
                      value={menuSearch}
                      onChange={(e) => setMenuSearch(e.target.value)}
                    />
                    <select
                      className="menu-availability-filter"
                      value={menuCategoryFilter}
                      onChange={(e) => setMenuCategoryFilter(e.target.value)}
                    >
                      <option value="all">All categories</option>
                      {menuCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    <div className="menu-availability-meta">
                      {filteredMenuItems.length} item{filteredMenuItems.length !== 1 ? 's' : ''} shown
                    </div>
                  </div>

                  {filteredMenuItems.length === 0 ? (
                    <div className="text-center p-8" style={{ color: '#6b7280' }}>
                      No menu items match your filters.
                    </div>
                  ) : (
                    <div className="menu-availability-list">
                      {filteredMenuItems.map((item) => {
                        const itemAvailable = item.available !== false;
                        const itemKey = item.docId || item.id;
                        const itemSaving = menuSavingKeys.has(`item-${item.docId}`);

                        return (
                          <div key={itemKey} className="menu-availability-card">
                            <div className="menu-availability-header">
                              <div>
                                <h3 className="menu-availability-title">{item.name || 'Unnamed item'}</h3>
                                <div className="menu-availability-meta">
                                  {(item.category || 'Uncategorized')} • Base ${item.price?.toFixed(2) || '0.00'}
                                </div>
                              </div>
                              <label className="menu-availability-toggle">
                                <input
                                  type="checkbox"
                                  checked={itemAvailable}
                                  onChange={(e) => updateMenuItemAvailability(item, e.target.checked)}
                                  disabled={itemSaving}
                                />
                                {itemSaving ? 'Saving...' : itemAvailable ? 'Available' : 'Unavailable'}
                              </label>
                            </div>

                            {item.variations?.length > 0 && (
                              <div className="menu-availability-variations">
                                {item.variations.map((variation, index) => {
                                  const variationAvailable = variation.available !== false;
                                  const variationKey = `variation-${item.docId}-${variation.id || index}`;
                                  const variationSaving = menuSavingKeys.has(variationKey);

                                  return (
                                    <div key={variation.id || `${itemKey}-${index}`} className="menu-availability-variation">
                                      <div>
                                        <div className="menu-availability-variation-name">
                                          {variation.name || 'Variation'}
                                        </div>
                                        <div className="menu-availability-variation-price">
                                          ${variation.price?.toFixed(2) || item.price?.toFixed(2) || '0.00'}
                                        </div>
                                      </div>
                                      <label className="menu-availability-toggle">
                                        <input
                                          type="checkbox"
                                          checked={variationAvailable}
                                          onChange={(e) => updateMenuVariationAvailability(item, variation.id, index, e.target.checked)}
                                          disabled={variationSaving}
                                        />
                                        {variationSaving ? 'Saving...' : variationAvailable ? 'Available' : 'Unavailable'}
                                      </label>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Order Details Sidebar */}
        {selectedOrder && viewMode === 'today' && (
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