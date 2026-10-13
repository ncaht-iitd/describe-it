const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const mongoose = require("mongoose");

const imageRoutes = require('./routes/imageRoutes');
const userUploadsRoutes = require('./routes/userUploads'); 
const LibraryRecord = require('./models/LibraryRecord'); 

require("dotenv").config();

// Initialize Express app
const app = express();

// Basic Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all incoming requests to help debug
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// CORS setup with detailed options
app.use(cors({
  origin: '*',  // Allow all origins during testing
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Enable pre-flight for all routes
app.options('*', cors());

// Request logging middleware with more details
app.use((req, res, next) => {
  console.log('=== Incoming Request ===');
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Method: ${req.method}`);
  console.log(`Path: ${req.path}`);
  console.log('Origin:', req.headers.origin);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  if (req.method !== 'GET') {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  console.log('======================');
  next();
});

// API routes
app.use('/api', imageRoutes);
app.use('/api', userUploadsRoutes);

// PDF Download route
app.post('/api/pdf/download', async (req, res) => {
  console.log('PDF Download endpoint hit!');

  try {
    console.log('=== PDF Download Request ===');
    console.log('Request body:', req.body);
    
    const { image_name } = req.body;

    // Validate image_name is present
    if (!image_name) {
      console.log('Missing image_name');
      return res.status(400).json({
        error: "Missing required field",
        details: "image_name is required"
      });
    }

    // Query ONLY by image_name
    const query = { image_name };
    console.log('Database query:', query);

    // Find the document
    const document = await LibraryRecord.findOne(query);

    if (!document) {
      console.log('No document found for query');
      return res.status(404).json({
        error: "Document not found",
        details: "No document found with the provided image name",
        searchCriteria: query
      });
    }

    console.log('Found document:', {
      id: document._id,
      standard: document.standard,
      subject: document.subject,
      image_name: document.image_name,
      hasPdfUrl: !!document.pdf_url
    });

    // Check if pdf_url exists
    if (!document.pdf_url) {
      return res.status(404).json({
        error: "PDF not available",
        details: "PDF file is not available for this image",
        documentInfo: {
          id: document._id,
          standard: document.standard,
          subject: document.subject,
          image_name: document.image_name
        }
      });
    }

    // Return the PDF URL with success response
    const response = {
      success: true,
      pdf_url: document.pdf_url,
      documentInfo: {
        id: document._id,
        standard: document.standard,
        subject: document.subject,
        image_name: document.image_name
      }
    };

    console.log('Sending response:', response);
    return res.status(200).json(response);

  } catch (error) {
    console.error("Error in PDF download route:", error);
    return res.status(500).json({
      error: "Server error",
      details: error.message
    });
  }
});

app.get("/", async (req, res) => {
  res.status(200).json({ msg: "Server running sussessfully..." });
});

// Add a simple test endpoint
app.get('/ping', (req, res) => {
  return res.json({ success: true, response: 'pong' });
});

// Add a test endpoint to check database connection and content
app.get("/test/database", async (req, res) => {
  try {
    // Test database connection
    const connectionState = mongoose.connection.readyState;
    const connectionStatus = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    // Count documents in LibraryRecord
    const recordCount = await LibraryRecord.countDocuments();
    
    // Get a sample record
    const sampleRecord = await LibraryRecord.findOne({});

    return res.status(200).json({
      databaseConnection: connectionStatus[connectionState],
      recordCount,
      sampleRecord: sampleRecord ? {
        subject: sampleRecord.subject,
        standard: sampleRecord.standard,
        chapter: sampleRecord.chapter,
        fig_no: sampleRecord.fig_no
      } : null
    });
  } catch (err) {
    console.error('Error in database test:', err);
    return res.status(500).json({
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Add a test endpoint to list documents
app.get("/api/list-docs", async (req, res) => {
  try {
    const docs = await LibraryRecord.find({})
      .select('standard subject image_name pdf_url')
      .limit(5);
    
    return res.status(200).json({
      count: docs.length,
      documents: docs
    });
  } catch (err) {
    console.error('Error listing documents:', err);
    return res.status(500).json({
      error: err.message
    });
  }
});

module.exports = app;

// Start the server when run directly (`node app.js`); tests import `app` without starting it.
if (require.main === module) {
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });

  mongoose.connection.once('open', () => {
    console.log('MongoDB database connection established successfully');
    const port = process.env.PORT || 5000;
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  });

  connectDB();
}
