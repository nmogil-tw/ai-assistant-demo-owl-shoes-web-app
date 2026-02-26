/**
 * Tool Generator
 *
 * Generates tool configurations from industry config, creating
 * industry-aware tool descriptions and schemas.
 */

class ToolGenerator {
  constructor(industryConfig) {
    this.config = industryConfig;
  }

  /**
   * Generate tool configuration for AI Assistant
   * @returns {Array} Array of tool configurations
   */
  generateTools() {
    const tools = [];
    const enabledTools = this.config.tools.enabled;

    // Map of standard tool generators
    const toolGenerators = {
      customerLookup: () => this.generateCustomerLookupTool(),
      orderLookup: () => this.generateOrderLookupTool(),
      products: () => this.generateProductsTool(),
      placeOrder: () => this.generatePlaceOrderTool(),
      createSurvey: () => this.generateCreateSurveyTool(),
      returnOrder: () => this.generateReturnOrderTool()
    };

    // Generate enabled standard tools
    enabledTools.forEach(toolName => {
      if (toolGenerators[toolName]) {
        tools.push(toolGenerators[toolName]());
      }
    });

    // Generate custom tools
    if (this.config.tools.customTools) {
      this.config.tools.customTools.forEach(customTool => {
        tools.push(this.generateCustomTool(customTool));
      });
    }

    return tools;
  }

  /**
   * Generate customer lookup tool configuration
   */
  generateCustomerLookupTool() {
    return {
      name: 'customer_lookup',
      description: `Look up customer information for ${this.config.company.name}`,
      url: `https://\${TWILIO_FUNCTION_URL}/tools/customer-lookup`,
      method: 'POST',
      schema: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            description: 'Customer email address'
          },
          phone: {
            type: 'string',
            description: 'Customer phone number'
          }
        }
      }
    };
  }

  /**
   * Generate order lookup tool configuration
   */
  generateOrderLookupTool() {
    const entityName = this.config.products.entityName;
    return {
      name: 'order_lookup',
      description: `Look up ${entityName} order information by order ID`,
      url: `https://\${TWILIO_FUNCTION_URL}/tools/order-lookup`,
      method: 'POST',
      schema: {
        type: 'object',
        properties: {
          order_id: {
            type: 'string',
            description: 'Order ID to look up'
          }
        },
        required: ['order_id']
      }
    };
  }

  /**
   * Generate products tool configuration
   */
  generateProductsTool() {
    const entityName = this.config.products.entityName;
    const entityNamePlural = this.config.products.entityNamePlural;
    const categories = this.config.products.categories;

    return {
      name: 'product_lookup',
      description: `Retrieve all available ${entityNamePlural} from ${this.config.company.name}. Categories: ${categories.join(', ')}`,
      url: `https://\${TWILIO_FUNCTION_URL}/tools/products`,
      method: 'POST',
      schema: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: `Filter by ${entityName} category`,
            enum: categories
          }
        }
      }
    };
  }

  /**
   * Generate place order tool configuration
   */
  generatePlaceOrderTool() {
    const entityName = this.config.products.entityName;

    // Build schema properties based on industry fields
    const schemaProperties = {
      product_id: {
        type: 'string',
        description: `ID of the ${entityName} to order`
      }
    };

    return {
      name: 'place_order',
      description: `Place an order for a ${entityName} from ${this.config.company.name}`,
      url: `https://\${TWILIO_FUNCTION_URL}/tools/place-order`,
      method: 'POST',
      schema: {
        type: 'object',
        properties: schemaProperties,
        required: ['product_id']
      }
    };
  }

  /**
   * Generate create survey tool configuration
   */
  generateCreateSurveyTool() {
    return {
      name: 'customer_survey',
      description: 'Submit customer satisfaction survey results',
      url: `https://\${TWILIO_FUNCTION_URL}/tools/create-survey`,
      method: 'POST',
      schema: {
        type: 'object',
        properties: {
          rating: {
            type: 'number',
            description: 'Rating from 1-5'
          },
          feedback: {
            type: 'string',
            description: 'Additional customer feedback'
          }
        },
        required: ['rating']
      }
    };
  }

  /**
   * Generate return order tool configuration
   */
  generateReturnOrderTool() {
    const entityName = this.config.products.entityName;
    return {
      name: 'return_order',
      description: `Process a return for a ${entityName} order`,
      url: `https://\${TWILIO_FUNCTION_URL}/tools/return-order`,
      method: 'POST',
      schema: {
        type: 'object',
        properties: {
          order_id: {
            type: 'string',
            description: 'Order ID to return'
          },
          reason: {
            type: 'string',
            description: 'Reason for return'
          }
        },
        required: ['order_id']
      }
    };
  }

  /**
   * Generate custom tool configuration
   * @param {Object} customTool - Custom tool definition from config
   */
  generateCustomTool(customTool) {
    // Convert schema object to JSON Schema format
    const schemaProperties = {};
    Object.entries(customTool.schema).forEach(([key, type]) => {
      schemaProperties[key] = {
        type: type,
        description: `${key.replace(/_/g, ' ')}`
      };
    });

    return {
      name: customTool.id,
      description: customTool.description,
      url: `https://\${TWILIO_FUNCTION_URL}${customTool.endpoint}`,
      method: customTool.method,
      schema: {
        type: 'object',
        properties: schemaProperties,
        required: Object.keys(customTool.schema)
      }
    };
  }

  /**
   * Generate tools configuration file content
   * @returns {string} JavaScript module content
   */
  generateToolsConfigFile() {
    const tools = this.generateTools();

    return `/**
 * AI Assistant Tools Configuration
 *
 * Generated for: ${this.config.company.name}
 * Industry: ${this.config.industry.type}
 *
 * This file is auto-generated. Do not edit manually.
 */

const tools = ${JSON.stringify(tools, null, 2)};

module.exports = tools;
`;
  }
}

module.exports = ToolGenerator;
