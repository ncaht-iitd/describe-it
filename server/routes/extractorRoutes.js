// server/routes/extractorRoutes.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const FormData = require('form-data');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const fs = require('fs');
const path = require('path');
const os = require('os');

const EXTRACTOR_API_URL = 'https://document-extraction-app.onrender.com';

router.post('/upload', upload.array('file'), async (req, res) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'upload-'));
  const tempFiles = [];
  
  try {
    console.log(`Received ${req.files.length} files from client`);
    
    // Create a FormData instance
    const formData = new FormData();
    
    // Save files to temp directory so we can stream them properly
    for (const file of req.files) {
      const filePath = path.join(tempDir, file.originalname);
      fs.writeFileSync(filePath, file.buffer);
      tempFiles.push(filePath);
      
      // Add both as 'file' and as 'file[]' to cover all bases
      formData.append('file', fs.createReadStream(filePath));
    }
    
    console.log(`Forwarding request to ${EXTRACTOR_API_URL}/upload`);
    
    // Forward to Flask API
    const response = await axios({
      method: 'post',
      url: `${EXTRACTOR_API_URL}/upload`,
      data: formData,
      headers: {
        ...formData.getHeaders(),
      },
      maxRedirects: 0, // Don't follow redirects automatically
      validateStatus: status => true, // Don't throw on any status code
    });
    
    console.log(`Received response with status ${response.status}`);
    
    // Handle different types of responses
    if (response.status >= 300 && response.status < 400) {
      // It's a redirect - get the Location header and send it to the client
      const redirectUrl = response.headers.location;
      console.log(`Redirect URL: ${redirectUrl}`);
      
      // For redirect, construct the full URL if it's a relative path
      let fullRedirectUrl = redirectUrl;
      if (redirectUrl && !redirectUrl.startsWith('http')) {
        const baseUrl = EXTRACTOR_API_URL.replace(/\/[^/]*$/, '');
        fullRedirectUrl = `${baseUrl}${redirectUrl}`;
      }
      
      // Return the redirect URL to the frontend
      res.status(200).json({ downloadUrl: fullRedirectUrl });
    } else if (response.status >= 200 && response.status < 300) {
      // Success response
      // Forward headers and response
      Object.entries(response.headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
      
      if (response.data && response.data.pipe) {
        response.data.pipe(res);
      } else {
        res.send(response.data);
      }
    } else {
      // Error response
      console.error('Error from Flask API:', response.status);
      let errorMessage = 'Failed to process files';
      
      if (response.data) {
        if (typeof response.data === 'string') {
          errorMessage = response.data;
        } else if (typeof response.data === 'object') {
          errorMessage = JSON.stringify(response.data);
        } else if (response.data.toString) {
          errorMessage = response.data.toString();
        }
      }
      
      res.status(response.status).json({ error: errorMessage });
    }
  } catch (error) {
    console.error('Error forwarding to extractor:', error.message);
    res.status(500).json({ 
      error: 'Failed to process files',
      message: error.message
    });
  } finally {
    // Clean up temp files
    tempFiles.forEach(file => {
      try {
        fs.unlinkSync(file);
      } catch (e) {
        console.error(`Failed to delete temp file ${file}:`, e);
      }
    });
    
    try {
      fs.rmdirSync(tempDir);
    } catch (e) {
      console.error(`Failed to delete temp directory ${tempDir}:`, e);
    }
  }
});

module.exports = router;