import boto3
import json
import os
import sys
from datetime import datetime

def generate_s3_url(bucket, key, region='us-east-1'):
    """
    Generate a standard S3 URL for a given bucket and key
    """
    return f"https://{bucket}.s3.{region}.amazonaws.com/{key}"

def reconstruct_s3_upload_log(bucket, subject, standard):
    """
    Reconstruct S3 upload log for existing images
    """
    # Initialize S3 client
    s3 = boto3.client('s3')
    
    # Construct the prefix (folder path)
    prefix = f"{subject}/{standard}/"
    
    try:
        # List objects
        response = s3.list_objects_v2(Bucket=bucket, Prefix=prefix)
        
        # Process and filter image files
        upload_results = []
        if 'Contents' in response:
            for obj in response['Contents']:
                key = obj['Key']
                # Filter for common image extensions
                if key.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.bmp')):
                    filename = os.path.basename(key)
                    image_url = generate_s3_url(bucket, key)
                    
                    upload_results.append({
                        'fileName': filename,
                        'success': True,
                        'imageUrl': image_url,
                        'key': key
                    })
        
        # Prepare log structure
        log_data = {
            'summary': {
                'total': len(upload_results),
                'successful': len(upload_results),
                'failed': 0
            },
            'results': upload_results
        }
        
        # Generate log filename
        log_filename = f"s3-upload-log-{subject}-{standard}-{datetime.now().strftime('%Y-%m-%d')}.json"
        
        # Write log file
        with open(log_filename, 'w') as f:
            json.dump(log_data, f, indent=2)
        
        print(f"Log file generated: {log_filename}")
        print(f"Total images found: {len(upload_results)}")
        
        return log_filename
    
    except Exception as e:
        print(f"Error reconstructing S3 upload log: {e}")
        return None

def main():
    # Check for command-line arguments
    if len(sys.argv) < 4:
        print(f"""
Usage: 
  python {sys.argv[0]} <bucket_name> <subject> <standard>

Example:
  python {sys.argv[0]} vision-text-library Science "Class 6"
""")
        sys.exit(1)
    
    # Get arguments
    bucket = sys.argv[1]
    subject = sys.argv[2]
    standard = sys.argv[3]
    
    # Reconstruct S3 upload log
    reconstruct_s3_upload_log(bucket, subject, standard)

if __name__ == "__main__":
    main()