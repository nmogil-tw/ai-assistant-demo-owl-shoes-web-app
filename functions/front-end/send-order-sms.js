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
        const { formData, orderData } = event;

        // Check if user opted in for SMS
        if (!formData.smsOptIn) {
            response.setBody({
                success: true,
                message: "SMS not sent - user did not opt in"
            });
            return callback(null, response);
        }

        const client = context.getTwilioClient();

        // Format the items for SMS
        const itemsList = orderData.items
            .map(item => `${item.quantity}x ${item.name}`)
            .join('\n');

        // Construct the SMS message
        const message = `Thank you for your order!\n\n` +
            `Order ID: ${orderData.order_id}\n` +
            `Items:\n${itemsList}\n` +
            `Total Amount: $${orderData.total_amount.toFixed(2)}\n\n` +
            `Shipping to:\n` +
            `${formData.address}\n` +
            `${formData.city}, ${formData.state} ${formData.zipCode}`;

        // Send the SMS
        await client.messages.create({
            body: message,
            to: formData.phone,
            from: context.TWILIO_SMS_FROM_NUMBER
        });

        console.log("SMS sent successfully to:", formData.phone);

        response.setBody({
            success: true,
            message: "SMS sent successfully"
        });
        
        return callback(null, response);
        
    } catch (error) {
        console.error("Error sending SMS:", error.message);
        response.setStatusCode(500);
        response.setBody({ 
            success: false, 
            error: error.message || 'Error sending SMS'
        });
        return callback(null, response);
    }
};
