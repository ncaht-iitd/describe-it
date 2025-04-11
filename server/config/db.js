const mongoose = require("mongoose");
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const mongoURI = process.env.MONGODB_URI;

const connectDB = async () => {
  try {
    if (!mongoURI) {
      throw new Error("MONGODB_URI is not defined! Check your .env file.");
    }

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ Connected to MongoDB Atlas successfully`);
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
