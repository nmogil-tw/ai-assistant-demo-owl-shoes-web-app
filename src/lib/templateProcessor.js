/**
 * Template Processor
 *
 * Processes Handlebars templates with industry configuration data
 */

const Handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

class TemplateProcessor {
  constructor(industryConfig, industryPath) {
    this.config = industryConfig;
    this.industryPath = industryPath;
    this.registerHelpers();
  }

  /**
   * Register custom Handlebars helpers
   */
  registerHelpers() {
    // Helper to capitalize first letter
    Handlebars.registerHelper('capitalize', function(str) {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1);
    });

    // Helper to convert to title case
    Handlebars.registerHelper('titleCase', function(str) {
      if (!str) return '';
      return str
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    });

    // Helper for pluralization
    Handlebars.registerHelper('pluralize', function(word) {
      if (!word) return '';
      // Simple pluralization rules
      if (word.endsWith('s')) return word;
      if (word.endsWith('y')) return word.slice(0, -1) + 'ies';
      return word + 's';
    });

    // Helper to format as JSON
    Handlebars.registerHelper('json', function(context) {
      return JSON.stringify(context, null, 2);
    });
  }

  /**
   * Process a template file
   * @param {string} templatePath - Path to template file relative to industry directory
   * @returns {string} Processed template content
   */
  processTemplate(templatePath) {
    const fullPath = path.join(this.industryPath, templatePath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`Template file not found: ${fullPath}`);
    }

    const templateContent = fs.readFileSync(fullPath, 'utf8');
    const template = Handlebars.compile(templateContent);

    return template(this.config);
  }

  /**
   * Process a template string
   * @param {string} templateString - Template string
   * @returns {string} Processed template content
   */
  processString(templateString) {
    const template = Handlebars.compile(templateString);
    return template(this.config);
  }

  /**
   * Process a template from a file in the templates directory
   * @param {string} templatePath - Path to template file in src/templates/
   * @param {Object} additionalContext - Additional context to merge with config
   * @returns {string} Processed template content
   */
  processTemplateFile(templatePath, additionalContext = {}) {
    const fullPath = path.join(__dirname, '..', 'templates', templatePath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`Template file not found: ${fullPath}`);
    }

    const templateContent = fs.readFileSync(fullPath, 'utf8');
    const template = Handlebars.compile(templateContent);

    // Merge config with additional context
    const context = {
      ...this.config,
      ...additionalContext
    };

    return template(context);
  }

  /**
   * Save processed template to a file
   * @param {string} templatePath - Path to template file
   * @param {string} outputPath - Path to save processed file
   * @param {Object} additionalContext - Additional context
   */
  processAndSave(templatePath, outputPath, additionalContext = {}) {
    const processed = this.processTemplateFile(templatePath, additionalContext);

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, processed, 'utf8');
    console.log(`✓ Generated: ${outputPath}`);
  }
}

module.exports = TemplateProcessor;
