import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaHome, FaHeadphones, FaBars, FaTimes } from "react-icons/fa";
import { saveOrder } from "./utils/orderStorage";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId) {
      navigate("/login");
    }
  }, [userId, navigate]);

  useEffect(() => {
    if (userId) {
      fetchProducts();
    }

    const handleProductAdded = (event) => {
      console.log("Product added event received:", event.detail);
      const newProduct = event.detail;
      setProducts((prevProducts) => {
        if (!prevProducts.some(p => p._id === newProduct._id)) {
          return [...prevProducts, newProduct];
        }
        return prevProducts;
      });
      setQuantities((prevQuantities) => ({
        ...prevQuantities,
        [newProduct._id]: prevQuantities[newProduct._id] || 1,
      }));
    };

    window.addEventListener("productAdded", handleProductAdded);
    return () => {
      window.removeEventListener("productAdded", handleProductAdded);
    };
  }, [userId]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/products", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();
      console.log("Raw API response:", data.products);
      if (data.success) {
        const allProducts = data.products.map(product => ({
          ...product,
          _id: product._id || `temp_${Date.now()}_${Math.random()}`, // Fallback _id
          cloudinary_link: product.cloudinary_link || "https://via.placeholder.com/300x200",
          name: product.name || "Unnamed Product",
          price: product.price || 0,
          description: product.description || "No description",
        }));
        setProducts(allProducts);
        const initialQuantities = {};
        allProducts.forEach((product) => {
          initialQuantities[product._id] = initialQuantities[product._id] || 1;
        });
        setQuantities(initialQuantities);
      } else {
        throw new Error(data.message || "Failed to fetch products");
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to load products. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => setRazorpayReady(true);
    script.onerror = () => {
      console.error("Failed to load Razorpay script");
      setRazorpayReady(true); // Fallback to enable buttons if script fails
    };
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async (product) => {
    if (!userId) {
      navigate("/login");
      return;
    }

    const quantity = quantities[product._id] || 1;
    const amount = (product.price || 0) * quantity;

    try {
      const res = await fetch("/api/payment/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ amount }),
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to create payment order");
      }

      const data = await res.json();
      console.log("Payment order created:", data);

      if (!window.Razorpay) {
        throw new Error("Razorpay script not loaded");
      }

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: "Campus Exchange",
        description: product.name,
        order_id: data.id,
        handler: async function (response) {
          try {
            const orderRes = await fetch("/api/orders/place", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
              },
              body: JSON.stringify({
                userId,
                productId: product._id,
                quantity,
                paymentId: response.razorpay_payment_id,
              }),
              credentials: "include",
            });

            if (!orderRes.ok) {
              throw new Error("Failed to place order");
            }

            const orderData = await orderRes.json();
            console.log("Order placed successfully:", orderData);

            const saved = saveOrder({
              productId: product._id,
              productTitle: product.name,
              productImage: product.cloudinary_link,
              productPrice: product.price,
              quantity: quantity,
            });

            if (saved) {
              console.log("Order saved to localStorage successfully");
            }

            alert("Order placed successfully!");
            navigate("/myorders");
          } catch (err) {
            console.error("Error placing order:", err);
            alert("Payment successful, but failed to place order. Please contact support.");
          }
        },
        prefill: {
          name: "User",
          email: "user@example.com",
          contact: "9999999999",
        },
        theme: {
          color: "#6a11cb",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error("Error during payment:", err);
      alert(`Payment failed: ${err.message}`);
    }
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

  if (!userId) {
    return null;
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
            <li><Link to="/myorders" className="menu-item" onClick={() => setMobileMenuOpen(false)}><FaHeadphones /> My Orders</Link></li>
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
        <header className="top-nav" />
        <main className="dashboard-content">
          {loading && <p className="text-center">Loading products...</p>}
          {error && <p className="error-message text-center">{error}</p>}

          {!loading && !error && (
            <div className="dashboard-grid">
              {products.length > 0 ? (
                products.map((product) => (
                  <div key={product._id} className="card">
                    <img src={product.cloudinary_link} alt={product.name} className="item-image" />
                    <div className="card-body">
                      <h3 className="item-title">{product.name}</h3>
                      <p className="item-description">{product.description}</p>
                      <p className="item-price">Price: ₹{product.price || 0}</p>

                      <div className="quantity-container">
                        <button
                          className="quantity-button"
                          onClick={() => handleQuantityChange(product._id, -1)}
                        >
                          -
                        </button>
                        <span className="quantity-value">{quantities[product._id] || 1}</span>
                        <button
                          className="quantity-button"
                          onClick={() => handleQuantityChange(product._id, 1)}
                        >
                          +
                        </button>
                      </div>

                      <button
                        className="btn btn-primary btn-block"
                        disabled={!razorpayReady}
                        onClick={() => handlePayment(product)}
                      >
                        Order
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center">No products available. Please check back later.</p>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;