// Create this file at src/components/SearchResults.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Modal } from 'antd';
import Loader from '../components/Loader';
import AccessibilityMenu from '../components/AccessibilityMenu';
import LoadingSpinner from '../components/LoadingSpinner';

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { searchResults, searchMode, searchParams } = location.state || {};
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState({});

  useEffect(() => {
    // Simulate loading time for better UX
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (!searchResults) {
    return (
      <div className="error-container">
        <h2>No Results Found</h2>
        <p>Please try another search.</p>
        <button onClick={() => navigate('/')} className="back-button">
          Back to Search
        </button>
      </div>
    );
  }

  const handleImageClick = (image) => {
    // Extract the standard number from the class string
    const standardMatch = image.standard.match(/Class[- ](\d+)/i);
    const grade = standardMatch ? standardMatch[1] : image.standard;

    // Check for either fig_no or image_name
    const identifier = image.fig_no || image.image_name;
    if (!identifier) {
      console.error('No figure number or image name found in image data:', image);
      return;
    }

    // Debug log the data being passed
    console.log('Navigating to description with data:', {
      image,
      processedGrade: grade,
      identifier,
      urlParams: {
        grade: encodeURIComponent(grade),
        subject: encodeURIComponent(image.subject),
        chapter: encodeURIComponent(image.chapter.name),
        figNo: encodeURIComponent(image.fig_no || ''),
        imageName: encodeURIComponent(image.image_name || '')
      }
    });

    navigate(`/description`, {
      state: { 
        imageData: {
          ...image,
          fig_no: image.fig_no ? image.fig_no.trim() : '', // Ensure fig_no is trimmed if present
          image_name: image.image_name ? image.image_name.trim() : '' // Ensure image_name is trimmed if present
        }
      },
      search: `?grade=${encodeURIComponent(grade)}&subject=${encodeURIComponent(image.subject)}&chapter=${encodeURIComponent(image.chapter.name)}&figNo=${encodeURIComponent(image.fig_no || '')}&imageName=${encodeURIComponent(image.image_name || '')}`
    });
  };

  const handleReadMore = (image) => {
    setSelectedImage(image);
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedImage(null);
  };

  const toggleDescription = (imageId) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [imageId]: !prev[imageId]
    }));
  };

  // Function to truncate text with proper ellipsis
  const truncateText = (text, maxLength) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substr(0, text.lastIndexOf(' ', maxLength)) + '...';
  };

  return (
    <>
      {isLoading && <LoadingSpinner />}
      <div className={`search-results-container min-h-screen dark:bg-gray-900 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
        <AccessibilityMenu />
        
        <div className="search-info p-6 max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-yellow-400">Search Results ({searchResults.length})</h2>
          
          {/* Search Parameters Card */}
          <div className="search-params bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mb-6 border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Search Mode Info */}
              <div className="col-span-full mb-4">
                <span className="text-lg font-bold text-gray-900 dark:text-yellow-400">
                  Search Mode: {searchMode === 'keyword' ? 'Keyword Search' : 'Figure Search'}
                </span>
              </div>

              {/* Search Parameters */}
              {searchMode === 'keyword' ? (
                <>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <span className="block text-sm uppercase tracking-wide font-bold text-gray-500 dark:text-yellow-400 mb-2">Keyword</span>
                    <span className="text-xl font-bold text-gray-900 dark:text-yellow-200">{searchParams.keyword}</span>
                  </div>
                  {searchParams.subject && (
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <span className="block text-sm uppercase tracking-wide font-bold text-gray-500 dark:text-yellow-400 mb-2">Subject</span>
                      <span className="text-xl font-bold text-gray-900 dark:text-yellow-200">{searchParams.subject}</span>
                    </div>
                  )}
                  {searchParams.standard && (
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <span className="block text-sm uppercase tracking-wide font-bold text-gray-500 dark:text-yellow-400 mb-2">Standard</span>
                      <span className="text-xl font-bold text-gray-900 dark:text-yellow-200">{searchParams.standard}</span>
                    </div>
                  )}
                  {searchParams.chapter && (
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <span className="block text-sm uppercase tracking-wide font-bold text-gray-500 dark:text-yellow-400 mb-2">Chapter</span>
                      <span className="text-xl font-bold text-gray-900 dark:text-yellow-200">{searchParams.chapter}</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <span className="block text-sm uppercase tracking-wide font-bold text-gray-500 dark:text-yellow-400 mb-2">Figure</span>
                    <span className="text-xl font-bold text-gray-900 dark:text-yellow-200">{searchParams.figNo}</span>
                  </div>
                  {searchParams.subject && (
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <span className="block text-sm uppercase tracking-wide font-bold text-gray-500 dark:text-yellow-400 mb-2">Subject</span>
                      <span className="text-xl font-bold text-gray-900 dark:text-yellow-200">{searchParams.subject}</span>
                    </div>
                  )}
                  {searchParams.standard && (
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <span className="block text-sm uppercase tracking-wide font-bold text-gray-500 dark:text-yellow-400 mb-2">Standard</span>
                      <span className="text-xl font-bold text-gray-900 dark:text-yellow-200">{searchParams.standard}</span>
                    </div>
                  )}
                  {searchParams.chapter && (
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <span className="block text-sm uppercase tracking-wide font-bold text-gray-500 dark:text-yellow-400 mb-2">Chapter</span>
                      <span className="text-xl font-bold text-gray-900 dark:text-yellow-200">{searchParams.chapter}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mb-8">
            <button 
              onClick={() => navigate('/')} 
              className="back-button bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-6 py-3 rounded-lg transition-colors shadow-md"
            >
              New Search
            </button>
          </div>

          {/* Results Grid */}
          {searchResults.length === 0 ? (
            <div className="no-results text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
              <p className="text-lg font-medium text-gray-600 dark:text-yellow-200">No images found matching your search criteria.</p>
            </div>
          ) : (
            <div className="results-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {searchResults.map((image) => (
                <div 
                  key={image._id} 
                  className="image-card bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all transform hover:-translate-y-1 cursor-pointer"
                  onClick={() => handleImageClick(image)}
                >
                  <div className="image-container relative aspect-video">
                    <img 
                      src={image.image_url} 
                      alt={image.image_name || 'Figure image'} 
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="image-details p-6">
                    <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-yellow-400">
                      {image.image_name || `Figure ${image.fig_no}`}
                    </h3>
                    <div className="image-meta space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="block text-sm uppercase tracking-wide font-bold text-gray-500 dark:text-yellow-400 mb-1">Subject</span>
                          <span className="text-gray-800 dark:text-yellow-200">{image.subject}</span>
                        </div>
                        <div>
                          <span className="block text-sm uppercase tracking-wide font-bold text-gray-500 dark:text-yellow-400 mb-1">Standard</span>
                          <span className="text-gray-800 dark:text-yellow-200">{image.standard}</span>
                        </div>
                      </div>
                      {image.chapter && (
                        <div>
                          <span className="block text-sm uppercase tracking-wide font-bold text-gray-500 dark:text-yellow-400 mb-1">Chapter</span>
                          <span className="text-gray-800 dark:text-yellow-200">{image.chapter.name}</span>
                        </div>
                      )}
                      {image.fig_no && (
                        <div>
                          <span className="block text-sm uppercase tracking-wide font-bold text-gray-500 dark:text-yellow-400 mb-1">Figure</span>
                          <span className="text-gray-800 dark:text-yellow-200">{image.fig_no}</span>
                        </div>
                      )}
                    </div>
                    {image.description && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className={`text-gray-600 dark:text-yellow-100/90 ${!expandedDescriptions[image._id] ? 'line-clamp-3' : ''}`}>
                          {image.description}
                        </p>
                        {image.description.length > 150 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDescription(image._id);
                            }}
                            className="mt-2 text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300 font-medium"
                          >
                            {expandedDescriptions[image._id] ? 'Read Less' : 'Read More'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Modal for Full Description */}
        <Modal
          title={selectedImage ? `${selectedImage.image_name || `Figure ${selectedImage.fig_no}`} - Full Description` : ''}
          open={isModalVisible}
          onCancel={handleModalClose}
          footer={null}
          width={800}
          className="description-modal"
        >
          {selectedImage && (
            <div className="full-description">
              <div className="image-container mb-4">
                <img 
                  src={selectedImage.image_url} 
                  alt={selectedImage.image_name || 'Figure image'} 
                  className="w-full h-auto rounded-lg"
                />
              </div>
              <div className="description-content">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-yellow-400">
                  {selectedImage.image_name || `Figure ${selectedImage.fig_no}`}
                </h3>
                <div className="image-meta space-y-3 mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-sm uppercase tracking-wide font-bold text-gray-500 dark:text-yellow-400 mb-1">Subject</span>
                      <span className="text-gray-800 dark:text-yellow-200">{selectedImage.subject}</span>
                    </div>
                    <div>
                      <span className="block text-sm uppercase tracking-wide font-bold text-gray-500 dark:text-yellow-400 mb-1">Standard</span>
                      <span className="text-gray-800 dark:text-yellow-200">{selectedImage.standard}</span>
                    </div>
                  </div>
                  {selectedImage.chapter && (
                    <div>
                      <span className="block text-sm uppercase tracking-wide font-bold text-gray-500 dark:text-yellow-400 mb-1">Chapter</span>
                      <span className="text-gray-800 dark:text-yellow-200">{selectedImage.chapter.name}</span>
                    </div>
                  )}
                </div>
                <div className="description-text">
                  <span className="block text-sm uppercase tracking-wide font-bold text-gray-500 dark:text-yellow-400 mb-2">Description</span>
                  <p className="text-gray-800 dark:text-yellow-200 whitespace-pre-wrap">
                    {selectedImage.description}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </>
  );
};

export default SearchResults;