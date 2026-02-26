const Airtable = require('airtable');

/**
 * Product Lookup Function
 *
 * Generated for: Talk Talk
 * Industry: telecommunications
 * Entity: plans
 */

exports.handler = async function (context, event, callback) {
  try {
    // Validate Airtable configuration
    if (!context.AIRTABLE_API_KEY || !context.AIRTABLE_BASE_ID) {
      return callback(null, {
        status: 500,
        message: 'Airtable configuration error. Please check environment variables.',
      });
    }

    // Airtable setup
    const base = new Airtable({apiKey: context.AIRTABLE_API_KEY}).base(context.AIRTABLE_BASE_ID);

    console.log('Querying all plans from plans table');

    // Query all plans from Airtable
    const records = await base('plans')
      .select()
      .all();  // Use .all() to get all records, not just the first page

    if (!records || records.length === 0) {
      console.log('No plans found in the database');
      return callback(null, {
        status: 404,
        message: 'No plans found in the database',
      });
    }

    console.log(`Found ${records.length} plans`);
    return callback(null, {
      status: 200,
      plans: records.map(record => record.fields),
    });

  } catch (err) {
    console.error('Unexpected error:', err.message);
    return callback(null, {
      status: 500,
      message: 'An unexpected error occurred. Please try again later.',
    });
  }
};
