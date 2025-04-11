const express = require('express');
const router = express.Router();
const LibraryRecord = require('../models/LibraryRecord'); // Adjust path as needed
const { getOpenAIResponse } = require('../services/openai');

// Keyword search endpoint
router.post('/search', async (req, res) => {
  try {
    const { subject, standard, chapter, keyword } = req.body;
    
    // Build the search query based on provided parameters
    const searchQuery = {};
    
    // Add filters for required fields if provided
    if (subject) searchQuery.subject = subject;
    if (standard) {
      searchQuery.standard = {
        $or: [
          `Class ${standard}`,
          `Class-${standard}`,
          `class ${standard}`
        ]
      };
    }
    if (chapter) searchQuery['chapter.name'] = chapter;
    
    // Add keyword search conditions if provided
    if (keyword) {
      searchQuery.$or = [
        { description: { $regex: keyword, $options: 'i' } },
        { keywords: { $regex: keyword, $options: 'i' } },
        { 'queries.keywords': { $regex: keyword, $options: 'i' } },
        { 'chapter.name': { $regex: keyword, $options: 'i' } },
        { image_name: { $regex: keyword, $options: 'i' } }
      ];
    }
    
    console.log("Search query:", searchQuery);
    
    // Find documents matching the search criteria
    const results = await LibraryRecord.find(searchQuery)
      .sort({ '_id': -1 })
      .limit(50);
    
    res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });
    
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({
      success: false,
      error: "Server error during search"
    });
  }
});

// Route for getting chapter images
router.post('/chapterImages', async (req, res) => {
  try {
    const { grade, subject, chapter } = req.body;
    console.log('Received request for chapterImages:', { grade, subject, chapter });
    
    // Validate required fields
    if (!grade || !subject || !chapter) {
      console.log('Missing required fields:', { grade, subject, chapter });
      return res.status(400).json({
        success: false,
        error: "Missing required fields: grade, subject, and chapter are required",
        received: { grade, subject, chapter }
      });
    }
    
    // Format the query based on the data structure
    // Try different standard formats
    const query = {
      $or: [
        { standard: `Class ${grade}` },
        { standard: `Class-${grade}` },
        { standard: `class ${grade}` }
      ],
      subject: subject,
      chapter: chapter
    };
    
    console.log('Executing query:', query);
    const images = await LibraryRecord.find(query);
    console.log(`Found ${images.length} images for the query`);
    
    if (images.length === 0) {
      console.log('No images found for the given criteria');
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }
    
    res.status(200).json({
      success: true,
      count: images.length,
      data: images
    });
    
  } catch (error) {
    console.error("Error fetching chapter images:", error);
    res.status(500).json({
      success: false,
      error: "Server error while fetching chapter images",
      details: error.message
    });
  }
});

