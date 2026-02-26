const https = require('https');
const fs = require('fs');
const path = require('path');
const Airtable = require('airtable');
require('dotenv').config();

class TalkTalkBaseCreator {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.airtable.com/v0/meta';
  }

  // Helper: Make authenticated API request
  async request(method, path, body = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.airtable.com',
        port: 443,
        path: path,
        method: method,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`API Error ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }

  // Build complete base schema
  buildBaseSchema() {
    return {
      name: "Talk Talk - Telecommunications Demo",
      tables: [
        {
          name: "plans",
          description: "Telecommunications service plans",
          fields: [
            { name: "id", type: "singleLineText" },
            { name: "name", type: "singleLineText" },
            { name: "price", type: "number", options: { precision: 2 } },
            { name: "description", type: "multilineText" },
            { name: "image_url", type: "singleLineText" },
            { name: "category", type: "singleSelect", options: {
              choices: [
                { name: "broadband" },
                { name: "mobile" },
                { name: "tv" }
              ]
            }},
            { name: "brand", type: "singleLineText" },
            { name: "speed", type: "singleLineText" },
            { name: "data_allowance", type: "singleLineText" },
            { name: "contract_months", type: "number", options: { precision: 0 } }
          ]
        },
        {
          name: "customers",
          description: "Customer information",
          fields: [
            { name: "id", type: "singleLineText" },
            { name: "first_name", type: "singleLineText" },
            { name: "last_name", type: "singleLineText" },
            { name: "email", type: "email" },
            { name: "phone", type: "phoneNumber" },
            { name: "address", type: "singleLineText" },
            { name: "city", type: "singleLineText" },
            { name: "state", type: "singleLineText" },
            { name: "zip_code", type: "singleLineText" }
          ]
        },
        {
          name: "orders",
          description: "Service orders",
          fields: [
            { name: "id", type: "singleLineText" },
            { name: "customer_id", type: "singleLineText" },
            { name: "email", type: "email" },
            { name: "phone", type: "phoneNumber" },
            { name: "items", type: "multilineText" },
            { name: "total_amount", type: "number", options: { precision: 2 } },
            { name: "shipping_status", type: "singleSelect", options: {
              choices: [
                { name: "pending" },
                { name: "processing" },
                { name: "delivered" },
                { name: "cancelled" }
              ]
            }}
          ]
        },
        {
          name: "surveys",
          description: "Customer satisfaction surveys",
          fields: [
            { name: "id", type: "singleLineText" },
            { name: "customer_id", type: "singleLineText" },
            { name: "rating", type: "number", options: { precision: 0 } },
            { name: "feedback", type: "multilineText" },
            { name: "created_at", type: "dateTime", options: { timeZone: "utc", dateFormat: { name: "iso", format: "YYYY-MM-DD" }, timeFormat: { name: "24hour", format: "HH:mm" } } }
          ]
        },
        {
          name: "returns",
          description: "Service cancellations",
          fields: [
            { name: "id", type: "singleLineText" },
            { name: "order_id", type: "singleLineText" },
            { name: "customer_id", type: "singleLineText" },
            { name: "return_reason", type: "multilineText" },
            { name: "created_at", type: "dateTime", options: { timeZone: "utc", dateFormat: { name: "iso", format: "YYYY-MM-DD" }, timeFormat: { name: "24hour", format: "HH:mm" } } }
          ]
        }
      ]
    };
  }

  // Get workspace ID from existing base
  async getWorkspaceId() {
    console.log('Getting workspace ID from current base...');
    const currentBaseId = process.env.AIRTABLE_BASE_ID;
    const result = await this.request('GET', `/v0/meta/bases/${currentBaseId}`);
    console.log(`✓ Using workspace: ${result.workspaceId}\n`);
    return result.workspaceId;
  }

  // Create new base
  async createBase(workspaceId) {
    console.log('Creating new Talk Talk Airtable base...');

    const schema = this.buildBaseSchema();
    schema.workspaceId = workspaceId;
    console.log('Schema prepared with tables:', schema.tables.map(t => t.name).join(', '));

    const result = await this.request('POST', '/v0/meta/bases', schema);
    console.log('\n✓ Base created successfully!');
    console.log('  Base ID:', result.id);
    console.log('  Base Name:', result.name);

    return result;
  }

  // Update .env files with new base ID
  updateEnvFiles(newBaseId) {
    const envPath = path.join(__dirname, '../.env');
    const envExamplePath = path.join(__dirname, '../.env.example');

    // Update .env
    let envContent = fs.readFileSync(envPath, 'utf8');
    envContent = envContent.replace(
      /AIRTABLE_BASE_ID=.*/,
      `AIRTABLE_BASE_ID=${newBaseId}`
    );
    fs.writeFileSync(envPath, envContent);
    console.log('✓ Updated .env with new base ID');

    // Update .env.example
    let envExampleContent = fs.readFileSync(envExamplePath, 'utf8');
    envExampleContent = envExampleContent.replace(
      /AIRTABLE_BASE_ID=.*/,
      `AIRTABLE_BASE_ID=${newBaseId}`
    );
    fs.writeFileSync(envExamplePath, envExampleContent);
    console.log('✓ Updated .env.example with new base ID');
  }

  // Populate sample data
  async populateSampleData(baseId) {
    console.log('\nPopulating sample data...');

    const base = new Airtable({ apiKey: this.apiKey }).base(baseId);

    // Sample plans
    const samplePlans = [
      {
        id: "101",
        name: "Superfast Broadband",
        price: 29.99,
        description: "Unlimited fibre broadband with speeds up to 100 Mbps. Perfect for streaming and gaming.",
        image_url: "https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=400",
        category: "broadband",
        brand: "Talk Talk",
        speed: "100 Mbps",
        data_allowance: "Unlimited",
        contract_months: 24
      },
      {
        id: "102",
        name: "Essential Mobile Plan",
        price: 15.99,
        description: "50GB data with unlimited calls and texts. 5G ready.",
        image_url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400",
        category: "mobile",
        brand: "Talk Talk",
        speed: "5G",
        data_allowance: "50GB",
        contract_months: 12
      },
      {
        id: "103",
        name: "Ultimate TV Package",
        price: 49.99,
        description: "Over 200 channels including premium sports and movies in HD/4K.",
        image_url: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=400",
        category: "tv",
        brand: "Talk Talk",
        speed: "HD/4K",
        data_allowance: "N/A",
        contract_months: 18
      }
    ];

    await base('plans').create(samplePlans.map(fields => ({ fields })));
    console.log(`✓ Created ${samplePlans.length} sample plans`);

    // Sample customer
    const sampleCustomer = {
      id: "CUST001",
      first_name: "John",
      last_name: "Smith",
      email: "john.smith@example.com",
      phone: "+44 7700 900000",
      address: "123 High Street",
      city: "London",
      state: "England",
      zip_code: "SW1A 1AA"
    };

    await base('customers').create([{ fields: sampleCustomer }]);
    console.log('✓ Created 1 sample customer');
  }

  // Main workflow
  async create() {
    try {
      // 1. Get workspace ID from existing base
      const workspaceId = await this.getWorkspaceId();

      // 2. Create base
      const result = await this.createBase(workspaceId);

      // 3. Update env files
      this.updateEnvFiles(result.id);

      // 4. Populate sample data
      await this.populateSampleData(result.id);

      console.log('\n' + '='.repeat(60));
      console.log('✓ Talk Talk base setup complete!');
      console.log('='.repeat(60));
      console.log('\nNew Base Details:');
      console.log('  ID:', result.id);
      console.log('  URL:', `https://airtable.com/${result.id}`);
      console.log('\nNext steps:');
      console.log('  1. Visit the base in Airtable to review the schema');
      console.log('  2. Run: npm run deploy');
      console.log('  3. Test the Talk Talk application');

      return result;
    } catch (error) {
      console.error('\n✗ Base creation failed:', error.message);
      throw error;
    }
  }
}

// Main function
async function main() {
  const apiKey = process.env.AIRTABLE_API_KEY;

  if (!apiKey) {
    console.error('Error: AIRTABLE_API_KEY required in .env');
    process.exit(1);
  }

  const creator = new TalkTalkBaseCreator(apiKey);
  await creator.create();
}

if (require.main === module) {
  main();
}

module.exports = { TalkTalkBaseCreator };
