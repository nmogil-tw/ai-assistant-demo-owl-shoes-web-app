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

        // Construct the SMS message based on delivery method
        let message = `🛍️ Thank you for your order!\n\n` +
            `Order ID: ${orderData.order_id}\n` +
            `Items:\n${itemsList}\n` +
            `Total Amount: $${orderData.total_amount.toFixed(2)}\n\n`;
        
        // Add delivery information based on method
        if (orderData.isStorePickup) {
            message += `🏬 Your order will be available for pickup at:\n` +
                `${orderData.storeName}\n\n` +
                `Please bring your ID and order number when you pick up your order.\n\n`;
        } else {
            message += `📦 Shipping to:\n` +
                `${formData.address}\n` +
                `${formData.city}, ${formData.state} ${formData.zipCode}\n\n`;
        }
        
        message += `Questions? Feel free to text or call this number! 📱`;

        // Send the initial SMS
        await client.messages.create({
            body: message,
            to: formData.phone,
            from: context.TWILIO_SMS_FROM_NUMBER
        });

        console.log("SMS sent successfully to:", formData.phone);

        // Trigger AI Assistant for upsell if it's a store pickup order
        if (orderData.isStorePickup) {
            try {
                // Prepare context for the AI Assistant
                const customerContext = {
                    phone: formData.phone,
                    name: formData.firstName || 'Customer',
                    order_id: orderData.order_id,
                    items: orderData.items,
                    total_amount: orderData.total_amount,
                    store_name: orderData.storeName
                };
                
                // Create a message prompt for the AI Assistant with all necessary context
                const messageBody = `CUSTOMER_CONTEXT: ${JSON.stringify(customerContext)}\n\n` +
                    `This customer has placed an order for pickup at ${orderData.storeName}. ` +
                    `Their order includes: ${itemsList}. ` +
                    `Total spent: $${orderData.total_amount.toFixed(2)}. ` +
                    `Send them a personalized follow-up message with relevant upsell suggestions based on their purchase so the use can buy more products from the store and pick it up at the same time as their original order.`;
                
                // Send to AI Assistant
                await client.assistants.v1
                    .assistants(context.ASSISTANT_ID)
                    .messages
                    .create({
                        identity: `phone:${formData.phone}`,
                        body: messageBody,
                        webhook: `https://${context.DOMAIN_NAME}/channels/messaging/assistant-webhook-handler`,
                        mode: "chat"
                    });
                
                console.log("AI Assistant triggered for upsell to:", formData.phone);
            } catch (assistantError) {
                // Just log the error but don't fail the main function
                console.error("Error triggering AI Assistant:", assistantError.message);
                // We don't return here as we want the main function to succeed even if the assistant call fails
            }
        }

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
