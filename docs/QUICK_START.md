# Multi-Industry System - Quick Start

## TL;DR

```bash
# Build for an industry
npm run build owl-shoes

# Deploy to Twilio
npm run deploy

# Switch to a different industry
npm run build talk-talk
npm run deploy
```

## What Gets Generated

When you run `npm run build <industry-id>`, the system generates:

1. ✅ AI Assistant prompt (`prompts/assistant-prompt.md`)
2. ✅ Tool configurations (`src/config/tools.generated.js`)
3. ✅ Function code (`functions/tools/products.js`, `place-order.js`)
4. ✅ TypeScript types (`web/src/integrations/airtable/types.generated.ts`)
5. ✅ Web configuration (`web/src/lib/industryConfig.generated.ts`)
6. ✅ Theme CSS (injected into `web/src/index.css`)
7. ✅ Assets (copied to `web/public/industry-assets/`)
8. ✅ Environment variables (updated in `.env`)

## Available Industries

- **owl-shoes**: Retail shoe store (baseline example)
- **talk-talk**: Telecommunications provider (example)

## Common Commands

```bash
# Build for a specific industry
npm run build <industry-id>

# Deploy to Twilio (after building)
npm run deploy

# Build and deploy in sequence
npm run build owl-shoes && npm run deploy

# Switch between industries
npm run switch talk-talk && npm run deploy
```

## Creating Your Own Industry

### 1. Create Directory Structure

```bash
mkdir -p config/industries/my-company/{prompts,theme/assets}
```

### 2. Create Configuration File

Copy and modify an existing config:

```bash
cp config/industries/owl-shoes/industry.config.json config/industries/my-company/
```

Edit `config/industries/my-company/industry.config.json` with your company details.

### 3. Create Prompt Template

Copy and modify:

```bash
cp config/industries/owl-shoes/prompts/assistant.hbs config/industries/my-company/prompts/
```

### 4. Add Theme Assets

Place your logo in:
```
config/industries/my-company/theme/assets/logo.png
```

### 5. Build and Deploy

```bash
npm run build my-company
npm run deploy
```

## Key Configuration Fields

### Minimum Required Config

```json
{
  "industry": {
    "id": "my-company",
    "name": "My Company",
    "type": "retail"
  },
  "company": {
    "name": "My Company",
    "email": "support@example.com",
    "phone": "+1 555-0123",
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
    "categories": ["category1"],
    "schema": {
      "coreFields": ["id", "name", "price", "description", "image_url", "category", "brand"],
      "industryFields": [],
      "displayFields": ["name", "brand", "price"]
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
        "properties": ["product_id", "total_amount"]
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

## Airtable Setup Checklist

- [ ] Create new Airtable base for your industry
- [ ] Create `customers` table with required fields
- [ ] Create `orders` table with required fields
- [ ] Create `products` table (or custom name) with:
  - [ ] Core fields: id, name, price, description, image_url, category, brand
  - [ ] Your industry-specific fields
- [ ] Add sample data for testing
- [ ] Update `.env` with new `AIRTABLE_BASE_ID`

## Verification Steps

After building and deploying:

1. ✅ Check generated files exist
2. ✅ Verify assistant prompt has correct company name
3. ✅ Test product browsing on web app
4. ✅ Test AI Assistant (voice/SMS/chat)
5. ✅ Verify Segment events fire correctly
6. ✅ Check theme colors applied correctly

## Troubleshooting

### Build fails with "Configuration not found"
```bash
# Check directory exists
ls -la config/industries/your-industry/

# Verify config file exists
cat config/industries/your-industry/industry.config.json
```

### Generated files not updating
```bash
# Force rebuild
rm -f prompts/assistant-prompt.md
rm -f src/config/tools.generated.js
rm -f web/src/lib/industryConfig.generated.ts
npm run build your-industry
```

### Web app shows old company name
```bash
# Rebuild web app
cd web
npm run dev
```

### Segment events not firing
```bash
# Check .env has INDUSTRY_CONFIG
grep INDUSTRY_CONFIG .env

# Rebuild to update config
npm run build your-industry
npm run deploy
```

## Need More Help?

See detailed documentation in `docs/MULTI_INDUSTRY_SETUP.md`
