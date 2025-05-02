// src/services/extractorService.js
const EXTRACTOR_API_URL = import.meta.env.VITE_EXTRACTOR_API_URL;

export const uploadFilesForExtraction = async (files) => {
  const formData = new FormData();

  // Keep it simple - just append files with the name 'file'
  files.forEach(file => {
    formData.append('file', file);
  });
  
  console.log("FormData preview:");
  for (const pair of formData.entries()) {
    console.log(pair[0], pair[1]);
  }

  try {
    console.log(`Sending ${files.length} files to ${EXTRACTOR_API_URL}/upload`);
    
    const response = await fetch(`${EXTRACTOR_API_URL}/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      let errorMessage = 'Failed to process files';
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || JSON.stringify(errorData);
      } catch (e) {
        // If not JSON, try to get text
        try {
          errorMessage = await response.text();
        } catch (textError) {
          // Fallback if we can't read the response
          errorMessage = `Server error: ${response.status}`;
        }
      }
      
      throw new Error(errorMessage);
    }
    
    // Try to parse response as JSON first
    try {
      const jsonResponse = await response.json();
      console.log('JSON response:', jsonResponse);
      return jsonResponse.downloadUrl || response.url;
    } catch (e) {
      // If not JSON, return the response URL
      return response.url;
    }
  } catch (error) {
    console.error('Error uploading files:', error);
    throw error;
  }
};