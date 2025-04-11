import boto3
import pandas as pd
import os
import sys

def generate_s3_url(bucket, key, region='us-east-1'):
    """
    Generate a standard S3 URL for a given bucket and key
    """
    return f"https://{bucket}.s3.{region}.amazonaws.com/{key}"

def list_s3_images(bucket, subject, standard):
    """
    List images in a specific S3 path and generate their URLs
    """
    # Initialize S3 client
    s3 = boto3.client('s3')
    
    # Construct the prefix (folder path)
    prefix = f"{subject}/{standard}/"
    
    # List objects
    try:
        response = s3.list_objects_v2(Bucket=bucket, Prefix=prefix)
        
        # Filter and process image files
        image_urls = {}
        if 'Contents' in response:
            for obj in response['Contents']:
                key = obj['Key']
                # Filter for common image extensions
                if key.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.bmp')):
                    # Extract filename from the key
                    filename = os.path.basename(key)
                    url = generate_s3_url(bucket, key)
                    image_urls[filename] = url
        
        return image_urls
    
    except Exception as e:
        print(f"Error listing S3 objects: {e}")
        return {}

def update_excel_with_s3_urls(excel_file, bucket, subject, standard, output_file=None):
    """
    Update Excel file with existing S3 image URLs
    """
    # Retrieve S3 image URLs
    image_urls = list_s3_images(bucket, subject, standard)
    
    # Read the Excel file
    df = pd.read_excel(excel_file)
    
    # Print some diagnostic information
    print(f"Total images in Excel: {len(df)}")
    print(f"Total images found in S3: {len(image_urls)}")
    
    # Track matched and unmatched images
    matched_count = 0
    unmatched_images = []
    
    # Update DataFrame with S3 URLs
    def find_url(row):
        nonlocal matched_count
        
        # Try to find URL for this image name
        image_name = row['image-name']
        if image_name in image_urls:
            matched_count += 1
            return image_urls[image_name]
        
        # If no match found, add to unmatched list
        unmatched_images.append(image_name)
        return row['image_url'] if 'image_url' in row else ''
    
    # Add or update 'image-url' column (Change 'image-url' to 'image_url')
    df['image_url'] = df.apply(find_url, axis=1)

    
    # Prepare output
    print(f"Matched images: {matched_count}")
    print(f"Unmatched images: {len(unmatched_images)}")
    
    if unmatched_images:
        print("\nUnmatched image names:")
        for img in unmatched_images:
            print(f"  - {img}")
    
    # Determine output file path
    if output_file is None:
        base, ext = os.path.splitext(excel_file)
        output_file = f"{base}_with_urls{ext}"
    
    # Save updated Excel file
    df.to_excel(output_file, index=False)
    print(f"\nUpdated Excel file saved to: {output_file}")
    
    return df

def main():
    # Check for command-line arguments
    if len(sys.argv) < 5:
        print(f"""
Usage: 
  python {sys.argv[0]} <excel_file> <bucket_name> <subject> <standard>

Example:
  python {sys.argv[0]} ./dataset/Science/Class-6/ch12/ch12_descriptions.xlsx vision-text-library Science "Class 6"
""")
        sys.exit(1)
    
    # Get arguments
    excel_file = sys.argv[1]
    bucket = sys.argv[2]
    subject = sys.argv[3]
    standard = sys.argv[4]
    
    # Run the update
    update_excel_with_s3_urls(excel_file, bucket, subject, standard)

if __name__ == "__main__":
    main()