exports.handler = async function(context, event, callback) {
    // Set CORS headers
    const response = new Twilio.Response();
    response.appendHeader('Access-Control-Allow-Origin', '*');
    response.appendHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');
    response.appendHeader('Content-Type', 'application/json');

    // Handle preflight request
    if (event.request.method === 'OPTIONS') {
        return callback(null, response);
    }

    try {
        const client = require('airtable');
        const base = new client({apiKey: context.AIRTABLE_API_KEY}).base(context.AIRTABLE_BASE_ID);
        
        const { 
            items, 
            totalAmount, 
            customerId, 
            email, 
            phone, 
            isStorePickup = false, 
            storeId = '', 
            storeName = '' 
        } = event;
        
        // Debug logging
        console.log('Received order data:', {
            items: items || 'missing',
            totalAmount: totalAmount || 'missing',
            customerId: customerId || 'missing',
            email: email || 'missing',
            phone: phone || 'missing',
            isStorePickup,
            storeId: isStorePickup ? storeId : 'N/A',
            storeName: isStorePickup ? storeName : 'N/A'
        });
        
        // Validate required fields with specific error message
        const missingFields = [];
        if (!items) missingFields.push('items');
        if (!totalAmount) missingFields.push('totalAmount');
        if (!customerId) missingFields.push('customerId');
        if (!email) missingFields.push('email');
        if (!phone) missingFields.push('phone');
        
        // Validate store pickup fields if isStorePickup is true
        if (isStorePickup) {
            if (!storeId) missingFields.push('storeId');
            if (!storeName) missingFields.push('storeName');
        }
        
        if (missingFields.length > 0) {
            response.setStatusCode(400);
            response.setBody({ 
                success: false, 
                error: `Missing required fields: ${missingFields.join(', ')}` 
            });
            return callback(null, response);
        }

        // Generate random 6 digit order ID
        const orderId = Math.floor(100000 + Math.random() * 900000).toString();

        // Create order record
        const orderData = {
            "id": orderId,
            "customer_id": customerId,
            "items": JSON.stringify(items),
            "total_amount": totalAmount,
            "shipping_status": "pending",
            "email": email,
            "phone": phone
        };

        const newOrder = await base('orders').create(orderData);
        
        // Prepare response data
        const responseData = {
            id: orderId,
            items: JSON.parse(newOrder.fields.items),
            total_amount: newOrder.fields.total_amount,
            shipping_status: newOrder.fields.shipping_status,
            customer_id: newOrder.fields.customer_id,
            email: newOrder.fields.email,
            phone: newOrder.fields.phone
        };

        response.setBody({
            success: true,
            data: responseData
        });
        
        return callback(null, response);
        
    } catch (error) {
        console.error('Error in create-order:', error);
        response.setStatusCode(500);
        response.setBody({ 
            success: false, 
            error: error.message || 'Internal server error'
        });
        return callback(null, response);
    }
};