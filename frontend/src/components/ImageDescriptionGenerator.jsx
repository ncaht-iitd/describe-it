import React, { useState, useEffect } from 'react';
import { 
  generateDescriptions, 
  checkJobStatus, 
  getDownloadUrl 
} from '../services/descriptionGenerator';
import { FaFileUpload, FaFileDownload, FaSpinner, FaExclamationCircle } from 'react-icons/fa';

const ImageDescriptionGenerator = () => {
  const [files, setFiles] = useState([]);
  const [subject, setSubject] = useState('');
  const [audience, setAudience] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [detailedError, setDetailedError] = useState('');

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setErrorMessage('');
    setDetailedError('');
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (files.length === 0) {
      setErrorMessage('Please select at least one file');
      return;
    }
    
    if (!subject.trim()) {
      setErrorMessage('Please enter a subject');
      return;
    }
    
    if (!audience.trim()) {
      setErrorMessage('Please enter an audience');
      return;
    }
    
    setErrorMessage('');
    setDetailedError('');
    setIsLoading(true);
    setProgress(10);
    
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('file', file);
      });
      formData.append('subject', subject);
      formData.append('audience', audience);
      
      setProgress(30);
      
      // Use the imported service function instead of direct axios call
      const response = await generateDescriptions(formData);
      
      setProgress(70);
      
      if (response.success) {
        setJobId(response.job_id);
        setJobStatus('processing');
      } else {
        throw new Error(response.error || 'Unknown error occurred');
      }
      
    } catch (error) {
      console.error('Error uploading files:', error);
      setErrorMessage('Error processing images. Please try again.');
      setDetailedError(error.message);
      setJobStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Check job status periodically
  useEffect(() => {
    let interval;
    
    if (jobId && jobStatus === 'processing') {
      interval = setInterval(async () => {
        try {
          // Use the imported service function
          const response = await checkJobStatus(jobId);
          
          if (response.status === 'completed') {
            setJobStatus('completed');
            setProgress(100);
            clearInterval(interval);
          } else if (response.status === 'not_found') {
            setJobStatus('error');
            clearInterval(interval);
            setErrorMessage('Job not found. Please try again.');
          } else {
            setProgress(prev => Math.min(prev + 5, 90));
          }
        } catch (error) {
          console.error('Error checking job status:', error);
          setJobStatus('error');
          clearInterval(interval);
          setErrorMessage('Error checking job status.');
          setDetailedError(error.message);
        }
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [jobId, jobStatus]);

  // Handle download
  const handleDownload = () => {
    if (!jobId) return;
    
    const downloadUrl = getDownloadUrl(jobId);
    window.open(downloadUrl, '_blank');
  };

  // Reset the form
  const handleReset = () => {
    setFiles([]);
    setSubject('');
    setAudience('');
    setJobId(null);
    setJobStatus(null);
    setProgress(0);
    setErrorMessage('');
    setDetailedError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="max-w-4xl mx-auto py-16 px-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-poppins-bold text-yellow-400 mb-4">Image Description Generator</h1>
          <p className="text-xl text-gray-300 font-poppins-thin">Create accessible descriptions for visually impaired students</p>
        </div>

        {errorMessage && (
          <div className="mb-8 p-6 bg-red-900/30 border border-red-500/50 rounded-xl backdrop-blur-sm">
            <div className="flex items-start">
              <FaExclamationCircle className="text-red-400 text-xl mt-1 mr-3 flex-shrink-0" />
              <div>
                <p className="text-red-200 font-poppins-normal">{errorMessage}</p>
                {detailedError && (
                  <p className="text-red-300 font-poppins-thin text-sm mt-2">{detailedError}</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-8 border border-gray-700 shadow-xl mb-12">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-2xl text-yellow-400 font-poppins-bold mb-3">Subject</label>
              <input 
                type="text" 
                placeholder="E.g., Mathematics, Biology, Literature" 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)}
                disabled={isLoading || jobStatus === 'processing' || jobStatus === 'completed'}
                className="w-full px-6 py-3 bg-gray-900/80 border border-gray-600 rounded-xl text-gray-200 placeholder-gray-500 font-poppins-normal text-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-2xl text-yellow-400 font-poppins-bold mb-3">Target Audience</label>
              <select 
                value={audience} 
                onChange={(e) => setAudience(e.target.value)}
                disabled={isLoading || jobStatus === 'processing' || jobStatus === 'completed'}
                className="w-full px-6 py-3 bg-gray-900/80 border border-gray-600 rounded-xl text-gray-200 font-poppins-normal text-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              >
                <option value="" className="bg-gray-900">Select audience</option>
                <option value="Elementary school students" className="bg-gray-900">Elementary school students</option>
                <option value="Middle school students" className="bg-gray-900">Middle school students</option>
                <option value="High school students" className="bg-gray-900">High school students</option>
                <option value="College students" className="bg-gray-900">College students</option>
                <option value="Graduate students" className="bg-gray-900">Graduate students</option>
              </select>
            </div>

            <div>
              <label className="block text-2xl text-yellow-400 font-poppins-bold mb-3">
                Upload Images 
                <span className="ml-3 text-base bg-blue-900/30 text-blue-200 px-4 py-1 rounded-full border border-blue-500/30">
                  {files.length > 0 ? `${files.length} files selected` : 'No files selected'}
                </span>
              </label>
              <input
                type="file"
                accept=".zip,.png,.jpg,.jpeg,.gif,.bmp"
                onChange={handleFileChange}
                multiple
                disabled={isLoading || jobStatus === 'processing' || jobStatus === 'completed'}
                className="w-full px-6 py-3 bg-gray-900/80 border border-gray-600 rounded-xl text-gray-200 font-poppins-normal text-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-poppins-normal file:bg-blue-900/30 file:text-blue-200 hover:file:bg-blue-900/40 focus:outline-none"
              />
              <p className="mt-2 text-gray-400 font-poppins-thin text-base">
                Upload individual images or a .zip file containing multiple images
              </p>
            </div>

            {(isLoading || jobStatus === 'processing' || jobStatus === 'completed') && (
              <div className="mt-8">
                <p className="text-lg font-poppins-normal text-gray-200 mb-3">
                  {jobStatus === 'completed' ? 'Processing complete!' : 'Processing images...'}
                </p>
                <div className="w-full bg-gray-900/80 rounded-full h-3 border border-gray-700">
                  <div 
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      jobStatus === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4 pt-6">
              <button 
                type="button"
                onClick={handleReset}
                disabled={isLoading || jobStatus === 'processing'}
                className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all font-poppins-normal text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
              >
                Reset
              </button>
              
              {jobStatus === 'completed' ? (
                <button 
                  type="button"
                  onClick={handleDownload}
                  className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all font-poppins-normal text-lg flex items-center space-x-3 hover:shadow-lg hover:shadow-green-500/10"
                >
                  <FaFileDownload className="text-xl" />
                  <span>Download Excel</span>
                </button>
              ) : (
                <button 
                  type="submit" 
                  disabled={files.length === 0 || !subject || !audience || isLoading || jobStatus === 'processing'}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-poppins-normal text-lg flex items-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-blue-500/10"
                >
                  {isLoading || jobStatus === 'processing' ? (
                    <>
                      <FaSpinner className="animate-spin text-xl" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <FaFileUpload className="text-xl" />
                      <span>Generate Descriptions</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="bg-blue-900/20 backdrop-blur-sm rounded-xl p-8 border border-blue-800/30 shadow-xl">
          <h3 className="text-2xl font-poppins-bold text-yellow-400 mb-4">How It Works</h3>
          <p className="text-gray-300 font-poppins-thin text-lg leading-relaxed">
            This tool uses AI to generate detailed descriptions of images for visually impaired students.
            Simply upload your images, specify the subject and target audience, and we'll create accessible
            descriptions that can be downloaded as an Excel file.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImageDescriptionGenerator;