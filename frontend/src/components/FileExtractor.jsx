// src/components/FileExtractor.jsx
import { useState } from 'react';
import { uploadFilesForExtraction } from '../services/extractorService';

const FileExtractor = () => {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  
  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
    setErrorMessage(null); // Clear any previous errors when files change
    setDownloadUrl(null); // Clear any previous download URL
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!files.length) return;
    
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      const url = await uploadFilesForExtraction(files);
      console.log("Received download URL:", url);
      
      // Set the download URL
      setDownloadUrl(url);
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage(error.message || 'An error occurred during file processing');
      setDownloadUrl(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-md mx-auto p-6 bg-gray-900 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-yellow-400">Image Extractor</h2>
      
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {errorMessage}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-300 mb-2">
            Upload PDF or Images
          </label>
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-800 text-gray-300"
          />
          <p className="mt-1 text-sm text-gray-500">
            Supported formats: PDF, JPG, PNG, GIF, BMP
          </p>
        </div>
        <button
          type="submit"
          disabled={!files.length || isLoading}
          className={`w-full py-2 px-4 rounded-md text-white ${
            !files.length || isLoading 
              ? 'bg-gray-400' 
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isLoading ? 'Processing...' : 'Extract Images'}
        </button>
      </form>
      
      {downloadUrl && (
        <div className="mt-4">
          <a 
            href={downloadUrl}
            className="block w-full text-center py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded-md"
            target="_blank" 
            rel="noopener noreferrer"
          >
            Download Extracted Images
          </a>
        </div>
      )}
    </div>
  );
};

export default FileExtractor;