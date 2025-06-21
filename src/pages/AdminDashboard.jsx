import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css"; // Ensure your CSS file is correctly linked

const AdminDashboard = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [productData, setProductData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    imageUrl: "",
    quantity: "",
  });
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Check admin role
  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "admin") {
      navigate("/login");
    }
  }, [navigate]);

  // Debug form validation state
  useEffect(() => {
    console.log("Form Validation State:", {
      title: productData.title.trim() !== "",
      description: productData.description.trim() !== "",
      price: productData.price !== "" && Number(productData.price) > 0,
      category: productData.category.trim() !== "",
      quantity: productData.quantity !== "" && Number(productData.quantity) > 0,
      imageUrl: productData.imageUrl.trim() !== "",
      uploading,
      isFormValid: isFormValid(),
    });
  }, [productData, uploading]);

  const uploadImageToCloudinary = async (fileToUpload) => {
    if (!fileToUpload) {
      setError("No file selected for upload.");
      return;
    }

    if (!fileToUpload.type.startsWith("image/")) {
      setError("Please select an image file (PNG, JPG, GIF).");
      return;
    }
    if (fileToUpload.size > 10 * 1024 * 1024) {
      setError("File size should be less than 10MB");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("image", fileToUpload);

    try {
      console.log("Uploading image to Cloudinary...");
      const response = await fetch("/api/upload/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
        credentials: "include",
      });

      const data = await response.json();
      console.log("Cloudinary Response:", data);

      if (!response.ok) {
        throw new Error(data.message || "Failed to upload image");
      }

      if (data.success) {
        setSuccess("Image uploaded successfully!");
        setProductData((prev) => ({
          ...prev,
          imageUrl: data.data.secure_url || data.data.url,
        }));
      } else {
        throw new Error(data.message || "Failed to upload image");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setError(error.message || "Failed to upload image. Please try again.");
      setProductData((prev) => ({ ...prev, imageUrl: "" }));
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError("");
      setSuccess("");

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);

      uploadImageToCloudinary(file);
    } else {
      setSelectedFile(null);
      setPreviewUrl("");
      setProductData((prev) => ({ ...prev, imageUrl: "" }));
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      handleFileSelect({ target: { files: [file] } });
      event.dataTransfer.clearData();
    }
  };

  const handleDragEnter = (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.add("drag-over");
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove("drag-over");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProductData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid()) {
      setError("Please fill in all required fields and ensure an image is uploaded.");
      setTimeout(() => setError(""), 3000);
      return;
    }

    try {
      console.log("Submitting product data:", {
        name: productData.title,
        description: productData.description,
        price: Number(productData.price),
        category: productData.category,
        cloudinary_link: productData.imageUrl,
        quantity: Number(productData.quantity),
      });

      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: productData.title,
          description: productData.description,
          price: Number(productData.price),
          category: productData.category,
          cloudinary_link: productData.imageUrl,
          quantity: Number(productData.quantity),
        }),
        credentials: "include",
      });

      const data = await response.json();
      console.log("Server response:", data);

      if (data.success) {
        setSuccess("Product added successfully!");

        const event = new CustomEvent("productAdded", {
          detail: {
            _id: data.product._id,
            name: data.product.name,
            description: data.product.description,
            price: data.product.price,
            category: data.product.category,
            cloudinary_link: data.product.cloudinary_link,
            quantity: data.product.quantity,
          },
        });
        window.dispatchEvent(event);

        setProductData({
          title: "",
          description: "",
          price: "",
          category: "",
          imageUrl: "",
          quantity: "",
        });
        setSelectedFile(null);
        setPreviewUrl("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        setTimeout(() => {
          setSuccess("");
          navigate("/user/dashboard");
        }, 2000);
      } else {
        setError(data.message || "Failed to add product");
        setTimeout(() => setError(""), 3000);
      }
    } catch (error) {
      console.error("Error adding product:", error);
      setError("Failed to add product. Please try again.");
      setTimeout(() => setError(""), 3000);
    }
  };

  const isFormValid = () => {
    return (
      productData.title.trim() !== "" &&
      productData.description.trim() !== "" &&
      productData.price !== "" &&
      Number(productData.price) > 0 &&
      productData.category.trim() !== "" &&
      productData.quantity !== "" &&
      Number(productData.quantity) > 0 &&
      productData.imageUrl.trim() !== ""
    );
  };

  return (
    <div className="admin-dashboard-container">
      <div className="product-form-card">
        <div className="form-header">
          <div className="icon-box">📦</div>
          <h2 className="form-title">Add New Product</h2>
          <p className="form-subtitle">Create a new product listing with detailed information</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-row">
            <div className="form-group full-width">
              <label htmlFor="product-title">Product Title</label>
              <input
                id="product-title"
                type="text"
                name="title"
                placeholder="Enter product title..."
                value={productData.title}
                onChange={handleInputChange}
                required
              />
              {productData.title.trim() === "" && (
                <span className="error">Title is required</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group description-group">
              <label htmlFor="product-description">Description</label>
              <textarea
                id="product-description"
                name="description"
                placeholder="Describe your product in detail..."
                value={productData.description}
                onChange={handleInputChange}
                required
              />
              {productData.description.trim() === "" && (
                <span className="error">Description is required</span>
              )}
            </div>

            <div className="form-group price-group">
              <label htmlFor="product-price">Price</label>
              <input
                id="product-price"
                type="number"
                name="price"
                placeholder="$ 0.00"
                value={productData.price}
                onChange={handleInputChange}
                required
                min="0.01"
                step="0.01"
              />
              {(productData.price === "" || Number(productData.price) <= 0) && (
                <span className="error">Enter a valid price greater than 0</span>
              )}
            </div>
          </div>

          <div className="form-row bottom-row">
            <div className="left-column">
              <div className="form-group category-group">
                <label htmlFor="product-category">Category</label>
                <select
                  id="product-category"
                  name="category"
                  value={productData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a category</option>
                  <option value="electronics">Electronics</option>
                  <option value="clothing">Clothing</option>
                  <option value="books">Books</option>
                  <option value="home-decor">Home Decor</option>
                  <option value="accessories">Accessories</option>
                </select>
                {productData.category.trim() === "" && (
                  <span className="error">Category is required</span>
                )}
              </div>

              <div className="form-group quantity-group">
                <label htmlFor="product-quantity">Quantity</label>
                <input
                  id="product-quantity"
                  type="number"
                  name="quantity"
                  placeholder="0"
                  value={productData.quantity}
                  onChange={handleInputChange}
                  required
                  min="1"
                />
                {(productData.quantity === "" || Number(productData.quantity) <= 0) && (
                  <span className="error">Enter a valid quantity greater than 0</span>
                )}
              </div>
            </div>

            <div
              className="form-group image-upload-area"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current.click()}
            >
              <label htmlFor="product-image" className="sr-only">Product Image</label>
              <input
                type="file"
                accept="image/png, image/jpeg, image/gif"
                onChange={handleFileSelect}
                ref={fileInputRef}
                id="product-image"
                style={{ display: "none" }}
                required
              />

              {!uploading && !productData.imageUrl && (
                <>
                  <div className="upload-icon">⬆️</div>
                  <p>Drop your image here, or click to browse</p>
                  <p className="file-info">PNG, JPG, GIF up to 10MB</p>
                </>
              )}

              {uploading && (
                <div className="uploading-state">
                  <div className="spinner"></div>
                  <p>Uploading image...</p>
                </div>
              )}

              {productData.imageUrl && !uploading && (
                <div className="uploaded-image-preview">
                  <img src={productData.imageUrl} alt="Uploaded Product" />
                  <p className="upload-success-message">Image uploaded successfully!</p>
                </div>
              )}

              {selectedFile && !productData.imageUrl && !uploading && previewUrl && (
                <div className="image-preview-thumbnail">
                  <img src={previewUrl} alt="Preview" />
                </div>
              )}
            </div>
            {!productData.imageUrl && !uploading && (
              <span className="error">Image is required</span>
            )}
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={!isFormValid() || uploading}
          >
            <span className="icon">+</span> Add Product
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;