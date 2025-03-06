/**
 * Webhook handler for AI Assistant responses
 * This function receives responses from the AI Assistant and sends them as SMS messages
 */
exports.handler = async function(context, event, callback) {
    // Set up response
    const response = new Twilio.Response();
    response.appendHeader('Content-Type', 'application/json');
    
    try {
        console.log('Received webhook from AI Assistant:', JSON.stringify(event));
        
        // Validate the request
        if (!event.Body) {
            throw new Error('Invalid webhook payload');
        }
        
        // Extract the message content
        const assistantMessage = event.Body;
        
        // Extract the phone number from the Identity field
        let phoneNumber;
        if (event.Identity && event.Identity.startsWith('phone:')) {
            phoneNumber = event.Identity.replace('phone:', '').trim();
        } else if (event.Identity && event.Identity.startsWith('whatsapp:')) {
            phoneNumber = event.Identity.replace('whatsapp:', '').trim();
        } else {
            // Fallback to checking headers if Identity is not in the expected format
            const identityHeader = event.request?.headers?.["x-identity"];
            if (!identityHeader) {
                throw new Error('Missing identity information. Expected "phone:<phone>" or "whatsapp:<phone>"');
            }
            
            if (identityHeader.startsWith('phone:')) {
                phoneNumber = identityHeader.replace('phone:', '').trim();
            } else if (identityHeader.startsWith('whatsapp:')) {
                phoneNumber = identityHeader.replace('whatsapp:', '').trim();
            } else {
                throw new Error('Invalid identity format. Expected "phone:<phone>" or "whatsapp:<phone>"');
            }
        }
        
        // Get Twilio client
        const client = context.getTwilioClient();
        
        // Send the AI Assistant's response as an SMS
        await client.messages.create({
            body: assistantMessage,
            to: phoneNumber,
            from: context.AI_ASSISTANT_PHONE_NUMBER || context.TWILIO_SMS_FROM_NUMBER
        });
        
        console.log('Successfully sent AI Assistant response as SMS to:', phoneNumber);
        
        // Return success response
        response.setBody({
            success: true,
            message: 'AI Assistant response sent as SMS'
        });
        
        return callback(null, response);
        
    } catch (error) {
        console.error('Error in assistant-webhook-handler:', error.message);
        
        // Return error response
        response.setStatusCode(500);
        response.setBody({
            success: false,
            error: error.message || 'Unknown error in assistant-webhook-handler'
        });
        
        return callback(null, response);
    }
}; 