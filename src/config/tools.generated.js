/**
 * AI Assistant Tools Configuration
 *
 * Generated for: Talk Talk
 * Industry: telecommunications
 *
 * This file is auto-generated. Do not edit manually.
 */

module.exports = (domain) => ({
  customerLookup: {
    name: 'Customer Lookup',
    description:
      'Use this tool at the beginning of every conversation to learn about the customer.\n\nTool Rules:\n - Mandatory at conversation start\n - Accessible fields: first name, last name, address, email, phone\n - Use to personalize greeting',
    type: 'WEBHOOK',
    method: 'GET',
    url: `https://${domain}/tools/customer-lookup`,
  },
  orderLookup: {
    name: 'Order Look Up',
    description:
      'Use this tool to look up the customers order. ALWAYS ask the user to confirm the last four characters of their order number to ensure you are referencing the correct one.',
    type: 'WEBHOOK',
    method: 'GET',
    url: `https://${domain}/tools/order-lookup`,
    schema: {
      order_confirmation_digits: 'string', //the last four characters of the order number
    },
  },
  productInventory: {
    name: 'Product Inventory',
    description:
      'Retrieve all available plans from Talk Talk. Use this tool to provide plan recommendations to the user. Categories: broadband, mobile, tv.',
    type: 'WEBHOOK',
    method: 'GET',
    url: `https://${domain}/tools/products`,
  },
  placeOrder: {
    name: 'Place Order',
    description:
      "Use this tool to place an order for a plan. ALWAYS confirm with the user before placing the order.",
    type: 'WEBHOOK',
    method: 'POST',
    url: `https://${domain}/tools/place-order`,
    schema: {
      product_id: 'string', //the plan id to order
    },
  },
  customerSurvey: {
    name: 'Customer Survey',
    description:
      'Use this tool when you have conducted the customer survey after you have handled all the users questions and requests. ALWAYS use this tool before ending the conversation.',
    type: 'WEBHOOK',
    method: 'POST',
    url: `https://${domain}/tools/create-survey`,
    schema: {
      rating: 'number', //the rating the user gave 1-5
      feedback: 'string', //the feedback the user gave
    },
  },
  checkCoverage: {
    name: 'Check Coverage',
    description:
      'Check broadband and mobile coverage availability at a specific postcode. Use this when a customer asks about service availability in their area.',
    type: 'WEBHOOK',
    method: 'GET',
    url: `https://${domain}/tools/check-coverage`,
    schema: {
      postcode: 'string', //the UK postcode to check coverage for
    },
  },
  sendToFlex: {
    name: 'Send to Flex',
    description:
      'Use this tool when the user wants to speak with a supervisor or when you are not able to fulfill their request. ALWAYS tell the user you are transferring them to a Supervisor before using this tool.',
    type: 'WEBHOOK',
    method: 'POST',
    url: `https://${domain}/tools/send-to-flex`,
    schema: {
      conversation_summary: 'string', //summary of the user conversation with the AI agent so far
      next_steps: 'string', //next steps for the supervisor
      customer_name: 'string', //name of the customer
      customer_email: 'string', //email of the customer
      last_order_summary: 'string', //summary of the last order
    },
  },
  sendSms: {
    name: 'Send SMS',
    description: 'Use this tool to send an SMS message to the customer. The customer must have a phone number in their profile.',
    type: 'WEBHOOK',
    method: 'POST',
    url: `https://${domain}/tools/send-sms`,
    schema: {
      body: 'string', //the message content to send to the customer
    },
  },
});
