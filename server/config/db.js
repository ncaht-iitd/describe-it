const mongoose = require("mongoose");
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const mongoURI = process.env.MONGODB_URI;
// The library lives in this database. Naming it here means a connection string
// without a database name still reaches the right data instead of an empty default.
const dbName = process.env.MONGODB_DB || 'image_descriptions';

const connectDB = async () => {
  try {
    if (!mongoURI) {
      throw new Error("MONGODB_URI is not defined! Check your .env file.");
    }

    await mongoose.connect(mongoURI, { dbName });

    console.log(`✅ Connected to MongoDB Atlas successfully (database: ${dbName})`);
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
