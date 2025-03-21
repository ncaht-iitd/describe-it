const QueryLog = require('../models/QueryLog'); // Import the QueryLog model

const addQuery = async (fig_no, query, response, keywords, language = 'en-US') => {
  try {
    const newQuery = new QueryLog({
      fig_no,
      query,
      response,
      keywords,
      language,
      timestamp: new Date()
    });

    await newQuery.save(); // Saves the query in `querylogs` collection
    return newQuery;
  } catch (error) {
    console.error('Error adding query:', error);
    throw error;
  }
};

module.exports = addQuery; // Export function for use in other files
