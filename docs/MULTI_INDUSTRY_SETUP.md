# Multi-Industry Customization System

## Overview

This system allows you to rapidly customize the Twilio AI Assistant demo for different industries by using configuration files instead of manually editing code. You can switch between industries (e.g., retail, telecommunications, banking) in minutes instead of days.

## Quick Start

### Building for an Industry

```bash
# Build for Owl Shoes (retail)
npm run build owl-shoes

# Build for Talk Talk (telecommunications)
npm run build talk-talk

# Deploy to Twilio
npm run deploy
```

### Switching Between Industries

```bash
# Switch to a different industry
npm run switch talk-talk

# Deploy the new configuration
npm run deploy
```

## Architecture

### Configuration-Driven Design

The system uses a **single source of truth** approach where each industry is defined in a structured JSON configuration file. The build system generates all necessary code, prompts, and UI components dynamically.

### Key Components

1. **Industry Configs** (`config/industries/`)
   - JSON configuration files defining company info, products, tools, and themes
   - Handlebars templates for AI assistant prompts
   - Theme assets (logos, colors)

2. **Build System** (`src/lib/`)
   - **Schema Mapper**: Abstracts Airtable operations
   - **Tool Generator**: Creates tool configurations
   - **Function Generator**: Generates Twilio Function code
   - **Theme Generator**: Injects CSS and copies assets
   - **Template Processor**: Processes Handlebars templates

3. **Generated Files**
   - `prompts/assistant-prompt.md` - AI assistant personality
   - `src/config/tools.generated.js` - Tool configurations
   - `functions/tools/products.js` - Product lookup function
   - `functions/tools/place-order.js` - Order placement function
   - `web/src/lib/industryConfig.generated.ts` - Web app config
   - `web/src/integrations/airtable/types.generated.ts` - TypeScript types

## Creating a New Industry

### Step 1: Create Configuration Directory

```bash
mkdir -p config/industries/my-industry/prompts
mkdir -p config/industries/my-industry/theme
```

### Step 2: Create Industry Configuration

Create `config/industries/my-industry/industry.config.json`:

```json
{
  "industry": {
    "id": "my-industry",
    "name": "My Company",
    "type": "retail"
  },
  "company": {
    "name": "My Company",
    "email": "support@mycompany.com",
    "phone": "+1 555-123-4567",
    "address": {
      "street": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "zip": "94105"
    }
  },
  "assistant": {
    "name": "MyBot",
    "voice": "en-US-Neural2-A",
    "promptTemplate": "prompts/assistant.hbs"
  },
  "products": {
    "entityName": "product",
    "entityNamePlural": "products",
    "tableName": "products",
    "categories": ["category1", "category2"],
    "schema": {
      "coreFields": ["id", "name", "price", "description", "image_url", "category", "brand"],
      "industryFields": [
        {"name": "custom_field", "type": "string", "displayName": "Custom Field"}
      ],
      "displayFields": ["name", "brand", "price", "custom_field"]
    }
  },
  "tools": {
    "enabled": ["customerLookup", "orderLookup", "products", "placeOrder", "createSurvey"],
    "customTools": []
  },
  "segment": {
    "events": [
      {
        "name": "Order Placed",
        "trigger": "order_placed",
        "properties": ["product_id", "category", "total_amount"]
      }
    ]
  },
  "theme": {
    "colors": {
      "primary": "#1E40AF",
      "secondary": "#3B82F6",
      "accent": "#60A5FA"
    },
    "logo": "assets/logo.png"
  }
}
```

### Step 3: Create Assistant Prompt Template

Create `config/industries/my-industry/prompts/assistant.hbs`:

```markdown
# Identity

Your name is {{assistant.name}} and you are a helpful agent for {{company.name}}. You help customers with {{products.entityNamePlural}}, orders, and general inquiries.

# Core Identity & Purpose

* Virtual assistant for {{company.name}}
* Primary functions: {{products.entityName}} recommendations, order management, customer support

# Response Requirements

* Use natural, conversational language
* Be concise and helpful
* Always use tools when needed

# Conversation Flow

## 1. Start
* Greet the customer
* Ask how you can help

## 2. Product Recommendations
* Use Product Lookup tool to show available {{products.entityNamePlural}}
* Highlight special offers
* Help customer make informed decisions

## 3. Order Management
* Use Order Lookup tool to check order status
* Provide accurate shipping information

## 4. Close
* Confirm all questions addressed
* Thank the customer
```

### Step 4: Add Theme Assets

Place your logo in `config/industries/my-industry/theme/assets/logo.png`

### Step 5: Build and Deploy

```bash
npm run build my-industry
npm run deploy
```

## Configuration Reference

### Industry Config Schema

#### `industry`
- `id` (string): Unique identifier (lowercase, hyphens allowed)
- `name` (string): Display name
- `type` (string): Industry category (retail, telecommunications, healthcare, banking, hospitality, other)

#### `company`
- `name` (string): Company name
- `email` (string): Customer support email
- `phone` (string): Customer support phone
- `address` (object): Physical address with street, city, state, zip

