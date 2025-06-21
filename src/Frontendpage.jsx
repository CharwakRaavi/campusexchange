// frontendpage.jsx
import React, { useState } from "react";
import "./Dashboard.css"; // Reuse Dashboard.css for consistency

const ImageGallery = ({ images }) => {
  const [quantities, setQuantities] = useState({});

  // Initialize quantities for all images
  React.useEffect(() => {
    const initialQuantities = {};
    images.forEach((image) => {
      initialQuantities[image.id] = 1; // Default quantity is 1
    });
    setQuantities(initialQuantities);
  }, [images]);

  // Handle quantity change
  const handleQuantityChange = (imageId, change) => {
    setQuantities((prevQuantities) => {
      const newQuantity = Math.max(1, (prevQuantities[imageId] || 1) + change);
      return {
        ...prevQuantities,
        [imageId]: newQuantity,
      };
    });
  };

  // Placeholder for handlePayment (implement based on your payment logic)
  const handlePayment = (image) => {
    console.log("Order placed for:", image.title, "Quantity:", quantities[image.id]);
    // Add your payment logic here (e.g., Razorpay integration)
    alert("Order functionality to be implemented!");
  };

  return (
    <div className="image-gallery-container">
      {/* Spacer to prevent overlap with Search Bar */}
      <div className="spacer"></div>

      {/* Grid Layout for Images */}
      <div className="grid-container"> {/* Use grid-container from Dashboard.css */}
        {images.map((image) => (
          <div key={image.id} className="grid-item">
            <div className="image-container">
              <img
                src={image.url}
                alt={image.title}
                className="item-image"
              />
            </div>

            <div className="product-details">
              <h2 className="item-title">{image.title}</h2>
              <p className="item-description">{image.description}</p>
              <p className="item-price">₹{image.price}</p>

              <div className="quantity-container">
                <button
                  className="quantity-button"
                  onClick={() => handleQuantityChange(image.id, -1)}
                >
                  -
                </button>
                <span className="quantity-value">{quantities[image.id] || 1}</span>
                <button
                  className="quantity-button"
                  onClick={() => handleQuantityChange(image.id, 1)}
                >
                  +
                </button>
              </div>

              <button
                className="order-button"
                onClick={() => handlePayment(image)}
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

export default ImageGallery;