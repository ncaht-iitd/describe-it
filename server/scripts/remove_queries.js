const mongoose = require("mongoose");

// 🔹 Replace with your MongoDB connection URI
const MONGO_URI = "mongodb+srv://ncahtiitd:ilmWRsUUX9SVZBTw@cluster1.ihm2k.mongodb.net/image_descriptions?retryWrites=true&w=majority&appName=Cluster1";

// 🔹 Replace with your collection name
const COLLECTION_NAME = "libraryrecords"; 

async function removeField() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, {
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
