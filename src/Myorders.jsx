import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaSignOutAlt, FaHome, FaHeadphones, FaBars, FaTimes } from "react-icons/fa";
import { getOrders, saveOrder } from "./utils/orderStorage";
import "./Dashboard.css";

const Myorders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const userId = localStorage.getItem("userId");
  console.log('🔑 Current userId in Myorders:', userId);

  useEffect(() => {
    const loadOrders = async () => {
      console.log('🔄 Starting to load orders...');
      
      if (!userId) {
        console.log('❌ No userId found in localStorage');
        setError("Please login to view your orders");
        setLoading(false);
        return;
      }

      try {
        // First try to get orders from localStorage
        console.log('📦 Fetching orders from localStorage...');
        const localOrders = getOrders() || [];
        console.log('📝 All orders from localStorage:', localOrders);
        
        // Filter orders for current user with fallback
        const userOrders = localOrders.filter(order => {
          const hasUserId = order.userId === userId;
          const hasImage = order.productImage || (order.productId && order.productId.imageUrl);
          console.log('Comparing order.userId:', order.userId, 'with current userId:', userId, 'Has image:', hasImage);
          return hasUserId && hasImage;
        });
        
        console.log('📊 Filtered user orders from localStorage:', userOrders);
        
        if (userOrders.length > 0) {
          setOrders(userOrders);
          setLoading(false);
          return;
        }

        // If no local orders, try API
        console.log("🌐 Fetching orders from API for userId:", userId);
        const response = await fetch(`http://localhost:3000/api/orders/user/${userId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          console.log('❌ API response not OK:', response.status, response.statusText);
          setError(`API error: ${response.status} - ${response.statusText}`);
          setOrders([]);
          setLoading(false);
          return;
        }

        const result = await response.json();
        console.log('📥 API response:', result);
        
        if (!result.success) {
          throw new Error(result.message || 'API success flag is false');
        }

        // Save API orders to localStorage with fallback
        if (result.data && result.data.length > 0) {
          result.data.forEach(order => {
            const imageUrl = order.productId?.imageUrl || "https://via.placeholder.com/300x200";
            saveOrder({
              userId,
              productId: order.productId?._id || `temp_${Date.now()}`,
              productTitle: order.productId?.title || "Unnamed Product",
              productImage: imageUrl,
              productPrice: order.productId?.price || 0,
              quantity: order.quantity || 1,
              orderedAt: order.orderedAt || new Date().toISOString()
            });
            console.log('Saved order to localStorage:', { userId, productId: order.productId?._id, imageUrl });
          });
        } else {
          console.log('No data in API response');
        }

        setOrders(result.data || []);
      } catch (err) {
        console.error("❌ Error loading orders:", err.message);
        setError(`Failed to load orders: ${err.message}`);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [userId]);

  // Debug log when orders state changes
  useEffect(() => {
    console.log('🔄 Orders state updated:', orders);
  }, [orders]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    sessionStorage.clear();
    navigate("/login");
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        {/* Mobile Menu Toggle */}
        <button 
          className="mobile-menu-toggle d-md-none" 
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <nav>
            <ul className="menu-list">
              <li><Link to="/user/dashboard" className="menu-item" onClick={() => setMobileMenuOpen(false)}><FaHome /> Home</Link></li>
              <li><Link to="/myorders" className="menu-item active" onClick={() => setMobileMenuOpen(false)}><FaHeadphones /> My Orders</Link></li>
              <li>
                <button onClick={handleLogout} className="logout-btn">
                  <FaSignOutAlt />
                  <span>Log Out</span>
                </button>
              </li>
            </ul>
          </nav>
        </aside>

        <div className="main-content">
          <header className="top-nav">
            <h1>My Orders</h1>
          </header>
          <div className="loading text-center">
            <div className="spinner"></div>
            <p>Loading your orders...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        {/* Mobile Menu Toggle */}
        <button 
          className="mobile-menu-toggle d-md-none" 
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <nav>
            <ul className="menu-list">
              <li><Link to="/user/dashboard" className="menu-item" onClick={() => setMobileMenuOpen(false)}><FaHome /> Home</Link></li>
              <li><Link to="/myorders" className="menu-item active" onClick={() => setMobileMenuOpen(false)}><FaHeadphones /> My Orders</Link></li>
              <li>
                <button onClick={handleLogout} className="logout-btn">
                  <FaSignOutAlt />
                  <span>Log Out</span>
                </button>
              </li>
            </ul>
          </nav>
        </aside>

        <div className="main-content">
          <header className="top-nav">
            <h1>My Orders</h1>
          </header>
          <div className="alert alert-danger text-center">
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className="btn btn-primary">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Mobile Menu Toggle */}
      <button 
        className="mobile-menu-toggle d-md-none" 
        onClick={toggleMobileMenu}
        aria-label="Toggle mobile menu"
      >
        {mobileMenuOpen ? <FaTimes /> : <FaBars />}
      </button>

      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <nav>
          <ul className="menu-list">
            <li><Link to="/user/dashboard" className="menu-item" onClick={() => setMobileMenuOpen(false)}><FaHome /> Home</Link></li>
            <li><Link to="/myorders" className="menu-item active" onClick={() => setMobileMenuOpen(false)}><FaHeadphones /> My Orders</Link></li>
            <li>
              <button onClick={handleLogout} className="logout-btn">
                <FaSignOutAlt />
                <span>Log Out</span>
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      <div className="main-content">
        <header className="top-nav">
          <h1>My Orders</h1>
        </header>

        <main className="dashboard-content">
          {!orders || orders.length === 0 ? (
            <div className="text-center">
              <div className="empty-state-icon">📦</div>
              <h2>No Orders Yet</h2>
              <p>Start shopping to see your orders here!</p>
              <button onClick={() => navigate("/user/dashboard")} className="btn btn-primary">
                Browse Products
              </button>
            </div>
          ) : (
            <div className="dashboard-grid">
              {orders.map((order) => (
                <div key={order._id || order.productId} className="card">
                  <div className="order-status-badge">
                    {order.status || "Completed"}
                  </div>
                  <img 
                    src={order.productId?.imageUrl || order.productImage || "https://via.placeholder.com/300x200?text=No+Image"} 
                    alt={order.productId?.title || order.productTitle || "Product Image"} 
                    className="item-image"
                    onError={(e) => {
                      console.error(`Image failed to load for order ${order._id || order.productId}: ${e.target.src}`);
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/300x200?text=No+Image";
                    }}
                    style={{ display: order.productId?.imageUrl || order.productImage ? 'block' : 'none' }}
                  />
                  <div className="card-body">
                    <h3 className="item-title">{order.productId?.title || order.productTitle || "Product Title Not Available"}</h3>
                    <div className="order-info">
                      <div className="order-info-row">
                        <span className="info-label">Quantity:</span>
                        <span className="info-value">{order.quantity}</span>
                      </div>
                      <div className="order-info-row">
                        <span className="info-label">Total:</span>
                        <span className="info-value price">₹{(order.productId?.price || order.productPrice || 0) * order.quantity || "N/A"}</span>
                      </div>
                      <div className="order-info-row">
                        <span className="info-label">Order Date:</span>
                        <span className="info-value">{new Date(order.orderedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Myorders;