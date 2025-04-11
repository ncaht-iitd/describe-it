const { MongoClient } = require('mongodb');

// MongoDB connection details
const uri = "mongodb+srv://ncahtiitd:ilmWRsUUX9SVZBTw@cluster1.ihm2k.mongodb.net/image_descriptions?retryWrites=true&w=majority&appName=Cluster1"; // Replace with your MongoDB connection string
const dbName = "image_descriptions"; // Replace with your database name
const collectionName = "libraryrecords"; // Replace with your collection name

// Field containing the image URL (modify if needed)
const imageUrlField = "image_url";

// The correct S3 endpoint
const correctEndpoint = "vision-text-library.s3.ap-south-1.amazonaws.com";

async function updateS3Urls() {
  let client;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(uri);
    await client.connect();
    console.log("Connected to MongoDB");
    
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    
    // Find all documents with URLs containing "vision-text-library" but not the correct endpoint
    const query = {
      [imageUrlField]: { 
        $regex: "vision-text-library", 
        $not: { $regex: correctEndpoint } 
      }
    };

    // Get total number of documents to update
    const totalDocs = await collection.countDocuments(query);
    console.log(`Found ${totalDocs} documents with incorrect S3 URLs`);
    
    // Process all matching documents
    const cursor = collection.find(query);
    let updatedCount = 0;
    
    for await (const doc of cursor) {
      const originalUrl = doc[imageUrlField];
      
      // Extract the object key from the old URL - this depends on your URL format
      // This is a simplified approach - adjust based on your actual URL structure
      const objectKeyMatch = originalUrl.match(/\/([^\/]+\/[^\/]+)$/);
      const objectKey = objectKeyMatch ? objectKeyMatch[1] : originalUrl.split('/').pop();
      
      // Create the new URL with the correct endpoint
      const newUrl = `https://${correctEndpoint}/${objectKey}`;
      
      // Update the document
      await collection.updateOne(
        { _id: doc._id },
        { $set: { [imageUrlField]: newUrl } }
      );
      
      updatedCount++;
      if (updatedCount % 100 === 0) {
        console.log(`Updated ${updatedCount}/${totalDocs} documents`);
      }
    }
    
    console.log(`Successfully updated ${updatedCount} documents with the correct S3 endpoint`);
    
  } catch (error) {
    console.error("Error updating S3 URLs:", error);
  } finally {
    if (client) {
      await client.close();
      console.log("MongoDB connection closed");
    }
  }
}

// Run the update function
updateS3Urls();