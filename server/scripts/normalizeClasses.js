const mongoose = require('mongoose');
const LibraryRecord = require('../models/LibraryRecord');  // Adjust the path if needed
const mongoURI = process.env.MONGO_URI;
// MongoDB connection
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('Error connecting to MongoDB:', err);
});

// Function to normalize class names in the database
async function normalizeClassNames() {
  try {
    // Update for Class 6, Class 7, and Class 8 (case insensitive)
    await LibraryRecord.updateMany(
      { 'standard': { $in: ['class 6', 'Class 6', 'Class-6'] } },
      { $set: { 'standard': 'Class 6' } }
    );

    await LibraryRecord.updateMany(
      { 'standard': { $in: ['class 7', 'Class 7', 'Class-7'] } },
      { $set: { 'standard': 'Class 7' } }
    );

    await LibraryRecord.updateMany(
      { 'standard': { $in: ['class 8', 'Class 8', 'Class-8'] } },
      { $set: { 'standard': 'Class 8' } }
    );

    console.log('Class names normalized successfully!');
  } catch (error) {
    console.error('Error normalizing class names:', error);
  } finally {
    // Close the connection after the script finishes
    mongoose.connection.close();
  }
}

// Run the normalization function
normalizeClassNames();
