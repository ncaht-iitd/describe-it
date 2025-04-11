const express = require('express');
const multer = require('multer');
const { OpenAI } = require('openai');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Configure multer for temporary file storage (in memory)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image file.'), false);
    }
  }
});

// Initialize OpenAI with error handling
let openai;
try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
} catch (error) {
  console.error('Error initializing OpenAI:', error);
}

// Define UserUpload schema using the main mongoose connection
const UserUploadSchema = new mongoose.Schema({
  originalFilename: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  additionalInfo: {
    type: String,
    default: ''
  },
  uploadDate: {
    type: Date,
    default: Date.now
  }
});

const UserUpload = mongoose.model('UserUpload', UserUploadSchema);

// Function to encode file data to base64
const encodeImageToBase64 = (buffer, mimetype) => {
  return `data:${mimetype};base64,${buffer.toString('base64')}`;
};

// User image description endpoint - no S3 storage
router.post('/user-image-description', upload.single('image'), async (req, res) => {
  try {
    // Check if OpenAI is properly initialized
    if (!openai) {
      throw new Error('OpenAI client not properly initialized');
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Get additional info from request (if any)
    const additionalInfo = req.body.additionalInfo || '';
    
    // Convert image to base64 for API call
    const base64Image = encodeImageToBase64(req.file.buffer, req.file.mimetype);
    
    // Generate description using GPT-4 Vision
    const gptMessages = [
      {
        role: "system",
        content: "You are a detailed image descriptor for visually impaired students. Provide clear, informative descriptions that capture all important elements in the image. Focus on educational value and clarity."
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Please provide a detailed description of this image for a visually impaired student. ${additionalInfo ? 'Additional context: ' + additionalInfo : ''}`
          },
          {
            type: "image_url",
            image_url: {
              url: base64Image,
              detail: "high"
            }
          }
        ]
      }
    ];
    
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o",  // Updated to correct model name
      messages: gptMessages,
      temperature: 0.3,
      max_tokens: 500
    });
    
    if (!aiResponse?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI');
    }

    const description = aiResponse.choices[0].message.content;
    
    // Save to MongoDB
    const newUpload = new UserUpload({
      originalFilename: req.file.originalname,
      description: description,
      additionalInfo: additionalInfo,
      uploadDate: new Date()
    });
    
    await newUpload.save();
    
    // Return success response with the description
    res.status(200).json({
      message: 'Description generated successfully',
      description,
      uploadId: newUpload._id
    });
    
  } catch (error) {
    console.error('Error in user-image-description:', error);
    
    // Send appropriate error response
    const errorMessage = error.response?.data?.error || error.message || 'Failed to generate image description';
    res.status(500).json({ 
      message: 'Failed to generate image description', 
      error: errorMessage
    });
  }
});

module.exports = router;