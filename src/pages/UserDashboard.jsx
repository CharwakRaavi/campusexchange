import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserDashboard.css';
import { FaSignOutAlt } from 'react-icons/fa';

const UserDashboard = () => {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [quantities, setQuantities] = useState({});
  const [razorpayReady, setRazorpayReady] = useState(false);
  const navigate = useNavigate();

  // Get userId from localStorage
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    // Check if user is logged in
    const role = localStorage.getItem('role');
    if (!role) {
      navigate('/login');
      return;
    }

    // Fetch products
    fetchProducts();

    // Listen for new product additions
    window.addEventListener('productAdded', handleProductAdded);

    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => setRazorpayReady(true);
    document.body.appendChild(script);

    return () => {
      window.removeEventListener('productAdded', handleProductAdded);
    };
  }, [navigate]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setProducts(data.products);
        // Initialize quantities for all products
        const initialQuantities = {};
        data.products.forEach((product) => {
          initialQuantities[product._id] = 1; // Default quantity is 1
        });
        setQuantities(initialQuantities);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products. Please try again later.');
    }
  };

  const handleProductAdded = (event) => {
    const newProduct = event.detail;
    setProducts(prevProducts => [...prevProducts, newProduct]);
  };

  const handleQuantityChange = (productId, change) => {
    setQuantities((prevQuantities) => {
      const newQuantity = Math.max(1, (prevQuantities[productId] || 1) + change);
      return {
        ...prevQuantities,
        [productId]: newQuantity,
      };
    });
  };

  const handlePayment = async (product) => {
    if (!userId) {
      navigate('/login');
      return;
    }

    const quantity = quantities[product._id];
    const amount = product.price * quantity;

    try {
      // Create Razorpay order
      const res = await fetch('/api/payment/order', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ amount }),
        credentials: 'include'
      });

      if (!res.ok) {
        throw new Error('Failed to create payment order');
      }

      const data = await res.json();
      if (!window.Razorpay) {
        throw new Error('Razorpay script not loaded');
      }

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: 'Campus Exchange',
        description: product.name,
        order_id: data.id,
        handler: async function (response) {
          try {
            // Save order in the backend
            const orderRes = await fetch('/api/orders/place', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({
                userId,
                productId: product._id,
                quantity,
                paymentId: response.razorpay_payment_id,
              }),
              credentials: 'include'
            });

            if (!orderRes.ok) {
              throw new Error('Failed to place order');
            }

            const orderData = await orderRes.json();
            
            setSuccess('Order placed successfully!');
            setTimeout(() => {
              setSuccess('');
              navigate('/myorders');
            }, 2000);
          } catch (err) {
            setError('Payment successful, but failed to place order. Please contact support.');
            setTimeout(() => setError(''), 3000);
          }
        },
        prefill: {
          name: 'User',
          email: 'user@example.com',
          contact: '9999999999'
        },
        theme: {
          color: '#6a11cb'
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      setError(`Payment failed: ${err.message}`);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    navigate('/login');
  };

  return (
    <div className="user-dashboard">
      <div className="dashboard-header">
        <h1>Available Products</h1>
        <button className="logout-btn" onClick={handleLogout}>
          <FaSignOutAlt /> Logout
        </button>
      </div>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <div className="products-grid">
        {products.map((product) => (
          <div
            key={product._id}
            className="product-card"
          >
            <img src={product.cloudinary_link} alt={product.name} />
            <div className="product-info">
              <h3>{product.name}</h3>
              <p className="description">{product.description}</p>
              <p className="price">₹{product.price}</p>
              <div className="quantity-selector">
                <button 
                  className="quantity-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuantityChange(product._id, -1);
                  }}
                >
                  -
                </button>
                <span>{quantities[product._id] || 1}</span>
                <button 
                  className="quantity-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuantityChange(product._id, 1);
                  }}
                >
                  +
                </button>
              </div>
              <button 
                className="order-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePayment(product);
                }}
                disabled={!razorpayReady}
              >
                Order
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserDashboard; 