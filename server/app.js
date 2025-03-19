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

require("dotenv").config();
const LibraryRecord = require('./models/LibraryRecord');

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();


// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});
app.use(limiter);

const addQuery = async (fig_no, query, response, keywords) => {
  try {
    const result = await LibraryRecord.findOneAndUpdate(
      { fig_no },
      { 
        $push: { 
          queries: {
            query,
            response,
            keywords,
            timestamp: new Date()
          }
        }
      },
      { new: true }
    );
    return result;
  } catch (error) {
    console.error('Error adding query:', error);
    throw error;
  }
};

// Modified route handler for askMore
const handleAskMore = async (req, res) => {
  try {
    const { fig_no, user_query } = req.body;

    // Input validation
    if (!fig_no || !user_query) {
      return res.status(400).json({
        error: "Missing required fields"
      });
    }

    // Find the document and its existing queries
    const record = await LibraryRecord.findOne({ fig_no });
    if (!record) {
      return res.status(404).json({
        error: "Figure not found"
      });
    }

    // Check for similar queries
    const similarityThreshold = 0.5;
    const similarQueries = record.queries
      .map(q => ({
        ...q.toObject(),
        similarity: calculateSimilarity(q.query, user_query)
      }))
      .filter(q => q.similarity > similarityThreshold)
      .sort((a, b) => b.similarity - a.similarity);

    if (similarQueries.length > 0) {
      return res.status(200).json({
        response: similarQueries[0].response,
        success: true,
        cached: true,
        similarityScore: similarQueries[0].similarity,
        originalQuery: similarQueries[0].query
      });
    }

    // If no similar queries, proceed with OpenAI
    const aiResponse = await getOpenAIResponse(record, user_query);
    
    // Add the new query to the document
    await addQuery(fig_no, user_query, aiResponse, extractKeywords(user_query));

    return res.status(200).json({
      response: aiResponse,
      success: true,
      cached: false
    });

  } catch (error) {
    console.error("Error processing Ask More request:", error);
    return res.status(500).json({
      error: "Error processing your request",
      success: false
    });
  }
};

