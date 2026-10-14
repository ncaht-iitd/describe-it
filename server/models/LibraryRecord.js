const mongoose = require('mongoose');

const LibraryRecordSchema = new mongoose.Schema({
  image_name: { type: String, required: true },
  // Legacy S3 link; the API now works out working links from image_name (lib/media.js)
  image_url: { type: String, required: false },
  subject: { type: String, required: true },
  standard: { type: String, required: true },
  chapter: { 
    number: { type: String, required: true },
    name: { type: String, required: true }  
  },
  book: { type: String, required: true },
  description: { type: String, default: '' },
  fig_no: { type: String, required: false },
  reviews: { type: Array, default: [] },
  keywords: { type: [String], default: [] },
  pdf_url: { type: String, required: false },
  // Which collection (dataset) the image belongs to; records without it are 'ncert-old'
  dataset: { type: String, required: false }
});


// Explicitly use the 'images' collection
const LibraryRecord = mongoose.model('LibraryRecord', LibraryRecordSchema, 'libraryrecords');

module.exports = LibraryRecord;