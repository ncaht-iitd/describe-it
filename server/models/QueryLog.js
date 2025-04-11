const mongoose = require('mongoose');

const QueryLogSchema = new mongoose.Schema({
  libraryRecordId: { type: mongoose.Schema.Types.ObjectId, ref: 'LibraryRecord' }, 
  fig_no: { type: String, required: true },
  query: { type: String, required: true },
  response: { type: String, required: true },
  keywords: { type: [String], default: [] },
  language: { type: String, default: 'en-US' },
  timestamp: { type: Date, default: Date.now }
});

// Export the model
const QueryLog = mongoose.model('QueryLog', QueryLogSchema, 'querylogs');
module.exports = QueryLog;