module.exports = {
  LibraryRecord,
  addQuery,
  handleAskMore
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const requiredEnvVars = [
  "AWS_S3_REGION",
  "AWS_ACCESS_KEY",
  "AWS_SECRET_KEY",
  "AWS_BUCKET",
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
    bucket: process.env.AWS_BUCKET,
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

// GET THE OVERALL DATA LIST FOR CLASS CHAPTER SUBJECT AND FIG No.
app.get("/allData", async (req, res) => {
  try {
    console.log('Fetching all documents from LibraryRecord...');
    const documents = await LibraryRecord.find({});
    
    console.log(`Found ${documents.length} documents`);
    if (documents.length === 0) {
      console.log('No documents found in the database');
      return res.status(200).json({ data: {} });
    }

    const data = {};

    documents.forEach((doc) => {
      try {
        const standard = parseInt(doc.standard.replace("Class ", ""));
        const subject = doc.subject;
        const chapter = doc.chapter;
        const figure = doc.fig_no;

        // Initialize nested objects if they don't exist
        if (!data[standard]) {
          data[standard] = {};
        }

        if (!data[standard][subject]) {
          data[standard][subject] = {};
        }

        if (!data[standard][subject][chapter]) {
          data[standard][subject][chapter] = [];
        }

        data[standard][subject][chapter].push(figure);
      } catch (docError) {
        console.error('Error processing document:', docError, doc);
      }
    });

    console.log('Final data structure keys:', Object.keys(data));
    return res.status(200).json({ data });
  } catch (err) {
    console.error('Error in /allData:', err);
    return res.status(500).json({ 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
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

//ADD USER REVIEW
app.post("/review", async (req, res) => {
  const { review, grade, subject, chapter, figNo } = req.body;
  try {
    const record = await LibraryRecord.findOne({
      subject: subject,
      standard: `Class ${grade}`,
      chapter: chapter,
      fig_no: figNo,
      book: "NCERT",
    });
    record.reviews.push(review);
    await record.save();
    return res.status(200).json({ message: "Review added successfully" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
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

app.post("/askMore", async (req, res) => {
  let record;
  const { fig_no, user_query, language } = req.body;

  try {
    console.log("Starting to process request");

    // Input validation
    if (!fig_no || !user_query) {
      return res.status(400).json({
        error: "Missing required fields",
        response: "Missing required information. Please provide both figure number and question.",
        details: {
          fig_no: !fig_no ? "Figure number is required" : null,
          user_query: !user_query ? "User query is required" : null
        }
      });
    }

    // Find the document and get existing queries
    record = await LibraryRecord.findOne({ fig_no });
    if (!record) {
      return res.status(404).json({
        error: "Figure not found",
        response: "Sorry, I couldn't find information about that figure. Please check the figure number and try again.",
        details: `No record found for figure number: ${fig_no}`
      });
    }

    // Get existing queries from the document
    const existingQueries = record.queries || [];
    
    // Check for similar queries
    const similarityThreshold = 0.5;
    const similarQueries = existingQueries
      .map(query => ({
        ...query.toObject(),
        similarity: calculateSimilarity(query.query, user_query)
      }))
      .filter(query => query.similarity > similarityThreshold)
      .sort((a, b) => b.similarity - a.similarity);

    if (similarQueries.length > 0) {
      console.log('Similar query found:', {
        original: similarQueries[0].query,
        new: user_query,
        similarity: similarQueries[0].similarity
      });

    console.log("Similar queries found:", similarQueries.length);
    console.log("About to call OpenAI API");
      
      return res.status(200).json({
        response: similarQueries[0].response,
        success: true,
        cached: true,
        similarityScore: similarQueries[0].similarity,
        originalQuery: similarQueries[0].query
      });
    }

    const { description, subject, chapter, standard } = record;

    // Create OpenAI prompt
    const prompt = `Context: ${subject}, ${standard}, Chapter: ${chapter}, Figure ${fig_no}
    
    Original description: "${description}"
    
    Question: "${user_query}"
    
    Preferred language: ${language || 'en-US'}
    
    Provide a brief, direct answer that is:
    1. Screen-reader friendly (no special formatting or symbols)
    2. Under 3 sentences where possible
    3. Uses plain language suitable for grade ${standard}
    4. Focuses only on the specific question asked
    5. Avoids unnecessary repetition of context
    
    Answer the question directly without any introductory phrases or conclusions.`;

    // Get response from OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a concise mathematics teacher. Provide brief, clear answers without formatting, markdown, or special characters. Focus on essential information only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 200
    });

    const aiResponse = response.choices[0].message.content;
    console.log("OpenAI API response received");
    // Add new query to the document
    await LibraryRecord.findOneAndUpdate(
      { fig_no },
      {
        $push: {
          queries: {
            query: user_query,
            response: aiResponse,
            keywords: extractKeywords(user_query),
            timestamp: new Date()
          }
        }
      },
      { new: true }
    );

    console.log('New query logged:', {
      fig_no,
      query: user_query,
      keywords: extractKeywords(user_query)
    });

    return res.status(200).json({
      response: aiResponse,
      success: true,
      cached: false
    });

  } catch (error) {
    console.error("Error processing Ask More request:", error);
    const errorResponse = {
      error: "Error processing your request",
      response: "Sorry, I encountered a technical issue. Please try again later.",
      success: false,
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    };

    // Make sure to use req.body.fig_no instead of fig_no directly if there's a chance
    // it might not be accessible due to previous errors
    if (error.message && error.message.includes("No record found")) {
      errorResponse.error = "Figure not found";
      errorResponse.response = "Sorry, I couldn't find that figure in our database.";
      errorResponse.details = `No record found for figure number: ${req.body.fig_no || 'unknown'}`;
      return res.status(404).json(errorResponse);
    }

    if (error.response?.status === 429) {
      errorResponse.error = "Rate limit exceeded. Please try again later.";
      errorResponse.response = "I'm getting too many requests right now. Please try again in a moment.";
      return res.status(429).json(errorResponse);
    }

    if (error.response?.status === 400) {
      errorResponse.error = "Invalid request to AI service";
      errorResponse.response = "I couldn't process your question. Please try rephrasing it.";
      return res.status(400).json(errorResponse);
    }

    return res.status(500).json(errorResponse);
  }
});

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

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;