/**
 * Function Generator
 *
 * Generates Twilio Function code from templates based on industry configuration
 */

const TemplateProcessor = require('./templateProcessor');
const path = require('path');

class FunctionGenerator {
  constructor(industryConfig, industryPath) {
    this.config = industryConfig;
    this.industryPath = industryPath;
    this.templateProcessor = new TemplateProcessor(industryConfig, industryPath);
  }

  /**
   * Generate all functions for the industry
   * @param {string} outputDir - Directory to output generated functions
   * @returns {Array} Array of generated function paths
   */
  generateAll(outputDir) {
    const generatedFiles = [];

    // Generate products function
    generatedFiles.push(
      this.generateProductsFunction(outputDir)
    );

    // Generate place order function
    generatedFiles.push(
      this.generatePlaceOrderFunction(outputDir)
    );

    return generatedFiles;
  }

  /**
   * Generate the products lookup function
   * @param {string} outputDir - Output directory
   * @returns {string} Path to generated file
   */
  generateProductsFunction(outputDir) {
    const outputPath = path.join(outputDir, 'functions', 'tools', 'products.js');
    this.templateProcessor.processAndSave(
      'functions/products.hbs',
      outputPath
    );
    return outputPath;
  }

  /**
   * Generate the place order function
   * @param {string} outputDir - Output directory
   * @returns {string} Path to generated file
   */
  generatePlaceOrderFunction(outputDir) {
    const outputPath = path.join(outputDir, 'functions', 'tools', 'place-order.js');
    this.templateProcessor.processAndSave(
      'functions/place-order.hbs',
      outputPath
    );
    return outputPath;
  }

  /**
   * Generate TypeScript types for the web application
   * @param {string} outputDir - Output directory
   * @returns {string} Path to generated file
   */
  generateTypes(outputDir) {
    const outputPath = path.join(outputDir, 'web', 'src', 'integrations', 'airtable', 'types.generated.ts');

    // Build interface properties
    const coreFields = this.config.products.schema.coreFields;
    const industryFields = this.config.products.schema.industryFields;

    let interfaceContent = `/**
 * Generated TypeScript types for ${this.config.company.name}
 * Industry: ${this.config.industry.type}
 *
 * This file is auto-generated. Do not edit manually.
 */

export interface Product {
`;

    // Add core fields
    coreFields.forEach(field => {
      const type = this.mapFieldType(field);
      interfaceContent += `  ${field}: ${type};\n`;
    });

    // Add industry fields
    industryFields.forEach(field => {
      const tsType = field.type === 'number' ? 'number' : 'string';
      interfaceContent += `  ${field.name}${field.required !== false ? '' : '?'}: ${tsType};\n`;
    });

    interfaceContent += `}\n\n`;

    // Add order interface
    interfaceContent += `export interface Order {
  id: string;
  customer_id: string;
  email: string;
  phone: string;
  items: string;
  total_amount: number;
  shipping_status: string;
  created_at?: string;
}\n\n`;

    // Add customer interface
    interfaceContent += `export interface Customer {
  id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
}\n`;

    const fs = require('fs');
    const outputDirPath = path.dirname(outputPath);
    if (!fs.existsSync(outputDirPath)) {
      fs.mkdirSync(outputDirPath, { recursive: true });
    }

    fs.writeFileSync(outputPath, interfaceContent, 'utf8');
    console.log(`✓ Generated: ${outputPath}`);

    return outputPath;
  }

  /**
   * Map field names to TypeScript types
   * @param {string} fieldName - Field name
   * @returns {string} TypeScript type
   */
  mapFieldType(fieldName) {
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
}

module.exports = FunctionGenerator;
