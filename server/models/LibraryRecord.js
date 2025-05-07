const mongoose = require('mongoose');

const LibraryRecordSchema = new mongoose.Schema({
  image_name: { type: String, required: true },
  image_url: { type: String, required: true },
  subject: { type: String, required: true },
  standard: { type: String, required: true },
  chapter: { 
    number: { type: String, required: true },
    name: { type: String, required: true }  
  },
  book: { type: String, required: true },
  description: { type: String, required: true },
  fig_no: { type: String, required: false },
  reviews: { type: Array, default: [] },
  keywords: { type: [String], default: [] } 
});


// Explicitly use the 'images' collection
const LibraryRecord = mongoose.model('LibraryRecord', LibraryRecordSchema, 'libraryrecords');

module.exports = LibraryRecord;