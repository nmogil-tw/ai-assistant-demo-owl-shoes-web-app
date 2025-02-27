const Airtable = require('airtable');
const axios = require('axios');

/**
 * Fetches store locations from Airtable with optional filtering by zip code or city
 * 
 * @param {Object} context - Function context
 * @param {Object} event - Event data
 * @param {string} event.zipCode - Optional zip code to filter locations
 * @param {string} event.city - Optional city to filter locations
 * @param {Function} callback - Callback function
 */
exports.handler = async function(context, event, callback) {
  // Set CORS headers
  const response = new Twilio.Response();
  response.appendHeader('Access-Control-Allow-Origin', '*');
  response.appendHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.appendHeader('Content-Type', 'application/json');

  // Handle preflight request
  if (event.request && event.request.method === 'OPTIONS') {
    return callback(null, response);
  }

  console.log('Received request with params:', event);

  try {
    // Check if required environment variables are set
    if (!context.AIRTABLE_API_KEY || !context.AIRTABLE_BASE_ID) {
      console.error('Missing required environment variables: AIRTABLE_API_KEY or AIRTABLE_BASE_ID');
      response.setStatusCode(500);
      response.setBody({
        success: false,
        error: 'Server configuration error: Missing Airtable credentials'
      });
      return callback(null, response);
    }

    // Initialize Airtable
    const base = new Airtable({
      apiKey: context.AIRTABLE_API_KEY
    }).base(context.AIRTABLE_BASE_ID);

    // Prepare filter formula if zip code or city is provided
    let filterFormula = '';
    
    if (event.zipCode) {
      console.log(`Filtering by ZIP code: ${event.zipCode}`);
      filterFormula = `{zip_code} = "${event.zipCode}"`;
    } else if (event.city) {
      console.log(`Filtering by city: ${event.city}`);
      // Case-insensitive search for city
      filterFormula = `LOWER({city}) = "${event.city.toLowerCase()}"`;
    }

    // Query parameters
    const queryParams = {
      view: 'Grid view',
      sort: [{ field: 'store_name', direction: 'asc' }]
    };
    
    // Add filter if provided
    if (filterFormula) {
      queryParams.filterByFormula = filterFormula;
    }

    console.log('Querying Airtable with params:', queryParams);

    // Fetch records from Airtable
    const records = await new Promise((resolve, reject) => {
      const allRecords = [];
      
      base('store_locations')
        .select(queryParams)
        .eachPage(
          function page(records, fetchNextPage) {
            console.log(`Retrieved ${records.length} records from Airtable`);
            records.forEach(record => {
              allRecords.push({
                id: record.id,
                storeId: record.get('store_id'),
                storeName: record.get('store_name'),
                address: record.get('address'),
                city: record.get('city'),
                state: record.get('state'),
                zipCode: record.get('zip_code'),
                phoneNumber: record.get('phone_number'),
                email: record.get('email'),
                hoursMonday: record.get('hours_monday'),
                hoursTuesday: record.get('hours_tuesday'),
                hoursWednesday: record.get('hours_wednesday'),
                hoursThursday: record.get('hours_thursday'),
                hoursFriday: record.get('hours_friday'),
                hoursSaturday: record.get('hours_saturday'),
                hoursSunday: record.get('hours_sunday'),
                hasParking: record.get('has_parking'),
                isWheelchairAccessible: record.get('is_wheelchair_accessible'),
                storeManager: record.get('store_manager'),
                latitude: record.get('latitude'),
                longitude: record.get('longitude')
              });
            });
            
            fetchNextPage();
          },
          function done(err) {
            if (err) {
              console.error('Error fetching from Airtable:', err);
              reject(err);
            } else {
              resolve(allRecords);
            }
          }
        );
    });

    // If no stores found with the filter, return all stores
    if (records.length === 0 && (event.zipCode || event.city)) {
      console.log('No stores found with filter, returning all stores');
      
      // Fetch all records without filter
      const allRecords = await new Promise((resolve, reject) => {
        const records = [];
        
        base('store_locations')
          .select({
            view: 'Grid view',
            sort: [{ field: 'store_name', direction: 'asc' }]
          })
          .eachPage(
            function page(pageRecords, fetchNextPage) {
              pageRecords.forEach(record => {
                records.push({
                  id: record.id,
                  storeId: record.get('store_id'),
                  storeName: record.get('store_name'),
                  address: record.get('address'),
                  city: record.get('city'),
                  state: record.get('state'),
                  zipCode: record.get('zip_code'),
                  phoneNumber: record.get('phone_number'),
                  email: record.get('email'),
                  hoursMonday: record.get('hours_monday'),
                  hoursTuesday: record.get('hours_tuesday'),
                  hoursWednesday: record.get('hours_wednesday'),
                  hoursThursday: record.get('hours_thursday'),
                  hoursFriday: record.get('hours_friday'),
                  hoursSaturday: record.get('hours_saturday'),
                  hoursSunday: record.get('hours_sunday'),
                  hasParking: record.get('has_parking'),
                  isWheelchairAccessible: record.get('is_wheelchair_accessible'),
                  storeManager: record.get('store_manager'),
                  latitude: record.get('latitude'),
                  longitude: record.get('longitude')
                });
              });
              
              fetchNextPage();
            },
            function done(err) {
              if (err) {
                reject(err);
              } else {
                resolve(records);
              }
            }
          );
      });
      
      const responseBody = {
        success: true,
        data: allRecords,
        message: 'No stores found with the provided filter. Showing all stores.'
      };
      
      console.log(`Returning ${allRecords.length} stores with message`);
      response.setBody(responseBody);
    } else {
      const responseBody = {
        success: true,
        data: records
      };
      
      console.log(`Returning ${records.length} stores`);
      response.setBody(responseBody);
    }

    return callback(null, response);
  } catch (error) {
    console.error('Error fetching store locations:', error);
    
    response.setStatusCode(500);
    response.setBody({
      success: false,
      error: 'Failed to fetch store locations',
      details: error.message
    });
    
    return callback(null, response);
  }
}; 