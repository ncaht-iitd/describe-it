const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const { rateLimit } = require('express-rate-limit');
const { S3Client } = require("@aws-sdk/client-s3");
const s3 = require('./config/s3'); 

const multer = require("multer");
const multerS3 = require("multer-s3");
const { v4: uuidv4 } = require("uuid");

const OpenAI = require("openai");
const sharp = require("sharp");
const axios = require("axios");

const { getOpenAIResponse } = require('./services/openai');
const addQuery = require('./services/addQuery');
const imageRoutes = require('./routes/imageRoutes');
const userUploadsRoutes = require('./routes/userUploads'); 
const LibraryRecord = require('./models/LibraryRecord'); 

require("dotenv").config();

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

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

// Start server only after MongoDB connects
mongoose.connection.once('open', () => {
  console.log('MongoDB database connection established successfully');
  
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

  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

module.exports = app;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const requiredEnvVars = [
  "AWS_S3_REGION",
  "AWS_ACCESS_KEY",
  "AWS_SECRET_KEY",
  "AWS_S3_BUCKET_VT"
];
requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`Missing required environment variable: ${varName}`);
    process.exit(1);
  }
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET_VT,
    acl: "public-read",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      const ext = file.originalname.includes(".")
        ? file.originalname.substring(file.originalname.lastIndexOf("."))
        : "";
      const filename = `${uuidv4()}${ext}`;
      req.body.mime_type = file.mimetype;
      req.body.filename = filename;
      cb(null, filename);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB file size limit
  fileFilter: function (req, file, cb) {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/jpg",
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(
        new Error("Invalid file type. Only JPEG, PNG, and GIF are allowed.")
      );
    }
    cb(null, true);
  },
}).single("file");

async function convertImageToBase64(url) {
  try {
    const response = await axios({
      url,
      responseType: "arraybuffer",
    });
    const input = response.data;
    const output = await sharp(input, { failOnError: false }).jpeg().toBuffer();
    return output.toString("base64");
  } catch (error) {
    console.error("Error processing the image:", error);
    return null;
  }
}

async function generateDescription(image_url) {
  try {
    const base64Image = await convertImageToBase64(image_url);

    const prompt = `Describe the given geometric diagram image for a 12-13 year old visually impaired student, focusing on:

            1. Identify the main mathematical shape(s) or object(s) shown, using simple terms.
            2. Briefly explain what the overall diagram is showing. Use relatable examples if needed (e.g., "birthday cap" for a cone).
            3. Describe important elements within the diagram and be specific about the number of objects and their spatial relationships.(IF ANY, DON'T MENTION THIS POINT IF NONE PRESENT)
            4. Mention any labels, letters, or numbers and what they represent. Omit unnecessary figure names.
            5. Include measurements or special features only if essential to understanding.
            6. Carefully examine the figure to ensure mathematical accuracy in your description.

        Aim for 50-100 words unless more detail is truly necessary.
        Provide a clear, simple explanation that allows the student to visualize and understand the key aspects of the diagram.
        Prioritize accuracy over brevity, but strive for conciseness where possible.
	`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
    });
    let description = response.choices[0].message.content;
    // Save the chat in the database
    return description;
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

app.post("/upload", async (req, res) => {
  upload(req, res, async (err) => {
    let { subject, standard, chapter, book, description, fig_no } = req.body;
    console.log(subject, standard, chapter, book, fig_no);
    if (!subject || !standard || !chapter || !book || !fig_no) {
      return res
        .status(400)
        .json({ error: "Please provide all the required fields" });
    }

    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.message });
    } else if (err) {
      console.log("err", err);
      return res.status(500).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No file found" });
    }

    if (
      description === undefined ||
      description === null ||
      description === ""
    ) {
      description = await generateDescription(req.file.location);
    }

    try {
      const newRecord = new LibraryRecord({
        image_url: req.file.location,
        subject,
        standard,
        chapter,
        book,
        description: description,
        fig_no,
      });
      const response = await newRecord.save();
      return res.status(200).json({
        message: "File uploaded successfully",
        data: response,
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: err.message });
    }
  });
});