// GET FIGURE DATA
router.post('/figData', async (req, res) => {
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
      $or: [
        { standard: `Class ${grade}` },
        { standard: `Class-${grade}` },
        { standard: `class ${grade}` }
      ],
      subject: subject,
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

// Single image details endpoint
router.get('/image/:id', async (req, res) => {
  try {
    const image = await LibraryRecord.findById(req.params.id);
    
    if (!image) {
      return res.status(404).json({
        success: false,
        error: "Image not found"
      });
    }
    
    res.status(200).json({
      success: true,
      data: image
    });
    
  } catch (error) {
    console.error("Error fetching image:", error);
    res.status(500).json({
      success: false,
      error: "Server error while fetching image"
    });
  }
});

// Add the allData endpoint to get the initial data structure
router.get('/allData', async (req, res) => {
  try {
    console.log('Fetching all documents from LibraryRecord...');
    const records = await LibraryRecord.find({}, {
      subject: 1,
      standard: 1,
      'chapter.name': 1,
      _id: 0
    });
    
    console.log(`Found ${records.length} documents`);
    if (records.length === 0) {
      console.log('No documents found in the database');
      return res.status(200).json({ success: true, data: {} });
    }

    const data = {};
    records.forEach(record => {
      try {
        // Normalize the standard format
        let standard = record.standard;
        if (standard.startsWith('class ')) {
          standard = 'Class ' + standard.slice(6);
        } else if (standard.startsWith('Class-')) {
          standard = 'Class ' + standard.slice(6);
        }

        // Initialize the subject if it doesn't exist
        if (!data[record.subject]) {
          data[record.subject] = {};
        }

        // Initialize the standard if it doesn't exist under this subject
        if (!data[record.subject][standard]) {
          data[record.subject][standard] = new Set();
        }
        
        // Add the chapter name to the set
        if (record.chapter && record.chapter.name) {
          data[record.subject][standard].add(record.chapter.name);
        }
      } catch (docError) {
        console.error('Error processing document:', docError, record);
      }
    });

    // Convert Sets to Arrays for JSON serialization
    Object.keys(data).forEach(subject => {
      Object.keys(data[subject]).forEach(standard => {
        data[subject][standard] = Array.from(data[subject][standard]).sort();
      });
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error fetching all data:", error);
    res.status(500).json({
      success: false,
      error: "Server error while fetching all data"
    });
  }
});

// Add review route
router.post('/review', async (req, res) => {
  try {
    const { review, standard, subject, chapter, figNo, image_name } = req.body;

    // Log the incoming request
    console.log('Review request received:', {
      review: review ? 'present' : 'missing',
      standard,
      subject,
      chapter,
      figNo,
      image_name
    });

    // Validate required fields
    if (!review || !standard || !subject || !chapter) {
      return res.status(400).json({
        error: "Missing required fields",
        details: {
          review: !review ? "Review text is required" : null,
          standard: !standard ? "Standard is required" : null,
          subject: !subject ? "Subject is required" : null,
          chapter: !chapter ? "Chapter is required" : null
        }
      });
    }

    // Construct base query to find the document
    const query = {
      $or: [
        { standard: standard },
        { standard: standard.replace('Class ', 'Class-') },
        { standard: standard.toLowerCase() }
      ],
      subject: subject
    };

    // Handle chapter name from object or string
    if (typeof chapter === 'object' && chapter.name) {
      query['chapter.name'] = chapter.name;
    } else {
      query['chapter.name'] = chapter;
    }
    
    // Add specific identifiers if provided
    if (figNo) {
      query.fig_no = figNo;
    }
    if (image_name) {
      query.image_name = image_name;
    }

    console.log('Searching with query:', query);

    // Find matching documents
    const documents = await LibraryRecord.find(query);

    if (!documents || documents.length === 0) {
      console.log('No documents found for query:', query);
      return res.status(404).json({
        error: "Document not found",
        searchCriteria: query
      });
    }

    // If multiple documents found and no specific identifier provided, use the first one
    const document = documents[0];
    console.log(`Found ${documents.length} matching documents, using document:`, {
      id: document._id,
      standard: document.standard,
      subject: document.subject,
      chapter: document.chapter,
      fig_no: document.fig_no,
      image_name: document.image_name
    });

    // Add the review to the reviews array
    document.reviews = document.reviews || [];
    document.reviews.push(review);

    // Save the updated document
    await document.save();

    console.log('Review added successfully to document:', document._id);

    return res.status(200).json({
      message: "Review added successfully",
      reviewCount: document.reviews.length,
      documentInfo: {
        id: document._id,
        standard: document.standard,
        subject: document.subject,
        chapter: document.chapter?.name,
        fig_no: document.fig_no,
        image_name: document.image_name
      }
    });

  } catch (error) {
    console.error("Error adding review:", error);
    return res.status(500).json({
      error: "Failed to add review",
      details: error.message
    });
  }
});

// Chat endpoint for asking more questions
router.post('/askMore', async (req, res) => {
  console.log('CHECKPOINT A: askMore route hit with request:', {
    body: req.body,
    headers: req.headers,
    method: req.method,
    path: req.path,
    url: req.url,
    baseUrl: req.baseUrl,
    originalUrl: req.originalUrl
  });

  try {
    // Handle both figNo and fig_no parameters
    const fig_no = req.body.fig_no || req.body.figNo;
    const user_query = req.body.user_query || req.body.userMessage;
    const language = req.body.language || req.body.selectedLanguage || 'en-US';
    const context = req.body.context;
    
    console.log('CHECKPOINT B: Extracted parameters:', {
      fig_no,
      user_query,
      language,
      context
    });

    // Validate required fields
    if (!fig_no || !user_query) {
      console.log('CHECKPOINT C: Missing required fields:', { fig_no, user_query });
      return res.status(400).json({
        success: false,
        error: "Missing required fields: figure number and user query are required"
      });
    }

    // Find the image record
    const query = {
      $or: [
        { fig_no: fig_no },
        { image_name: fig_no }
      ]
    };

    console.log('CHECKPOINT D: Searching for image with query:', query);
    const imageRecord = await LibraryRecord.findOne(query);
    
    if (!imageRecord) {
      console.log('CHECKPOINT E: No image found for query:', query);
      return res.status(404).json({
        success: false,
        error: "Image not found"
      });
    }

    console.log('CHECKPOINT F: Found image record:', {
      id: imageRecord._id,
      fig_no: imageRecord.fig_no,
      image_name: imageRecord.image_name
    });

    // Get response from OpenAI service
    console.log('CHECKPOINT G: Calling OpenAI service...');
    const aiResponse = await getOpenAIResponse(imageRecord, user_query, language);
    
    console.log('CHECKPOINT H: OpenAI response received:', aiResponse);
    
    res.status(200).json({
      success: true,
      response: aiResponse,
      language: language
    });
  } catch (error) {
    console.error("CHECKPOINT I: Error in /askMore:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      success: false,
      error: "Server error while processing your question",
      details: error.message
    });
  }
});

module.exports = router;