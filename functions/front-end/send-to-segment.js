const axios = require("axios");

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
        // Segment Write Key and API endpoints
        const SEGMENT_WRITE_KEY = context.SEGMENT_WRITE_KEY;
        const SEGMENT_TRACK_URL = "https://api.segment.io/v1/track";
        const SEGMENT_IDENTIFY_URL = "https://api.segment.io/v1/identify";

        // Load industry configuration
        const industryConfig = JSON.parse(context.INDUSTRY_CONFIG || '{}');

        // Extract form, order data, and event trigger
        const { formData, orderData, eventTrigger = 'order_placed' } = event;

        // Construct Identify payload
        const identifyPayload = {
            userId: formData.email,
            traits: {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                address: formData.address,
                city: formData.city,
                state: formData.state,
                zipCode: formData.zipCode,
            },
        };

        // Send Identify request to Segment
        await axios.post(SEGMENT_IDENTIFY_URL, identifyPayload, {
            auth: { username: SEGMENT_WRITE_KEY, password: "" },
        });

        console.log("Identify event sent to Segment:", identifyPayload);

        // Find event configuration based on trigger
        let eventConfig = null;
        if (industryConfig.segment && industryConfig.segment.events) {
            eventConfig = industryConfig.segment.events.find(e => e.trigger === eventTrigger);
        }

        // Fallback to default if no industry config
        if (!eventConfig) {
            eventConfig = {
                name: "Order Placed",
                properties: ["orderId", "totalAmount", "items"]
            };
        }

        // Build dynamic properties based on event config
        const eventProperties = {};
        eventConfig.properties.forEach(prop => {
            // Map common property names
            const propMap = {
                'order_id': orderData.order_id,
                'total_amount': orderData.total_amount,
                'product_id': orderData.items?.[0]?.id,
                'category': orderData.items?.[0]?.category,
                'brand': orderData.items?.[0]?.brand,
                'speed': orderData.items?.[0]?.speed,
                'data_allowance': orderData.items?.[0]?.data_allowance,
                'contract_months': orderData.items?.[0]?.contract_months,
                'plan_id': orderData.items?.[0]?.id,
                // Legacy support
                'orderId': orderData.order_id,
                'totalAmount': orderData.total_amount,
                'items': orderData.items
            };

            if (propMap[prop] !== undefined) {
                eventProperties[prop] = propMap[prop];
            }
        });

        // Construct Track payload with dynamic event name and properties
        const trackPayload = {
            userId: formData.email,
            event: eventConfig.name,
            properties: eventProperties,
        };

        // Send Track request to Segment
        await axios.post(SEGMENT_TRACK_URL, trackPayload, {
            auth: { username: SEGMENT_WRITE_KEY, password: "" },
        });

        console.log("Track event sent to Segment:", trackPayload);

        response.setBody({
            success: true,
            message: "Data sent to Segment successfully"
        });
        
        return callback(null, response);
        
    } catch (error) {
        console.error("Error sending data to Segment:", error.message);
        response.setStatusCode(500);
        response.setBody({ 
            success: false, 
            error: error.message || 'Error sending data to Segment'
        });
        return callback(null, response);
    }
};