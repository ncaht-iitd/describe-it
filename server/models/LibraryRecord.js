const mongoose = require('mongoose');

const LibraryRecordSchema = new mongoose.Schema({
  image_url: { type: String, required: true },
  subject: { type: String, required: true },
  standard: { type: String, required: true },
  chapter: { type: String, required: true },
  book: { type: String, required: true },
  description: { type: String, required: true },
  fig_no: { type: String, required: true },
  reviews: { type: Array, default: [] },
  queries: [{
    query: String,
    response: String,
    keywords: [String],
    timestamp: { type: Date, default: Date.now }
  }]
});

// Explicitly use the 'images' collection
const LibraryRecord = mongoose.model('LibraryRecord', LibraryRecordSchema, 'libraryrecords');

module.exports = LibraryRecord;