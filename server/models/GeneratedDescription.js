const mongoose = require('mongoose');

// Every description generated for a library image, kept as history.
// The library record holds only the description an admin chose to save.
const GeneratedDescriptionSchema = new mongoose.Schema({
  record: { type: mongoose.Schema.Types.ObjectId, ref: 'LibraryRecord', required: true, index: true },
  // 'generated' for model output; 'library' for a library description kept before it was replaced
  source: { type: String, enum: ['generated', 'library'], default: 'generated' },
  alt_text: { type: String, default: '' },
  long_description: { type: String, required: true },
  model: {
    id: String,        // id from the Describe service catalogue, e.g. "gpt-5.5"
    label: String,     // e.g. "GPT-5.5"
    provider: String,
    name: String,      // provider's model name
  },
  prompt_version: String,
  usage: { input_tokens: Number, output_tokens: Number },
  seconds: Number,
  saved_to_library_at: Date,
  saved_by: String,
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

module.exports = mongoose.model('GeneratedDescription', GeneratedDescriptionSchema, 'generated_descriptions');