app.get("/", async (req, res) => {
  res.status(200).json({ msg: "Server running sussessfully..." });
});

// Add a simple test endpoint
app.get('/ping', (req, res) => {
  return res.json({ success: true, response: 'pong' });
});

// GET FIGURE DATA
app.post("/figData", async (req, res) => {
  const { grade, subject, chapter, figNo } = req.body;

  // Log the incoming request
  console.log('Received figData request:', {
    grade,
    subject,
    chapter,
    figNo
  });

  // Validate input
  if (!grade || !subject || !chapter || !figNo) {
    console.log('Missing required fields in request');
    return res.status(400).json({
      error: "Missing required fields",
      details: {
        grade: !grade ? "Grade is required" : null,
        subject: !subject ? "Subject is required" : null,
        chapter: !chapter ? "Chapter is required" : null,
        figNo: !figNo ? "Figure number is required" : null
      }
    });
  }

  try {
    // Log the query we're about to make
    const query = {
      subject: subject,
      standard: `Class ${grade}`,
      chapter: chapter,
      fig_no: figNo,
      book: "NCERT"
    };
    console.log('Searching with query:', query);

    const data = await LibraryRecord.findOne(query);
    
    if (!data) {
      console.log('No matching record found');
      return res.status(404).json({
        error: "Figure not found",
        searchCriteria: query
      });
    }

    console.log('Found matching record:', {
      id: data._id,
      subject: data.subject,
      standard: data.standard,
      chapter: data.chapter,
      fig_no: data.fig_no
    });

    return res.status(200).json(data);
  } catch (err) {
    console.error('Error in /figData:', err);
    return res.status(500).json({
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
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

// Helper function to extract keywords with fixed stopWords implementation
function extractKeywords(query) {
  // Define stopWords as an array instead of a Set
  const stopWords = [
    "what", "where", "when", "how", "why", "is", "are", "can", "could",
    "the", "in", "on", "at", "to", "for", "of", "and", "or", "this",
    "that", "these", "those", "am", "will", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "but", "by", "from",
    "with", "about", "into", "through", "after", "before", "above",
    "below", "up", "down", "please", "tell", "me", "show"
  ];

  // Normalize text: convert to lowercase, remove punctuation, and split into words
  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(' ')
    .filter(word => word.length > 2 && !stopWords.includes(word))
    .map(word => word.replace(/[^a-z]/g, '')); // Remove any remaining non-alphabetic chars
}

// Enhanced similarity calculation function
function calculateSimilarity(query1, query2) {
  // Extract keywords from both queries
  const words1 = extractKeywords(query1);
  const words2 = extractKeywords(query2);
  
  // If either query has no keywords after processing, they're not similar
  if (words1.length === 0 || words2.length === 0) {
    return 0;
  }

  // Create sets of unique words
  const set1 = new Set(words1);
  const set2 = new Set(words2);

  // Calculate intersection and union
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  // Calculate Jaccard similarity
  const jaccardSimilarity = intersection.size / union.size;

  // Calculate word order similarity
  let orderSimilarity = 0;
  const minLength = Math.min(words1.length, words2.length);
  let matchingInOrder = 0;
  
  for (let i = 0; i < minLength; i++) {
    if (words1[i] === words2[i]) {
      matchingInOrder++;
    }
  }
  orderSimilarity = matchingInOrder / minLength;

  // Combine both similarity measures with weights
  const combinedSimilarity = (jaccardSimilarity * 0.7) + (orderSimilarity * 0.3);

  return combinedSimilarity;
}

app.get("/test/logs", async (req, res) => {
  try {
    const logs = await QueryLog.find({});
    console.log('All logs:', logs);
    res.status(200).json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: "Failed to fetch logs" });
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