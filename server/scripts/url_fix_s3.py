from pymongo import MongoClient

# Connect to MongoDB
client = MongoClient("mongodb+srv://ncahtiitd:ilmWRsUUX9SVZBTw@cluster1.ihm2k.mongodb.net/image_descriptions?retryWrites=true&w=majority&appName=Cluster1")
db = client["image_descriptions"]
collection = db["libraryrecords"]

# Define the base S3 URL
base_s3_url = "https://vision-text-library.s3.ap-south-1.amazonaws.com"

# Fetch all documents and update URLs
for doc in collection.find():
    # Get correct values
    subject = doc.get("subject", "").strip()  # Ensure subject is properly formatted
    standard = doc.get("standard", "").strip()  # Example: "Class 6"
    image_name = doc.get("image_name", "").strip()  # File name

    # Construct the correct S3 URL
    correct_url = f"{base_s3_url}/{subject}/{standard}/{image_name}"

    # Fix the image_url field
    collection.update_one(
        {"_id": doc["_id"]},
        {
            "$set": {"image_url": correct_url},
            "$unset": {"Image_ID": ""}  # Remove incorrect field
        }
    )

    print(f"Fixed: {doc['image_url']} → {correct_url}")

print("✅ Database cleanup complete!")
