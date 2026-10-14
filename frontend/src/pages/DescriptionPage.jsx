import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Chatbot from "../components/Chatbot";  
import AccessibilityMenu from "../components/AccessibilityMenu";
import LoadingSpinner from "../components/LoadingSpinner";

import { Book, Download, FileEdit } from 'lucide-react';

import logo from "../assets/images/NCAHT-Logo.png";

import "../index.css";
import HTMLparser from "../components/HTMLparser";
import { figureLabel } from "../lib/figures";
import { getImageDescription, updateUserReview, getPdfDownloadUrl } from "../api/config";

const DescriptionPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get image data from location state if available (coming from search results)
  const imageDataFromSearch = location.state?.imageData;

  const [loading, setLoading] = useState(!imageDataFromSearch);
  const [error, setError] = useState(null);
  
  // State for image data
  const [imgUrl, setImgUrl] = useState(imageDataFromSearch?.image_url || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState(imageDataFromSearch?.description || "");
  const [reviews, setReviews] = useState(imageDataFromSearch?.reviews || []);
  
  // UI state
  const [showReview, setShowReview] = useState(false);
  const [userReview, setUserReview] = useState("");
  const [showUserReview, setShowUserReview] = useState(false);
  const [reviewStatus, setReviewStatus] = useState({ type: '', message: '' });

  // Add new state for download status
  const [downloadStatus, setDownloadStatus] = useState({ loading: false, error: null });

  // Extract data from imageDataFromSearch or URL params as fallback
  const standardMatch = imageDataFromSearch?.standard?.match(/Class[- ](\d+)/i);
  const grade = standardMatch ? standardMatch[1] : imageDataFromSearch?.standard?.replace(/^Class[- ]/, '');
  const subject = imageDataFromSearch?.subject;
  const chapter = imageDataFromSearch?.chapter;
  const figNo = imageDataFromSearch?.fig_no;
  const image_name = imageDataFromSearch?.image_name;

  // Readable title, e.g. "Prime Time, diagram 2", instead of the file name
  useEffect(() => {
    if (imageDataFromSearch) setTitle(figureLabel(imageDataFromSearch));
  }, [imageDataFromSearch]);

  // Debug log with more details about data extraction
  console.log('Parameters:', {
    fromState: imageDataFromSearch ? {
      grade: imageDataFromSearch.standard,
      subject: imageDataFromSearch.subject,
      chapter: imageDataFromSearch.chapter?.name,
      figNo: imageDataFromSearch.fig_no || 'Not provided',
      image_name: imageDataFromSearch.image_name,
      hasValidIdentifier: !!(imageDataFromSearch.fig_no || imageDataFromSearch.image_name),
      fullImageData: imageDataFromSearch
    } : 'No image data in state',
    processedValues: {
      grade,
      subject,
      chapter,
      figNo,
      image_name,
      hasValidIdentifier: !!(figNo || image_name),
      imageDataKeys: imageDataFromSearch ? Object.keys(imageDataFromSearch) : []
    }
  });

  // Fetch image description if not coming from search results
  useEffect(() => {
    const fetchData = async () => {
      if (!imageDataFromSearch && grade && subject && chapter) {
        try {
          setLoading(true);
          const imgDesc = await getImageDescription(grade, subject, chapter, figNo || image_name);
          
          if (!imgDesc) {
            throw new Error('No image description found');
          }

          // Simulate a minimum loading time for better UX
          await new Promise(resolve => setTimeout(resolve, 1000));

          setImgUrl(imgDesc.image_url);
          setDescription(imgDesc.description);
          setReviews(imgDesc.reviews || []);
          setError(null);
        } catch (error) {
          console.error("Failed to fetch description:", error);
          setError("Failed to load image description");
        } finally {
          setLoading(false);
        }
      } else if (imageDataFromSearch) {
        // Even with imageDataFromSearch, show loading briefly for consistency
        setLoading(true);
        setTimeout(() => setLoading(false), 500);
      }
    };

    fetchData();
  }, [imageDataFromSearch, grade, subject, chapter, figNo, image_name]);

  // Handle user review submission
  const handleUserReview = async (e) => {
    e.preventDefault();
    
    // Validate input
    if (!userReview.trim()) {
      setReviewStatus({ type: 'error', message: 'Please enter a review before submitting.' });
      return;
    }

    // Validate required parameters with more specific messages
    const missingFields = [];
    if (!grade) missingFields.push('Grade');
    if (!subject) missingFields.push('Subject');
    if (!chapter) missingFields.push('Chapter');
    if (!figNo && !image_name) missingFields.push('Image identifier (Figure number or Image name)');

    if (missingFields.length > 0) {
      setReviewStatus({ 
        type: 'error', 
        message: `Missing required information: ${missingFields.join(', ')}`
      });
      console.error('Missing fields for review:', {
        grade,
        subject,
        chapter,
        figNo,
        image_name,
        imageData: imageDataFromSearch
      });
      return;
    }

    try {
      setReviewStatus({ type: 'loading', message: 'Submitting review...' });
      await updateUserReview(userReview, grade, subject, chapter, figNo, imageDataFromSearch);
      setReviews(prev => [...prev, userReview]);
      setUserReview("");
      setShowUserReview(false);
      setReviewStatus({ type: 'success', message: 'Review submitted successfully!' });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setReviewStatus({ type: '', message: '' });
      }, 3000);

    } catch (error) {
      console.error("Failed to add review:", error);
      setReviewStatus({ 
        type: 'error', 
        message: error.response?.data?.error || 'Failed to submit review. Please try again.' 
      });
    }
  };

  // Add download handler function

  const handleDownload = async () => {
    try {
      setDownloadStatus({ loading: true, error: null });
      
      // Format the grade number from standard/grade string
      const gradeMatch = grade?.match(/\d+/);
      const gradeNumber = gradeMatch ? gradeMatch[0] : grade;
      
      // Validate image_name is present
      if (!image_name) {
        throw new Error('Image name is required for downloading PDF');
      }
      
      // Log request data for debugging
      console.log('Download request data:', {
        grade: gradeNumber,
        subject,
        chapter,
        image_name,
        imageDataFromSearch
      });
      
      // IMPORTANT: Check if we're passing in the correct parameters before making the request
      if (!gradeNumber) {
        console.warn('Warning: Grade number is missing or invalid');
      }
      if (!subject) {
        console.warn('Warning: Subject is missing');
      }
      if (!image_name) {
        console.error('Error: image_name is required');
        throw new Error('Image name is required');
      }
      
      // Try to download with available information
      console.log('Sending PDF download request with data:', {
        gradeNumber,
        subject,
        chapter: typeof chapter === 'object' ? chapter.name : chapter,
        image_name
      });
      
      const response = await getPdfDownloadUrl(
        gradeNumber,
        subject,
        chapter,
        undefined, // figNo is not needed
        image_name
      );
  
      if (!response || !response.pdf_url) {
        throw new Error('PDF URL not found for this image');
      }
  
      // Log successful response
      console.log('Download successful, opening PDF:', response.pdf_url);
  
      // Create a temporary link element to trigger the download
      const link = document.createElement('a');
      link.href = response.pdf_url;
      link.target = '_blank';
      link.download = `${title || 'figure'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  
      setDownloadStatus({ loading: false, error: null });
    } catch (error) {
      console.error('Download failed:', error);
      
      // More detailed error handling
      let errorMessage = 'Failed to download PDF. Please try again later.';
      
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'PDF download service is not available. Please contact support.';
        } else {
          errorMessage = error.response.data?.error || error.response.data || error.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error('Error details:', {
        message: errorMessage,
        response: error.response?.data,
        status: error.response?.status
      });
      
      setDownloadStatus({ 
        loading: false, 
        error: errorMessage
      });
  
      // Clear error after 5 seconds (increased from 3 for better visibility)
      setTimeout(() => {
        setDownloadStatus({ loading: false, error: null });
      }, 5000);
    }
  };

  if (!imageDataFromSearch) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-500 mb-4">No image data available. Please select an image from the search results.</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go to Search
        </button>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <>
      {loading && <LoadingSpinner />}
      <div 
        className={`min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900 ${loading ? 'opacity-50 pointer-events-none' : ''}`}
        aria-label="VisionText Description Page"
      >
        <AccessibilityMenu />
        
        <div className="absolute top-4 left-4">
          <a 
            href="/" 
            className="font-poppins-bold text-2xl text-yellow-500 hover:text-yellow-600 transition-colors"
            aria-label="Go to homepage"
          >
            VisionText
          </a>
        </div>

        <div className="absolute top-4 right-4 flex items-center space-x-4">
          <a
            href="https://www.ncaht.in/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src={logo}
              alt="NCAHT Logo"
              className="h-12"
            />
          </a>
        </div>

        <div 
          className="w-full max-w-4xl p-8 bg-white shadow-md rounded-lg flex flex-col md:flex-row gap-8 mt-20"
          role="main"
          aria-label="Figure Description and Details"
        >
          <div className="w-full md:w-1/2 flex flex-col items-center">
            {imgUrl ? (
              <img 
                src={imgUrl} 
                alt={title || "Figure"}
                className="w-full mb-4 rounded-lg shadow-md" 
                style={{ maxHeight: '500px', objectFit: 'contain' }}
                aria-describedby={description ? "image-description" : undefined}
              />
            ) : (
              <p className="w-full mb-4 p-8 text-center bg-gray-100 text-gray-700 rounded-lg">Image not available</p>
            )}

            <div className="flex space-x-4 mt-4">
              <button
                className="p-2 rounded bg-green-500 text-white hover:bg-green-600 transition duration-300"
                aria-label="Read reviews by other students"
                onClick={() => setShowReview(!showReview)}
              >
                <Book className="w-6 h-6" />
              </button>

            </div>

            {/* Image, description and tactile version always stay together on this page */}
            <section aria-labelledby="tactile-heading" className="w-full mt-6 p-4 rounded-lg border border-gray-300 bg-gray-50">
              <h3 id="tactile-heading" className="text-lg font-bold text-gray-900 mb-2">Tactile version</h3>
              {imageDataFromSearch.pdf_url ? (
                <button
                  type="button"
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded font-bold text-white transition duration-300 ${downloadStatus.loading
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-red-700 hover:bg-red-800'}`}
                  onClick={handleDownload}
                  disabled={downloadStatus.loading}
                >
                  <Download className="w-5 h-5" aria-hidden="true" />
                  {downloadStatus.loading ? 'Preparing download…' : 'Download tactile version (PDF)'}
                </button>
              ) : (
                <p className="text-gray-700">No tactile version is available for this diagram yet.</p>
              )}
              <div role="alert">
                {downloadStatus.error && (
                  <p className="mt-2 text-red-700 text-sm">{downloadStatus.error}</p>
                )}
              </div>
            </section>

            {showReview && (
              <div className="p-4 mt-4 bg-white rounded-lg shadow-md w-full">
                <h3 className="text-lg font-bold border-b pb-2 mb-4 text-gray-800">
                  Reviews
                </h3>
                <ul className="max-h-64 overflow-auto space-y-4">
                  {reviews.map((review, idx) => (
                    <li
                      key={idx}
                      className="p-4 bg-gray-100 rounded-lg border border-gray-200 shadow-sm"
                    >
                      {review}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="w-full md:w-1/2 flex flex-col">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">
              {title}
            </h2>
            
            <div id="image-description" className="prose max-w-none mb-6">
              {description
                ? <HTMLparser htmlString={description} />
                : <p className="italic text-gray-700">Description not written yet.</p>}
            </div>

            <div className="flex space-x-4 items-center mt-auto">
              <button
                className="flex items-center p-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition duration-300"
                aria-label="Add Review"
                onClick={() => setShowUserReview(!showUserReview)}
              >
                <FileEdit className="w-6 h-6" />
              </button>

              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-300"
              >
                Go Back
              </button>
            </div>

            {showUserReview && (
              <form
                onSubmit={handleUserReview}
                className="mt-6 flex flex-col space-y-4 bg-white rounded-lg shadow-lg p-4"
              >
                <textarea
                  value={userReview}
                  onChange={(e) => setUserReview(e.target.value)}
                  className="p-3 h-40 resize-none bg-gray-100 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Write your review here..."
                  aria-label="Write your review"
                  disabled={reviewStatus.type === 'loading'}
                />
                {reviewStatus.message && (
                  <div 
                    className={`p-3 rounded ${
                      reviewStatus.type === 'error' ? 'bg-red-100 text-red-700' :
                      reviewStatus.type === 'success' ? 'bg-green-100 text-green-700' :
                      reviewStatus.type === 'loading' ? 'bg-blue-100 text-blue-700' :
                      ''
                    }`}
                    role="alert"
                  >
                    {reviewStatus.message}
                  </div>
                )}
                <button
                  type="submit"
                  className={`py-2 px-4 rounded transition-colors duration-300 ${
                    reviewStatus.type === 'loading'
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                  disabled={reviewStatus.type === 'loading'}
                >
                  {reviewStatus.type === 'loading' ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            )}

            <Chatbot 
              figNo={figNo}
              description={description}
              imageData={imageDataFromSearch}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default DescriptionPage;