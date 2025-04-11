const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const s3 = new S3Client({
  region: process.env.AWS_S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

console.log("S3 Bucket Name:", process.env.AWS_S3_BUCKET_VT);
console.log("S3 Region:", process.env.AWS_S3_REGION);

// Function to upload a single image to S3
const uploadImageToS3 = async (filePath, subject, standard, fileName) => {
  try {
    if (!process.env.AWS_S3_BUCKET_VT) {
      throw new Error("Bucket name is missing in .env file!");
    }

    const fileContent = fs.readFileSync(filePath);
    const key = `${subject}/${standard}/${fileName}`;

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_VT,  // Ensure this is set
      Key: key,
      Body: fileContent,
      ContentType: 'image/png' // Adjust if needed
    };

    const command = new PutObjectCommand(params);
    await s3.send(command);

    const imageUrl = `https://${process.env.AWS_S3_BUCKET_VT}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${key}`;

    return { success: true, imageUrl, key };
  } catch (error) {
    console.error(`Error uploading ${fileName} to S3:`, error);
    return { success: false, error: error.message };
  }
};


// Bulk upload function
const bulkUploadToS3 = async (imagesDir, subject, standard) => {
  // Read all files in the directory
  const files = fs.readdirSync(imagesDir);
  
  const uploadResults = [];

  for (const file of files) {
    // Skip non-image files if needed
    if (!['.jpg', '.jpeg', '.png', '.gif'].some(ext => file.toLowerCase().endsWith(ext))) {
      continue;
    }

    const filePath = path.join(imagesDir, file);
    console.log(`Uploading ${file}...`);

    const result = await uploadImageToS3(filePath, subject, standard, file);
    uploadResults.push({
      fileName: file,
      ...result
    });
  }

  // Generate summary
  const summary = {
    total: uploadResults.length,
    successful: uploadResults.filter(r => r.success).length,
    failed: uploadResults.filter(r => !r.success).length
  };

  console.log("\n=== S3 UPLOAD SUMMARY ===");
  console.log(`Total files: ${summary.total}`);
  console.log(`Successful uploads: ${summary.successful}`);
  console.log(`Failed uploads: ${summary.failed}`);

  // Optionally write results to a log file
  fs.writeFileSync(
    `s3-upload-log-${subject}-${standard}-${new Date().toISOString().slice(0,10)}.json`,
    JSON.stringify({
      summary,
      results: uploadResults
    }, null, 2)
  );

  return uploadResults;
};

// Main function to run the script
const main = async () => {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log(`
Usage: node s3-upload.js <images-directory> <subject> <standard>

Example: node s3-upload.js ./images/physics Physics "Grade 10"
    `);
    process.exit(1);
  }
  
  const [imagesDir, subject, standard] = args;
  
  try {
    await bulkUploadToS3(imagesDir, subject, standard);
  } catch (error) {
    console.error("S3 Upload process failed:", error);
    process.exit(1);
  }
};

// Run the main function
main();