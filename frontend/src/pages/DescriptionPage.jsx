import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Chatbot from "../components/Chatbot";  

import { Download } from 'lucide-react';


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
  const [userReview, setUserReview] = useState("");
  const [reviewStatus, setReviewStatus] = useState({ type: '', message: '' });

  // Add new state for download status
  const [downloadStatus, setDownloadStatus] = useState({ loading: false, error: null });
  const [actionStatus, setActionStatus] = useState('');
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => { if (title) document.title = `${title} | Describe-it`; }, [title]);
  // Stop any reading when leaving the page
  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const plainDescription = () => {
    const el = document.createElement('div');
    el.innerHTML = description;
    return el.textContent || '';
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(plainDescription());
      setActionStatus('Description copied.');
    } catch {
      setActionStatus('Copying is not allowed here. Select the text and copy it instead.');
    }
  };

  const handleReadAloud = () => {
    const synth = window.speechSynthesis;
    if (speaking) { synth.cancel(); setSpeaking(false); return; }
    const utterance = new SpeechSynthesisUtterance(plainDescription());
    utterance.lang = 'en-IN';
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    synth.cancel();
    synth.speak(utterance);
    setSpeaking(true);
  };

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
      <div className="page prose-measure">
        <h1 className="text-h1 mb-4">Diagram not found</h1>
        <p className="mb-6">Open a diagram from a collection or from search results.</p>
        <button type="button" onClick={() => navigate('/')} className="btn-primary">Go to search</button>
      </div>
    );
  }

  if (loading) {
    return <p role="status" className="page">Loading the diagram…</p>;
  }

  if (error) {
    return (
      <div className="page">
        <p role="alert" className="text-error font-bold mb-4">{error}</p>
        <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Go back</button>
      </div>
    );
  }

  const collectionTitle = {
    'ncert-old': 'NCERT diagrams (old edition)',
    'ncert-science': 'NCERT Science 6–10 (new edition)',
  }[imageDataFromSearch.dataset];
  const chapterName = imageDataFromSearch.chapter?.name?.replace(/\s+/g, ' ').trim();

  return (
    <div className="page">
      <nav aria-label="Breadcrumb" className="mb-4 text-small">
        <ol className="flex flex-wrap gap-2 list-none p-0 m-0">
          <li><Link to="/collections">Collections</Link><span aria-hidden="true" className="ml-2 text-muted">/</span></li>
          {collectionTitle && (
            <li><Link to={`/collections/${imageDataFromSearch.dataset}`}>{collectionTitle}</Link><span aria-hidden="true" className="ml-2 text-muted">/</span></li>
          )}
          <li aria-current="page" className="text-muted">{title}</li>
        </ol>
      </nav>

      <h1 className="text-h1 mb-3">{title}</h1>
      <ul className="flex flex-wrap gap-2 list-none p-0 m-0 mb-8" aria-label="Details">
        {imageDataFromSearch.subject && <li className="chip">{imageDataFromSearch.subject}</li>}
        {grade && <li className="chip">Class {grade}</li>}
        {chapterName && <li className="chip">Chapter: {chapterName}</li>}
      </ul>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] items-start">
        <div className="space-y-6">
          <figure className="card p-4 m-0 bg-white">
            {imgUrl ? (
              <img
                src={imgUrl}
                alt={title || 'Diagram'}
                aria-describedby={description ? 'image-description' : undefined}
                className="w-full max-h-[32rem] object-contain"
              />
            ) : (
              <p className="p-8 text-center text-muted">Image not available</p>
            )}
          </figure>

          {/* Image, description and tactile version always stay together on this page */}
          <section aria-labelledby="tactile-heading" className="card p-5">
            <h2 id="tactile-heading" className="text-h3 mb-2">Tactile version</h2>
            {imageDataFromSearch.pdf_url ? (
              <>
                <p className="text-small text-muted mb-4">PDF ready to print on swell paper or emboss.</p>
                <button type="button" className="btn-primary" onClick={handleDownload} aria-disabled={downloadStatus.loading}>
                  <Download className="w-5 h-5" aria-hidden="true" />
                  {downloadStatus.loading ? 'Preparing download…' : 'Download tactile file (PDF)'}
                </button>
              </>
            ) : (
              <p className="text-muted">No tactile version is available for this diagram yet.</p>
            )}
            <div role="alert">
              {downloadStatus.error && <p className="mt-3 text-error font-bold">{downloadStatus.error}</p>}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section aria-labelledby="description-heading" className="card p-6">
            <h2 id="description-heading" className="text-h2 mb-4">Description</h2>
            <div id="image-description" className="prose-measure text-body-lg">
              {description
                ? <HTMLparser htmlString={description} />
                : <p className="italic text-muted">Description not written yet.</p>}
            </div>
            {description && (
              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" className="btn-secondary" onClick={handleCopy}>Copy</button>
                {'speechSynthesis' in window && (
                  <button type="button" className="btn-secondary" onClick={handleReadAloud}>
                    {speaking ? 'Stop reading' : 'Read aloud'}
                  </button>
                )}
              </div>
            )}
            <p aria-live="polite" className="mt-3 text-small text-success font-bold min-h-[1.5em]">{actionStatus}</p>
          </section>

          <section aria-labelledby="feedback-heading" className="card p-6">
            <h2 id="feedback-heading" className="text-h3 mb-2">Feedback on this description</h2>
            <p className="text-small text-muted mb-4">Is something missing, unclear or wrong? Tell us and we will improve it.</p>

            {reviews.length > 0 && (
              <details className="mb-4">
                <summary className="cursor-pointer font-bold text-accent">Read feedback from others ({reviews.length})</summary>
                <ul className="mt-3 space-y-3 list-none p-0">
                  {reviews.map((review, idx) => (
                    <li key={idx} className="p-3 rounded-control bg-accent-tint">{review}</li>
                  ))}
                </ul>
              </details>
            )}

            <form onSubmit={handleUserReview} noValidate>
              <label htmlFor="feedback-text" className="field-label">Your feedback</label>
              <textarea
                id="feedback-text"
                value={userReview}
                onChange={(e) => setUserReview(e.target.value)}
                rows={4}
                className="field py-3 min-h-[7rem]"
                aria-describedby={reviewStatus.message ? 'feedback-status' : undefined}
              />
              <div role="alert">
                {reviewStatus.message && (
                  <p id="feedback-status" className={`mt-2 font-bold ${reviewStatus.type === 'error' ? 'text-error' : 'text-success'}`}>
                    {reviewStatus.message}
                  </p>
                )}
              </div>
              <button type="submit" className="btn-primary mt-4" aria-disabled={reviewStatus.type === 'loading'}>
                {reviewStatus.type === 'loading' ? 'Sending…' : 'Send feedback'}
              </button>
            </form>
          </section>
        </div>
      </div>

      <Chatbot figNo={figNo} description={description} imageData={imageDataFromSearch} />
    </div>
  );
};

export default DescriptionPage;
