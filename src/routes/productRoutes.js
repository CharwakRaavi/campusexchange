const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Review = require('../models/Review');

router.post('/', async (req, res) => {
  try {
    const { name, description, price, category, cloudinary_link, quantity } = req.body;

    if (!name || !description || !price || !category || !cloudinary_link || !quantity) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    const newProduct = new Product({
      name,
      description,
      price,
      category,
      cloudinary_link,
      quantity
    });

    await newProduct.save();

    res.json({ 
      success: true, 
      message: 'Product added successfully',
      product: newProduct 
    });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add product', 
      error: error.message 
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch products', 
      error: error.message 
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const reviews = await Review.find({ product: req.params.id })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      product: {
        ...product.toObject(),
        reviews
      }
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
});

module.exports = router;
