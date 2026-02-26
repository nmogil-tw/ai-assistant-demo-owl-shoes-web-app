#!/usr/bin/env node

/**
 * Multi-Industry Build Orchestrator
 *
 * Generates all necessary files for a specific industry configuration
 *
 * Usage: node src/build.js <industry-id>
 * Example: node src/build.js owl-shoes
 */

const fs = require('fs');
const path = require('path');
const SchemaMapper = require('./lib/schemaMapper');
const ToolGenerator = require('./lib/toolGenerator');
const FunctionGenerator = require('./lib/functionGenerator');
const TemplateProcessor = require('./lib/templateProcessor');
const ThemeGenerator = require('./lib/themeGenerator');

class BuildOrchestrator {
  constructor(industryId) {
    this.industryId = industryId;
    this.rootDir = path.join(__dirname, '..');
    this.configDir = path.join(this.rootDir, 'config', 'industries');
    this.industryPath = path.join(this.configDir, industryId);
    this.config = null;
  }

  /**
   * Main build process
   */
  async build() {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Building Multi-Industry Configuration`);
    console.log(`Industry: ${this.industryId}`);
    console.log(`${'='.repeat(60)}\n`);

    try {
      // Step 1: Load and validate configuration
      this.loadConfiguration();

      // Step 2: Generate assistant prompt
      this.generateAssistantPrompt();

      // Step 3: Generate tools configuration
      this.generateToolsConfig();

      // Step 4: Generate function code
      this.generateFunctions();

      // Step 5: Generate TypeScript types
      this.generateTypes();

      // Step 6: Generate industry config for web app
      this.generateWebConfig();

      // Step 7: Generate and inject theme
      this.generateTheme();

      // Step 8: Update .env file
      this.updateEnvFile();

      console.log(`\n${'='.repeat(60)}`);
      console.log(`✓ Build completed successfully!`);
      console.log(`\nNext steps:`);
      console.log(`  1. Review generated files`);
      console.log(`  2. Run: npm run deploy`);
      console.log(`${'='.repeat(60)}\n`);

    } catch (error) {
      console.error(`\n✗ Build failed: ${error.message}`);
      console.error(error.stack);
      process.exit(1);
    }
  }

  /**
   * Load and validate industry configuration
   */
  loadConfiguration() {
    console.log(`[1/8] Loading configuration...`);

    const configPath = path.join(this.industryPath, 'industry.config.json');

    if (!fs.existsSync(configPath)) {
      throw new Error(`Configuration not found: ${configPath}`);
    }

    this.config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    // Validate against schema
    const schemaPath = path.join(this.configDir, 'schema.json');
    if (fs.existsSync(schemaPath)) {
      // Basic validation - could use a JSON schema validator library for production
      const requiredFields = ['industry', 'company', 'assistant', 'products', 'tools', 'segment', 'theme'];
      requiredFields.forEach(field => {
        if (!this.config[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      });
    }

    console.log(`  ✓ Configuration loaded for ${this.config.company.name}`);
  }

  /**
   * Generate assistant prompt from template
   */
  generateAssistantPrompt() {
    console.log(`[2/8] Generating assistant prompt...`);

    const templateProcessor = new TemplateProcessor(this.config, this.industryPath);
    const promptTemplatePath = this.config.assistant.promptTemplate;

    const processedPrompt = templateProcessor.processTemplate(promptTemplatePath);

    const outputPath = path.join(this.rootDir, 'prompts', 'assistant-prompt.md');
    fs.writeFileSync(outputPath, processedPrompt, 'utf8');

    console.log(`  ✓ Generated: ${outputPath}`);
  }

  /**
   * Generate tools configuration
   */
  generateToolsConfig() {
    console.log(`[3/8] Generating tools configuration...`);

    const toolGenerator = new ToolGenerator(this.config);
    const toolsConfigContent = toolGenerator.generateToolsConfigFile();

    const outputPath = path.join(this.rootDir, 'src', 'config', 'tools.generated.js');

    // Ensure directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, toolsConfigContent, 'utf8');

    console.log(`  ✓ Generated: ${outputPath}`);
  }

  /**
   * Generate function code from templates
   */
  generateFunctions() {
    console.log(`[4/8] Generating function code...`);

    const functionGenerator = new FunctionGenerator(this.config, this.industryPath);
    const generatedFiles = functionGenerator.generateAll(this.rootDir);

    console.log(`  ✓ Generated ${generatedFiles.length} function files`);
  }

  /**
   * Generate TypeScript types
   */
  generateTypes() {
    console.log(`[5/8] Generating TypeScript types...`);

    const functionGenerator = new FunctionGenerator(this.config, this.industryPath);
    functionGenerator.generateTypes(this.rootDir);
  }

  /**
   * Generate industry config for web application
   */
  generateWebConfig() {
    console.log(`[6/8] Generating web configuration...`);

    const webConfigPath = path.join(this.rootDir, 'web', 'src', 'lib', 'industryConfig.generated.ts');

    const configContent = `/**
 * Industry Configuration
 *
 * Generated for: ${this.config.company.name}
 * Industry: ${this.config.industry.type}
 *
 * This file is auto-generated. Do not edit manually.
 */

export const industryConfig = ${JSON.stringify(this.config, null, 2)};

export const getEntityName = (plural: boolean = false): string =>
  plural ? industryConfig.products.entityNamePlural : industryConfig.products.entityName;

export const getProductDisplayFields = (): string[] =>
  industryConfig.products.schema.displayFields;

export const getCompanyInfo = () => ({
  name: industryConfig.company.name,
  email: industryConfig.company.email,
  phone: industryConfig.company.phone,
  address: industryConfig.company.address
});

export const getTheme = () => industryConfig.theme;
`;

    const outputDir = path.dirname(webConfigPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(webConfigPath, configContent, 'utf8');

    console.log(`  ✓ Generated: ${webConfigPath}`);
  }

  /**
   * Generate and inject theme
   */
  generateTheme() {
    console.log(`[7/8] Generating theme...`);

    const themeGenerator = new ThemeGenerator(this.config);
    themeGenerator.generate(this.rootDir);
  }

  /**
   * Update .env file with current industry
   */
  updateEnvFile() {
    console.log(`[8/8] Updating environment configuration...`);

    const envPath = path.join(this.rootDir, '.env');
    const envExamplePath = path.join(this.rootDir, '.env.example');

    // Serialize industry config for Twilio Functions
    const industryConfigJson = JSON.stringify(this.config).replace(/"/g, '\\"');

    // Update .env.example
    if (fs.existsSync(envExamplePath)) {
      let envContent = fs.readFileSync(envExamplePath, 'utf8');

      // Add or update VITE_INDUSTRY variable
      if (envContent.includes('VITE_INDUSTRY=')) {
        envContent = envContent.replace(/VITE_INDUSTRY=.*/, `VITE_INDUSTRY=${this.industryId}`);
      } else {
        envContent += `\n# Current Industry Configuration\nVITE_INDUSTRY=${this.industryId}\n`;
      }

