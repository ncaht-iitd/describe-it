const mongoose = require('mongoose');
const LibraryRecord = require('../models/LibraryRecord'); 

const bucketName = process.env.AWS_S3_BUCKET_VT_TACTILE;
const region = process.env.AWS_S3_REGION;
const mongoURI = process.env.MONGODB_URI;

async function updateClass7SciencePDFLinks() {
  await mongoose.connect(mongoURI);

  // Fetch records for Class 7 Science
  const records = await LibraryRecord.find({ standard: "Class 7", subject: "Science" });

  for (const record of records) {
    const pdfFileName = record.image_name.replace(/\.(jpg|jpeg|png)$/i, '.pdf');
    const pdfUrl = `https://${bucketName}.s3.${region}.amazonaws.com/class7/science/${pdfFileName}`;

    // Only update if the pdf_url is empty or incorrect
    if (!record.pdf_url || record.pdf_url !== pdfUrl) {
      await LibraryRecord.updateOne(
        { _id: record._id },
        { $set: { pdf_url: pdfUrl } }
      );
      console.log(`Updated: ${record.image_name} -> ${pdfFileName}`);
    }
  }

  console.log('Updated PDF URLs for Class 7 Science.');
  mongoose.disconnect();
}

updateClass7SciencePDFLinks();
