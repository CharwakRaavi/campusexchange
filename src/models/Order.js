const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true 
  },
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product',
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true, 
    default: 1 
  },
  paymentId: { 
    type: String, 
    required: true 
  },
  orderedAt: { 
    type: Date, 
    default: Date.now 
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'completed'
  }
});

module.exports = mongoose.model('Order', orderSchema);
