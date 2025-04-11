const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const LibraryRecord = require('../models/LibraryRecord');

// Load environment variables
dotenv.config();

// Convert Excel sheet to JSON
const convertExcelToJson = (filePath) => {
    try {
      // Read the workbook
      const workbook = XLSX.readFile(filePath);
      
      // Get the first sheet name
      const sheetName = workbook.SheetNames[0];
      
      // Convert sheet to JSON
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,  // Treats first row as headers
        defval: ''  // Default value for empty cells
      });
  
      // Extract headers
      const headers = jsonData[0];
      
      // Convert to objects
      const records = jsonData.slice(1).map(row => {
        const record = {};
        headers.forEach((header, index) => {
          // Convert header to lowercase and replace spaces and hyphens with underscores
          const cleanHeader = header.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
          record[cleanHeader] = row[index] || '';
        });
        return record;
      });
  
      return records;
    } catch (error) {
      console.error('Error converting Excel to JSON:', error);
      throw error;
    }
  };
  

// Process Excel and create MongoDB records
const uploadToMongoDB = async (excelFilePath, subject, standard) => {
    await connectDB();
    
    try {
        const records = convertExcelToJson(excelFilePath);
        console.log(`Read ${records.length} records from Excel`);
        
        const uploadResults = [];

        for (const record of records) {
            try {
                // Ensure chapter is an object with required fields
                const chapter = {
                    number: record.chapter_number || record.chapter || 0, // Ensure it's a number
                    name: record.chapter_name || 'Unknown'
                };

                const newRecord = new LibraryRecord({
                    image_name: record.image_name || '', 
                    image_url: record.image_url || '',
                    subject: subject,
                    standard: standard,
                    chapter: chapter,  // Assign as object
                    book: record.book || 'NCERT',
                    description: record.description || '',
                    fig_no: record.fig_no || record.figure_number || '',
                    title: record.title || '',
                    keywords: record.keywords ? record.keywords.split(',').map(k => k.trim()) : [],
                    reviews: [],
                    queries: []
                });

                await newRecord.save();
                console.log(`Added record for image ${record.image_name || 'unknown'}`);

                uploadResults.push({
                    imageName: record.image_name || 'unknown',
                    status: 'success'
                });
            } catch (error) {
                console.error(`Error processing record:`, error);
                uploadResults.push({
                    imageName: record.image_name || 'unknown',
                    status: 'error',
                    error: error.message
                });
            }
        }
        
        await mongoose.connection.close();
        
        const summary = {
            total: uploadResults.length,
            successful: uploadResults.filter(r => r.status === 'success').length,
            failed: uploadResults.filter(r => r.status === 'error').length
        };

        console.log("\n=== MONGODB UPLOAD SUMMARY ===");
        console.log(`Total records: ${summary.total}`);
        console.log(`Successful uploads: ${summary.successful}`);
        console.log(`Failed uploads: ${summary.failed}`);

        fs.writeFileSync(
            `mongodb-upload-log-${subject}-${standard}-${new Date().toISOString().slice(0,10)}.json`,
            JSON.stringify({ summary, results: uploadResults }, null, 2)
        );

        return uploadResults;
    } catch (error) {
        console.error("MongoDB upload process failed:", error);
        throw error;
    }
};

  

// Main function to run the script
const main = async () => {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log(`
Usage: node mongo_upload.js <excel-file> <subject> <standard>

Example: node mongo_upload.js ./data/physics_descriptions.xlsx Physics "Class 7"
    `);
    process.exit(1);
  }
  
  const [excelFile, subject, standard] = args;
  
  try {
    await uploadToMongoDB(excelFile, subject, standard);
  } catch (error) {
    console.error("MongoDB upload process failed:", error);
    process.exit(1);
  }
};

// Run the main function
main();