      // Add or update INDUSTRY_CONFIG variable (for Twilio Functions)
      if (envContent.includes('INDUSTRY_CONFIG=')) {
        envContent = envContent.replace(/INDUSTRY_CONFIG=.*/, `INDUSTRY_CONFIG="${industryConfigJson}"`);
      } else {
        envContent += `INDUSTRY_CONFIG="${industryConfigJson}"\n`;
      }

      fs.writeFileSync(envExamplePath, envContent, 'utf8');
      console.log(`  ✓ Updated: ${envExamplePath}`);
    }

    // Update .env if it exists
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');

      if (envContent.includes('VITE_INDUSTRY=')) {
        envContent = envContent.replace(/VITE_INDUSTRY=.*/, `VITE_INDUSTRY=${this.industryId}`);
      } else {
        envContent += `\n# Current Industry Configuration\nVITE_INDUSTRY=${this.industryId}\n`;
      }

      // Add or update INDUSTRY_CONFIG variable
      if (envContent.includes('INDUSTRY_CONFIG=')) {
        envContent = envContent.replace(/INDUSTRY_CONFIG=.*/, `INDUSTRY_CONFIG="${industryConfigJson}"`);
      } else {
        envContent += `INDUSTRY_CONFIG="${industryConfigJson}"\n`;
      }

      fs.writeFileSync(envPath, envContent, 'utf8');
      console.log(`  ✓ Updated: ${envPath}`);
    }
  }
}

// Main execution
if (require.main === module) {
  const industryId = process.argv[2];

  if (!industryId) {
    console.error('Error: Industry ID is required');
    console.error('Usage: node src/build.js <industry-id>');
    console.error('Example: node src/build.js owl-shoes');
    process.exit(1);
  }

  const orchestrator = new BuildOrchestrator(industryId);
  orchestrator.build();
}

module.exports = BuildOrchestrator;
