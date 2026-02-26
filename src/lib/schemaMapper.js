/**
 * Schema Mapper
 *
 * Abstracts Airtable operations across different industries by mapping
 * industry-specific configurations to database queries and validations.
 */

class SchemaMapper {
  constructor(industryConfig) {
    this.config = industryConfig;
    this.productSchema = industryConfig.products.schema;
  }

  /**
   * Get the table name for products in this industry
   * @returns {string} Table name
   */
  getTableName() {
    return this.config.products.tableName || 'products';
  }

  /**
   * Get all fields (core + industry-specific) for this industry
   * @returns {Array<string>} Array of field names
   */
  getAllFields() {
    const industryFieldNames = this.productSchema.industryFields.map(f => f.name);
    return [...this.productSchema.coreFields, ...industryFieldNames];
  }

  /**
   * Get fields to display in UI components
   * @returns {Array<string>} Array of field names to display
   */
  getDisplayFields() {
    return this.productSchema.displayFields;
  }

  /**
   * Get field metadata by name
   * @param {string} fieldName - Name of the field
   * @returns {Object|null} Field metadata or null if not found
   */
  getFieldMetadata(fieldName) {
    // Check if it's a core field
    if (this.productSchema.coreFields.includes(fieldName)) {
      return {
        name: fieldName,
        type: this.inferCoreFieldType(fieldName),
        displayName: this.toDisplayName(fieldName),
        isCore: true
      };
    }

    // Check if it's an industry-specific field
    const industryField = this.productSchema.industryFields.find(f => f.name === fieldName);
    if (industryField) {
      return {
        ...industryField,
        isCore: false
      };
    }

    return null;
  }

  /**
   * Convert a field name to a display name
   * @param {string} fieldName - Field name in snake_case
   * @returns {string} Display name in Title Case
   */
  toDisplayName(fieldName) {
    return fieldName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Infer the type of a core field
   * @param {string} fieldName - Name of the core field
   * @returns {string} Field type
   */
  inferCoreFieldType(fieldName) {
    const typeMap = {
      'id': 'string',
      'name': 'string',
      'price': 'number',
      'description': 'string',
      'image_url': 'string',
      'category': 'string',
      'brand': 'string'
    };
    return typeMap[fieldName] || 'string';
  }

  /**
   * Map a product from Airtable to the application format
   * @param {Object} airtableRecord - Raw record from Airtable
   * @returns {Object} Mapped product object
   */
  mapProductFromAirtable(airtableRecord) {
    const fields = airtableRecord.fields || airtableRecord;
    const mappedProduct = {};

    // Map all configured fields
    this.getAllFields().forEach(fieldName => {
      if (fields[fieldName] !== undefined) {
        mappedProduct[fieldName] = fields[fieldName];
      }
    });

    return mappedProduct;
  }

  /**
   * Map a product to Airtable format for create/update
   * @param {Object} product - Product object from application
   * @returns {Object} Object formatted for Airtable
   */
  mapProductToAirtable(product) {
    const airtableData = {};

    // Only include fields that are defined in the schema
    this.getAllFields().forEach(fieldName => {
      if (product[fieldName] !== undefined) {
        airtableData[fieldName] = product[fieldName];
      }
    });

    return airtableData;
  }

  /**
   * Generate validation rules for order placement
   * @returns {Object} Validation rules
   */
  generateOrderValidation() {
    const requiredFields = ['id', 'name', 'price'];
    const validationRules = {};

    this.getAllFields().forEach(fieldName => {
      const metadata = this.getFieldMetadata(fieldName);
      if (metadata) {
        validationRules[fieldName] = {
          required: requiredFields.includes(fieldName),
          type: metadata.type
        };
      }
    });

    return validationRules;
  }

  /**
   * Build an order item object with industry-specific fields
   * @param {Object} product - Product from Airtable
   * @param {number} finalPrice - Calculated final price
   * @returns {Object} Order item object
   */
  buildOrderItem(product, finalPrice) {
    const orderItem = {
      id: product.id,
      name: product.name,
      price: finalPrice,
      quantity: 1,
      image_url: product.image_url,
      category: product.category,
      brand: product.brand
    };

    // Add industry-specific fields
    this.productSchema.industryFields.forEach(field => {
      if (product[field.name] !== undefined) {
        orderItem[field.name] = product[field.name];
      }
    });

    return orderItem;
  }

  /**
   * Get entity name (singular or plural)
   * @param {boolean} plural - Whether to return plural form
   * @returns {string} Entity name
   */
  getEntityName(plural = false) {
    return plural ? this.config.products.entityNamePlural : this.config.products.entityName;
  }

  /**
   * Get product categories for this industry
   * @returns {Array<string>} Array of category names
   */
  getCategories() {
    return this.config.products.categories;
  }

  /**
   * Check if a field should be displayed in UI
   * @param {string} fieldName - Field name to check
   * @returns {boolean} True if field should be displayed
   */
  shouldDisplayField(fieldName) {
    return this.productSchema.displayFields.includes(fieldName);
  }
}

module.exports = SchemaMapper;
