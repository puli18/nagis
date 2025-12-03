import React, { useState, useEffect, useCallback } from 'react';
import { 
  FaUtensils, 
  FaClipboardList, 
  FaChartBar, 
  FaCog, 
  FaEdit, 
  FaTrash, 
  FaPlus,
  FaStar,
  FaDollarSign,
  FaClock,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaCreditCard,
  FaLink
} from 'react-icons/fa';
import { getMenuItemsFromFirebase, getCategoriesFromFirebase } from '../utils/firebaseUpload';
import { ref, get, update, remove } from 'firebase/database';
import { collection, addDoc, updateDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { realtimeDb, db } from '../firebase/config';
import { getFunctions, httpsCallable } from 'firebase/functions';

const AdminPage = () => {
  // State management
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    menuItems: 0,
    categories: 0
  });
  const [stripeAccount, setStripeAccount] = useState(null);
  const [isConnectingStripe, setIsConnectingStripe] = useState(false);

  // Form states
  const [editingItem, setEditingItem] = useState(null);
  const [showAddItemForm, setShowAddItemForm] = useState(false);

  // New item/category form data
  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
    dietary: [],
    popular: false,
    image: ''
  });

  // Handle form input changes - use a more stable approach
  const handleItemInputChange = useCallback((field, value) => {
    console.log('Input change:', field, value);
    setNewItem(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      console.log('Updated item state:', updated);
      return updated;
    });
  }, []);

  // Load data on component mount
  useEffect(() => {
    loadAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadOrders(),
        loadMenuItems(),
        loadCategories(),
        loadStripeAccount()
      ]);
      calculateStats();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const ordersRef = ref(realtimeDb, 'orders');
      const snapshot = await get(ordersRef);
      if (snapshot.exists()) {
        const ordersData = [];
        snapshot.forEach((childSnapshot) => {
          ordersData.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        setOrders(ordersData.sort((a, b) => b.timestamp - a.timestamp));
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const loadMenuItems = useCallback(async () => {
    try {
      const items = await getMenuItemsFromFirebase();
      setMenuItems(items);
    } catch (error) {
      console.error('Error loading menu items:', error);
    }
  }, []);

  const loadCategories = async () => {
    try {
      const cats = await getCategoriesFromFirebase();
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const calculateStats = () => {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(order => order.status === 'pending').length;
    const completedOrders = orders.filter(order => order.status === 'completed').length;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);

    setStats({
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue,
      menuItems: menuItems.length,
      categories: categories.length
    });
  };

  // Order management functions
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = ref(realtimeDb, `orders/${orderId}`);
      await update(orderRef, {
        status: newStatus,
        updatedAt: Date.now()
      });
      await loadOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const deleteOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        const orderRef = ref(realtimeDb, `orders/${orderId}`);
        await remove(orderRef);
        await loadOrders();
      } catch (error) {
        console.error('Error deleting order:', error);
      }
    }
  };

  // Menu management functions
  const handleAddItem = useCallback(async (e) => {
    e.preventDefault();
    try {
      console.log('Form submitted:', { newItem, editingItem });
      
      // Validate required fields
      if (!newItem.name || !newItem.category || !newItem.price) {
        alert('Please fill in all required fields (name, category, price)');
        return;
      }

      const itemData = {
        ...newItem,
        price: parseFloat(newItem.price),
        updatedAt: Date.now()
      };
      
      console.log('Item data to save:', itemData);
      
      if (editingItem) {
        // Update existing item in Firestore
        console.log('Updating item with ID:', editingItem.id);
        console.log('Editing item full data:', editingItem);
        
        // Find the document by searching for the item with this ID
        const menuItemsRef = collection(db, 'menuItems');
        const q = query(menuItemsRef, where('id', '==', editingItem.id));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const docRef = querySnapshot.docs[0].ref;
          await updateDoc(docRef, itemData);
          alert('Menu item updated successfully!');
        } else {
          throw new Error(`Menu item with ID ${editingItem.id} not found in Firestore`);
        }
      } else {
        // Add new item to Firestore
        itemData.createdAt = Date.now();
        
        console.log('Adding new item to Firestore');
        const menuItemsRef = collection(db, 'menuItems');
        const docRef = await addDoc(menuItemsRef, itemData);
        console.log('New item added with ID:', docRef.id);
        alert('Menu item added successfully!');
      }
      
      setShowAddItemForm(false);
      setEditingItem(null);
      setNewItem({ name: '', category: '', price: '', description: '', dietary: [], popular: false, image: '' });
      await loadMenuItems();
    } catch (error) {
      console.error('Error saving item:', error);
      alert(`Error saving item: ${error.message}`);
    }
  }, [newItem, editingItem, loadMenuItems]);



  const handleEditItem = useCallback((item) => {
    console.log('Editing item:', item);
    setEditingItem(item);
    setNewItem({
      name: item.name,
      category: item.category,
      price: item.price.toString(),
      description: item.description,
      dietary: item.dietary || [],
      popular: item.popular || false,
      image: item.image || ''
    });
    setShowAddItemForm(true);
  }, []);

  const handleDeleteItem = useCallback(async (itemId) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      try {
        console.log('Deleting item with ID:', itemId);
        
        // Find the document by searching for the item with this ID
        const menuItemsRef = collection(db, 'menuItems');
        const q = query(menuItemsRef, where('id', '==', itemId));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const docRef = querySnapshot.docs[0].ref;
          await deleteDoc(docRef);
          await loadMenuItems();
        } else {
          throw new Error(`Menu item with ID ${itemId} not found in Firestore`);
        }
      } catch (error) {
        console.error('Error deleting item:', error);
        alert(`Error deleting item: ${error.message}`);
      }
    }
    }, [loadMenuItems]);

  // Stripe Connect functions
  const createStripeOnboardingLink = async () => {
    try {
      setIsConnectingStripe(true);
      
      const functions = getFunctions();
      const createStripeOnboardingLinkFunction = httpsCallable(functions, 'createStripeOnboardingLink');

      const result = await createStripeOnboardingLinkFunction({});

      if (result.data?.success && result.data?.onboardingLink) {
        // Open onboarding link in new tab
        const onboardingWindow = window.open(result.data.onboardingLink, '_blank', 'noopener');
        
        if (!onboardingWindow) {
          alert('Popup was blocked. Please allow popups for this site and click the button again.');
        } else {
          // Update local state with account info
          setStripeAccount({
            accountId: result.data.accountId,
            status: result.data.status,
            onboardingLink: result.data.onboardingLink
          });
          
          alert('Stripe onboarding page opened in a new tab. Please complete the onboarding process. Once done, close that tab and click "Refresh Status" here.');
        }
      } else {
        const errorMessage = result.data?.error || 'Unable to create Stripe onboarding link.';
        alert(`Failed to create Stripe onboarding link: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error creating Stripe onboarding link:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsConnectingStripe(false);
    }
  };

  const loadStripeAccount = async () => {
    try {
      const accountRef = ref(realtimeDb, 'stripe/connectedAccount');
      const snapshot = await get(accountRef);
      
      if (snapshot.exists()) {
        const accountData = snapshot.val();
        setStripeAccount(accountData);
      }
    } catch (error) {
      console.error('Error loading Stripe account:', error);
    }
  };

  const getStripeAccountStatus = async () => {
    try {
      if (!stripeAccount?.accountId) return;
      
      const functions = getFunctions();
      const getStripeAccountStatusFunction = httpsCallable(functions, 'getStripeAccountStatus');
      
      const result = await getStripeAccountStatusFunction({
        accountId: stripeAccount.accountId,
      });
      
      if (result.data.success) {
        setStripeAccount(prev => ({
          ...prev,
          status: result.data.status,
          chargesEnabled: result.data.chargesEnabled,
          payoutsEnabled: result.data.payoutsEnabled
        }));
      }
    } catch (error) {
      console.error('Error getting Stripe account status:', error);
    }
  };

  


  // Utility functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-AU');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ffc107';
      case 'preparing': return '#17a2b8';
      case 'ready': return '#28a745';
      case 'completed': return '#6c757d';
      case 'cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  };


  // Tab content components
  const DashboardTab = () => (
    <div className="admin-dashboard">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <FaClipboardList />
          </div>
          <div className="stat-content">
            <h3>{stats.totalOrders}</h3>
            <p>Total Orders</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon pending">
            <FaClock />
          </div>
          <div className="stat-content">
            <h3>{stats.pendingOrders}</h3>
            <p>Pending Orders</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon completed">
            <FaStar />
            </div>
          <div className="stat-content">
            <h3>{stats.completedOrders}</h3>
            <p>Completed Orders</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon revenue">
            <FaDollarSign />
          </div>
          <div className="stat-content">
            <h3>{formatCurrency(stats.totalRevenue)}</h3>
            <p>Total Revenue</p>
          </div>
        </div>
      </div>


    </div>
  );

  const OrdersTab = () => (
    <div className="orders-management">
      <div className="section-header">
        <h3>Order Management</h3>
        <button className="btn btn-secondary" onClick={loadOrders}>
          Refresh Orders
            </button>
      </div>

      <div className="orders-grid">
        {orders.map((order) => (
          <div key={order.id} className="order-card detailed">
            <div className="order-header">
              <div className="order-number">#{order.id.slice(-6)}</div>
              <div className="order-status" style={{ backgroundColor: getStatusColor(order.status) }}>
                {order.status}
              </div>
          </div>
            
            <div className="customer-info">
              <h4>{order.customerInfo?.name || 'Customer'}</h4>
              <p><FaPhone /> {order.customerInfo?.phone || 'No phone'}</p>
              <p><FaEnvelope /> {order.customerInfo?.email || 'No email'}</p>
              {order.customerInfo?.address && (
                <p><FaMapMarkerAlt /> {order.customerInfo.address}</p>
              )}
            </div>
            
            <div className="order-items">
              <h5>Items ({order.items?.length || 0})</h5>
              {order.items?.map((item, index) => (
                <div key={index} className="order-item">
                  <span>{item.quantity}x {item.name}</span>
                  <span>{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            
            <div className="order-total">
              <div className="total-row">
                <span>Subtotal:</span>
                <span>{formatCurrency(order.subtotal || 0)}</span>
              </div>
              <div className="total-row">
                <span>Service Fee:</span>
                <span>{formatCurrency(order.serviceFee || 0)}</span>
              </div>
              <div className="total-row total">
                <span>Total:</span>
                <span>{formatCurrency(order.total || 0)}</span>
          </div>
        </div>

            <div className="order-actions">
              <select 
                value={order.status} 
                onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                className="status-select"
              >
                <option value="pending">Pending</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
          
          <button
                className="btn btn-danger"
                onClick={() => deleteOrder(order.id)}
          >
                <FaTrash />
          </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const MenuTab = () => (
    <div className="menu-management">
      <div className="section-header">
        <h3>Menu Management</h3>
        <button className="btn btn-primary" onClick={() => setShowAddItemForm(true)}>
          <FaPlus /> Add Item
        </button>
      </div>

      <div className="menu-grid">
        {menuItems.map((item) => (
          <div key={item.id} className="menu-item-card">
            <div className="item-image">
              {item.image ? (
                <img src={item.image} alt={item.name} />
              ) : (
                <div className="no-image">No Image</div>
              )}
        </div>

            <div className="item-content">
              <h4>{item.name}</h4>
              <p className="item-category">{item.category}</p>
              <p className="item-price">{formatCurrency(item.price)}</p>
              <p className="item-description">{item.description}</p>
              
              {item.dietary?.length > 0 && (
                <div className="dietary-tags">
                  {item.dietary.map((tag) => (
                    <span key={tag} className="dietary-tag">{tag}</span>
                  ))}
              </div>
              )}
              
              {item.popular && <span className="popular-badge">Popular</span>}
              </div>
              
            <div className="item-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => handleEditItem(item)}
                title="Edit item"
              >
                <FaEdit />
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDeleteItem(item.id)}
                title="Delete item"
              >
                <FaTrash />
              </button>
            </div>
                    </div>
                  ))}
      </div>

      {/* Add Item Modal */}
      {showAddItemForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</h3>
              <button onClick={() => {
                setShowAddItemForm(false);
                setEditingItem(null);
                setNewItem({ name: '', category: '', price: '', description: '', dietary: [], popular: false, image: '' });
              }}>×</button>
            </div>
            <form onSubmit={handleAddItem} key={editingItem ? `edit-${editingItem.id}` : 'add-new'}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => handleItemInputChange('name', e.target.value)}
                  required
                  autoFocus
                />
              </div>
              
              <div className="form-group">
                <label>Category</label>
                <select
                  value={newItem.category}
                  onChange={(e) => handleItemInputChange('category', e.target.value)}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={newItem.price}
                  onChange={(e) => handleItemInputChange('price', e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => handleItemInputChange('description', e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={newItem.popular}
                    onChange={(e) => handleItemInputChange('popular', e.target.checked)}
                  />
                  Popular Item
                </label>
              </div>
              
              <div className="modal-actions">
                <button type="button" onClick={() => {
                  setShowAddItemForm(false);
                  setEditingItem(null);
                  setNewItem({ name: '', category: '', price: '', description: '', dietary: [], popular: false, image: '' });
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingItem ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const AnalyticsTab = () => (
    <div className="analytics">
      <h3>Analytics & Reports</h3>
      
      <div className="analytics-grid">
        <div className="analytics-card">
          <h4>Order Statistics</h4>
          <div className="stat-item">
            <span>Total Orders:</span>
            <span>{stats.totalOrders}</span>
          </div>
          <div className="stat-item">
            <span>Pending Orders:</span>
            <span>{stats.pendingOrders}</span>
          </div>
          <div className="stat-item">
            <span>Completed Orders:</span>
            <span>{stats.completedOrders}</span>
          </div>
          <div className="stat-item">
            <span>Total Revenue:</span>
            <span>{formatCurrency(stats.totalRevenue)}</span>
          </div>
        </div>

        <div className="analytics-card">
          <h4>Menu Statistics</h4>
          <div className="stat-item">
            <span>Total Menu Items:</span>
            <span>{stats.menuItems}</span>
          </div>
          <div className="stat-item">
            <span>Categories:</span>
            <span>{stats.categories}</span>
            </div>
          <div className="stat-item">
            <span>Popular Items:</span>
            <span>{menuItems.filter(item => item.popular).length}</span>
          </div>
        </div>

        <div className="analytics-card">
          <h4>Recent Activity</h4>
          <div className="activity-list">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="activity-item">
                <div className="activity-icon">
                  <FaClipboardList />
                </div>
                <div className="activity-content">
                  <p>New order from {order.customerInfo?.name || 'Customer'}</p>
                  <small>{formatDate(order.timestamp)}</small>
                </div>
                </div>
              ))}
            </div>
          </div>
      </div>
    </div>
  );

  const SettingsTab = () => (
    <div className="settings">
      <h3>Settings & Configuration</h3>
      
      <div className="settings-grid">
        <div className="settings-card">
          <h4>Firebase Configuration</h4>
          <div className="setting-item">
            <span>Project ID:</span>
            <span>{process.env.REACT_APP_FIREBASE_PROJECT_ID || 'Not configured'}</span>
          </div>
          <div className="setting-item">
            <span>API Key:</span>
            <span>{process.env.REACT_APP_FIREBASE_API_KEY ? 'Configured' : 'Not configured'}</span>
          </div>
          <div className="setting-item">
            <span>Database URL:</span>
            <span>{process.env.REACT_APP_FIREBASE_DATABASE_URL || 'Not configured'}</span>
          </div>
                </div>

        <div className="settings-card">
          <h4>Stripe Configuration</h4>
          <div className="setting-item">
            <span>Publishable Key:</span>
            <span>{process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY ? 'Configured' : 'Not configured'}</span>
            </div>
          <div className="setting-item">
            <span>Restaurant Account:</span>
            <span>{process.env.RESTAURANT_STRIPE_ACCOUNT_ID || 'Not configured'}</span>
          </div>
        </div>

        <div className="settings-card">
          <h4>Stripe Connect Account</h4>
          {stripeAccount ? (
            <>
              <div className="setting-item">
                <span>Account ID:</span>
                <span>{stripeAccount.accountId || stripeAccount.id}</span>
              </div>
              <div className="setting-item">
                <span>Status:</span>
                <span style={{ 
                  color: stripeAccount.status === 'active' ? '#28a745' : 
                         stripeAccount.status === 'pending' ? '#ffc107' : '#dc3545'
                }}>
                  {stripeAccount.status}
                </span>
              </div>
              {stripeAccount.chargesEnabled !== undefined && (
                <div className="setting-item">
                  <span>Charges Enabled:</span>
                  <span style={{ color: stripeAccount.chargesEnabled ? '#28a745' : '#dc3545' }}>
                    {stripeAccount.chargesEnabled ? 'Yes' : 'No'}
                  </span>
                </div>
              )}
              {stripeAccount.payoutsEnabled !== undefined && (
                <div className="setting-item">
                  <span>Payouts Enabled:</span>
                  <span style={{ color: stripeAccount.payoutsEnabled ? '#28a745' : '#dc3545' }}>
                    {stripeAccount.payoutsEnabled ? 'Yes' : 'No'}
                  </span>
                </div>
              )}
              <div className="setting-item">
                <span>Created:</span>
                <span>{stripeAccount.createdAt ? new Date(stripeAccount.createdAt).toLocaleDateString() : 'Unknown'}</span>
              </div>
              <div className="d-flex gap-2 mt-3">
                <button 
                  className="btn btn-secondary"
                  onClick={getStripeAccountStatus}
                >
                  <FaCreditCard /> Refresh Status
                </button>
                {stripeAccount.accountLink && (
                  <button 
                    className="btn btn-primary"
                    onClick={() => window.open(stripeAccount.accountLink, '_blank')}
                  >
                    <FaLink /> Complete Onboarding
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center">
              <p className="mb-3">
                No Stripe Connect account configured. Click the button below to create a new Stripe Connect account and start the onboarding process.
              </p>
              <button 
                className="btn btn-primary"
                onClick={createStripeOnboardingLink}
                disabled={isConnectingStripe}
              >
                {isConnectingStripe ? (
                  <>
                    <div className="loading-spinner" style={{ width: '16px', height: '16px', marginRight: '8px' }}></div>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <FaCreditCard /> Start Stripe Onboarding
                  </>
                )}
              </button>
              <p className="mt-2" style={{ fontSize: '12px', color: '#666' }}>
                A new Stripe Connect account will be created and the onboarding page will open in a new tab. Complete the onboarding process, then close the tab and click "Refresh Status" here.
              </p>
            </div>
          )}
        </div>


      </div>
    </div>
  );

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Nagi's Ceylon Catering - Admin Panel</h1>
        <p>Manage your restaurant operations</p>
      </div>

      <div className="admin-layout">
        {/* Sidebar Navigation */}
        <div className="admin-sidebar">
          <nav className="admin-nav">
            <button 
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <FaChartBar /> Dashboard
            </button>
            
            <button 
              className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <FaClipboardList /> Orders
            </button>
            
            <button 
              className={`nav-item ${activeTab === 'menu' ? 'active' : ''}`}
              onClick={() => setActiveTab('menu')}
            >
              <FaUtensils /> Menu
            </button>
            
            <button 
              className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              <FaChartBar /> Analytics
            </button>
            
            <button 
              className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <FaCog /> Settings
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="admin-content">
          {isLoading ? (
            <div className="admin-loading">
              <div className="loading-spinner"></div>
              <p>Loading admin data...</p>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && <DashboardTab />}
              {activeTab === 'orders' && <OrdersTab />}
              {activeTab === 'menu' && <MenuTab />}
              {activeTab === 'analytics' && <AnalyticsTab />}
              {activeTab === 'settings' && <SettingsTab />}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage; 