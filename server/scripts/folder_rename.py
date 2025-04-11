import boto3

# Initialize S3 client
s3 = boto3.client("s3")

# S3 Bucket Name
bucket_name = "vision-text-library"

# Subjects (excluding Science)
subjects = ["Geography", "History", "Mathematics", "Social-Science"]

# Class folder mappings
old_folders = ["Class-6", "Class-7", "Class-8"]
new_folders = ["Class 6", "Class 7", "Class 8"]

# Iterate through subjects
for subject in subjects:
    for old, new in zip(old_folders, new_folders):
        prefix = f"{subject}/{old}/"  # Example: "Geography/Class-6/"
        
        # List all objects in the old class folder
        response = s3.list_objects_v2(Bucket=bucket_name, Prefix=prefix)
        
        if "Contents" in response:
            for obj in response["Contents"]:
                old_key = obj["Key"]
                new_key = old_key.replace(old, new, 1)  # Replace only first occurrence
                
                # Copy file to new location
                s3.copy_object(
                    Bucket=bucket_name,
                    CopySource={"Bucket": bucket_name, "Key": old_key},
                    Key=new_key,
                )

                # Delete old file
                s3.delete_object(Bucket=bucket_name, Key=old_key)
                print(f"✅ Moved: {old_key} → {new_key}")

print("🎉 Folder renaming complete!")