#### `assistant`
- `name` (string): AI assistant's name
- `voice` (string): Twilio voice identifier
- `promptTemplate` (string): Path to Handlebars template

#### `products`
- `entityName` (string): Singular name (e.g., "shoe", "plan")
- `entityNamePlural` (string): Plural name
- `tableName` (string): Airtable table name
- `categories` (array): List of product categories
- `schema` (object):
  - `coreFields` (array): Standard fields (id, name, price, etc.)
  - `industryFields` (array): Custom fields with name, type, displayName
  - `displayFields` (array): Fields to show in UI

#### `tools`
- `enabled` (array): Standard tools to enable
- `customTools` (array): Industry-specific tools

#### `segment`
- `events` (array): Segment events with name, trigger, properties

#### `theme`
- `colors` (object): Hex color codes for primary, secondary, accent
- `logo` (string): Path to logo file

## Airtable Setup

### Core Schema (Required for All Industries)

All Airtable bases must have these tables:

**customers**
- id (string)
- email (string)
- phone (string)
- first_name (string)
- last_name (string)
- address (string)
- city (string)
- state (string)
- zip_code (string)

**orders**
- id (string)
- customer_id (string)
- email (string)
- phone (string)
- items (string, JSON)
- total_amount (number)
- shipping_status (string)

**products** (or your custom table name)
- id (string)
- name (string)
- price (number)
- description (string)
- image_url (string)
- category (string)
- brand (string)
- [Your industry-specific fields]

### Adding Industry-Specific Fields

Simply add columns to your products table with the field names defined in your `industryFields` configuration. For example:

- **Retail (Shoes)**: size, color
- **Telecommunications**: speed, data_allowance, contract_months
- **Banking**: interest_rate, minimum_balance, account_type

## Custom Tools

### Defining Custom Tools

Add custom tools to your industry config:

```json
{
  "tools": {
    "customTools": [
      {
        "id": "checkCoverage",
        "name": "Check Coverage",
        "description": "Check service coverage at a location",
        "method": "GET",
        "endpoint": "/tools/check-coverage",
        "schema": {
          "postcode": "string"
        }
      }
    ]
  }
}
```

### Implementing Custom Tool Functions

Create the function file manually in `functions/tools/`:

```javascript
// functions/tools/check-coverage.js
exports.handler = async function(context, event, callback) {
  const { postcode } = event;

  // Your custom logic here
  const coverage = checkCoverageForPostcode(postcode);

  return callback(null, {
    status: 200,
    coverage: coverage
  });
};
```

The build system will automatically register your custom tool with the AI Assistant.

## Deployment Workflow

### Initial Setup

1. Create industry configuration
2. Build industry: `npm run build my-industry`
3. Review generated files
4. Deploy: `npm run deploy`

### Switching Industries

1. Build new industry: `npm run build other-industry`
2. Deploy: `npm run deploy`

### Testing Multiple Industries

To test both industries without redeployment:

1. Create separate Airtable bases for each industry
2. Create separate Twilio services for each industry
3. Update `.env` with appropriate service SIDs and Airtable base IDs

## Best Practices

### Configuration
- Keep entity names simple and lowercase
- Use clear, descriptive display names
- Define only fields you'll actually display

### Templates
- Keep assistant prompts concise
- Use Handlebars variables for all industry-specific terms
- Test prompts with actual AI Assistant

### Themes
- Use hex colors (#RRGGBB format)
- Provide high-resolution logos (PNG recommended)
- Test theme colors for accessibility

### Airtable
- Use consistent naming conventions
- Add sample data for testing
- Document custom fields in your industry config

## Troubleshooting

### Build Errors

**"Configuration not found"**
- Ensure your industry ID matches the directory name
- Check that `industry.config.json` exists

**"Template file not found"**
- Verify `promptTemplate` path in config
- Ensure the .hbs file exists in the prompts directory

### Deployment Issues

**"Airtable configuration error"**
- Check `AIRTABLE_API_KEY` and `AIRTABLE_BASE_ID` in `.env`
- Ensure base has required tables

**"Missing environment variable"**
- Run `npm run build <industry>` to update `.env`
- Check `.env.example` for required variables

### UI Issues

**"Cannot find module 'industryConfig.generated'"**
- Run `npm run build <industry>` to generate config files
- Rebuild the web app: `cd web && npm run dev`

## Examples

### Retail Example (Owl Shoes)

See `config/industries/owl-shoes/` for a complete retail implementation with:
- Product categories (running, casual, formal)
- Size and color attributes
- Standard retail workflow

### Telecommunications Example (Talk Talk)

See `config/industries/talk-talk/` for a telecommunications implementation with:
- Service plans (broadband, mobile, TV)
- Speed and data allowance attributes
- Coverage checking tool
- Service activation events

## Support

For questions or issues:
1. Check this documentation
2. Review example configurations in `config/industries/`
3. Check generated files for errors
4. Review build logs for specific error messages
