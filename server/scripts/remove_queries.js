const mongoose = require("mongoose");
const mongoURI = process.env.MONGO_URI;

// 🔹 Replace with your collection name
const COLLECTION_NAME = "libraryrecords"; 

async function removeField() {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    // Get reference to the collection
    const collection = mongoose.connection.collection(COLLECTION_NAME);

    // 🔹 Update all documents to remove the 'queries' field
    const result = await collection.updateMany({}, { $unset: { queries: 1 } });

    console.log(`✅ Updated ${result.modifiedCount} documents. "queries" field removed.`);

    // Close connection
    mongoose.connection.close();
  } catch (error) {
    console.error("❌ Error:", error);
    mongoose.connection.close();
  }
}

// Run the function
removeField();
