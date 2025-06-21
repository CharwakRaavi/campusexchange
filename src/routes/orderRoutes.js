const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');

// POST route to place an order
router.post('/place', async (req, res) => {
  try {
    const { userId, productId, quantity, paymentId } = req.body;

    // Validate input
    if (!userId || !productId || !quantity || !paymentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    // Create a new order
    const newOrder = new Order({ 
      userId, 
      productId, 
      quantity, 
      paymentId,
      orderedAt: new Date()
    });

    // Save the order
    const savedOrder = await newOrder.save();

    // Populate product details
    const populatedOrder = await Order.findById(savedOrder._id)
      .populate({
        path: 'productId',
        select: 'title imageUrl price description'
      });

    res.status(201).json({ 
      success: true, 
      message: 'Order placed successfully', 
      data: populatedOrder 
    });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to place order', 
      error: error.message 
    });
  }
});

// GET route to fetch all orders (for admin)
router.get('/all', async (req, res) => {
  try {
    const orders = await Order.find()
      .populate({
        path: 'productId',
        select: 'title imageUrl price description'
      })
      .sort({ orderedAt: -1 });

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch orders', 
      error: error.message 
    });
  }
});

module.exports = router;