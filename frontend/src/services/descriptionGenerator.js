import axios from 'axios';

// Get API URL from environment variables with fallback
const API_URL = import.meta.env.VITE_DESCRIPTION_GENERATOR_API_URL || 'https://image-description-generator.onrender.com';

// Configure axios default settings for better error handling
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  timeout: 120000 // 2 minutes timeout for longer operations
});

/**
 * Generate descriptions for uploaded images
 * @param {FormData} formData - Form data containing files and metadata
 * @returns {Promise<Object>} - Response with job_id or error
 */
export const generateDescriptions = async (formData) => {
  try {
    console.log(`Sending request to: ${API_URL}/generate-descriptions`);
    
    // Override content type for FormData
    const response = await apiClient.post('/generate-descriptions', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error in generateDescriptions:', error);
    
    // Enhanced error handling
    if (error.response) {
      // The server responded with a status code outside the 2xx range
      console.error('Server responded with error:', error.response.data);
      throw new Error(error.response.data.error || `Server error: ${error.response.status}`);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server');
      throw new Error('No response from server. The service might be down or experiencing high load.');
    } else {
      // Something happened in setting up the request
      throw new Error(`Request configuration error: ${error.message}`);
    }
  }
};

/**
 * Check the status of a processing job
 * @param {string} jobId - The ID of the job to check
 * @returns {Promise<Object>} - Response with job status
 */
export const checkJobStatus = async (jobId) => {
  try {
    const response = await apiClient.get(`/jobs/${jobId}`);
    return response.data;
  } catch (error) {
    console.error('Error in checkJobStatus:', error);
    throw new Error(
      error.response?.data?.error || 
      error.message || 
      'Failed to check job status'
    );
  }
};

/**
 * Get the URL for downloading the results
 * @param {string} jobId - The ID of the completed job
 * @returns {string} - Download URL
 */
export const getDownloadUrl = (jobId) => {
  return `${API_URL}/download/${jobId}`;
};

/**
 * Cancel an in-progress job
 * @param {string} jobId - The ID of the job to cancel
 * @returns {Promise<Object>} - Response with cancellation result
 */
export const cancelJob = async (jobId) => {
  try {
    const response = await apiClient.delete(`/jobs/${jobId}`);
    return response.data;
  } catch (error) {
    console.error('Error in cancelJob:', error);
    throw new Error(
      error.response?.data?.error || 
      error.message || 
      'Failed to cancel job'
    );
  }
};