const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");

// Middleware to ensure JSON responses
router.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

// GET route to fetch orders for a specific user
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: "User ID is required" 
      });
    }

    console.log("Fetching orders for userId:", userId);

    // Find orders and populate product details
    const orders = await Order.find({ userId })
      .populate({
        path: 'productId',
        select: 'title imageUrl price description'
      })
      .sort({ orderedAt: -1 });

    console.log("Found orders:", orders.length);

    return res.status(200).json({
      success: true,
      data: orders || []
    });

  } catch (error) {
    console.error("Error fetching user orders:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message
    });
  }
});

// Error handling middleware for this router
router.use((err, req, res, next) => {
  console.error("MyorderRoutes error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: err.message
  });
});

module.exports = router;