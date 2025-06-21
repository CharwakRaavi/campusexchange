const jwt = require('jsonwebtoken');

// JWT Secret Key (should match the one in Usercontroller.js)
const JWT_SECRET = 'campus_exchange_super_secret_key_2024_secure_token_generation';

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid authentication token'
    });
  }
};

module.exports = auth; 