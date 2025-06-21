// Utility functions for order storage
export const saveOrder = (orderData) => {
  try {
    console.log('🔍 Attempting to save order with data:', orderData);
    console.log('🔑 Current userId from localStorage:', localStorage.getItem('userId'));
    
    // Get existing orders
    const existingOrders = JSON.parse(localStorage.getItem('userOrders') || '[]');
    console.log('📦 Existing orders in localStorage:', existingOrders);
    
    // Format the order data
    const newOrder = {
      _id: `order_${Date.now()}`,
      userId: localStorage.getItem('userId'),
      productId: {
        _id: orderData.productId,
        title: orderData.productTitle,
        imageUrl: orderData.productImage,
        price: orderData.productPrice
      },
      quantity: orderData.quantity,
      orderedAt: new Date().toISOString(),
      status: 'completed'
    };
    
    console.log('📝 Formatted new order:', newOrder);
    
    // Add to existing orders
    const updatedOrders = [...existingOrders, newOrder];
    console.log('📦 Updated orders array:', updatedOrders);
    
    // Save back to localStorage
    localStorage.setItem('userOrders', JSON.stringify(updatedOrders));
    console.log('✅ Order saved successfully to localStorage');
    
    return true;
  } catch (error) {
    console.error('❌ Error saving order:', error);
    return false;
  }
};

export const getOrders = () => {
  try {
    console.log('🔍 Attempting to get orders from localStorage');
    const rawOrders = localStorage.getItem('userOrders');
    console.log('📦 Raw orders from localStorage:', rawOrders);
    
    const orders = JSON.parse(rawOrders || '[]');
    console.log('📝 Parsed orders:', orders);
    
    return orders;
  } catch (error) {
    console.error('❌ Error getting orders:', error);
    return [];
  }
};

export const clearOrders = () => {
  try {
    console.log('🧹 Clearing all orders from localStorage');
    localStorage.removeItem('userOrders');
    console.log('✅ Orders cleared successfully');
    return true;
  } catch (error) {
    console.error('❌ Error clearing orders:', error);
    return false;
  }
}; 