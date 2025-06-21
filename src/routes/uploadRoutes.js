const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const Image = require('../models/Imagemodel');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});
console.log('Cloudinary configuration:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? '***' : 'not set',
  api_secret: process.env.CLOUDINARY_API_SECRET ? '***' : 'not set'
});

// Route to handle image upload
router.post('/upload', auth, async (req, res) => {
  let tempFilePath = null;
  
  try {
    console.log('Received image upload request.');
    
    if (!req.files || !req.files.image) {
      return res.status(400).json({ 
        success: false,
        message: 'No image file provided' 
      });
    }

    const file = req.files.image;
    
    // Validate file type
    if (!file.mimetype.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        message: 'File must be an image'
      });
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'File size must be less than 5MB'
      });
    }

    console.log('File received by backend:', {
      name: file.name,
      size: file.size,
      mimetype: file.mimetype
    });

    // Ensure temp directory exists
    const tempDir = path.join(__dirname, '../../tmp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Move file to temp directory
    tempFilePath = path.join(tempDir, `${Date.now()}-${file.name}`);
    await file.mv(tempFilePath);

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(tempFilePath, {
      folder: 'borrowing_system',
      use_filename: true,
      unique_filename: true,
      resource_type: 'auto'
    });

    console.log('Cloudinary upload successful:', result.secure_url);

    // Create new image document
    const imageDoc = new Image({
      name: file.name,
      url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      size: result.bytes,
      uploadedBy: req.user.id // Use the ID from the decoded JWT token
    });

    // Save to MongoDB
    await imageDoc.save();
    console.log('Image details saved to MongoDB');

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: result.secure_url,
        public_id: result.public_id,
        imageId: imageDoc._id
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to upload image',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  } finally {
    // Clean up temp file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
});

// Route to get all images
router.get('/images', async (req, res) => {
  try {
    const images = await Image.find()
      .populate('uploadedBy', 'username')
      .sort({ uploadedAt: -1 });

    res.status(200).json({
      success: true,
      data: images
    });
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch images',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Route to delete an image
router.delete('/images/:id', async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(image.public_id);
    console.log('Image deleted from Cloudinary');

    // Delete from MongoDB
    await image.remove();
    console.log('Image details deleted from MongoDB');

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router; 