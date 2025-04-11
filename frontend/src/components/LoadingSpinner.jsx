import React from 'react';

const LoadingSpinner = () => {
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50"
      role="status"
      aria-live="polite"
      aria-label="Loading content"
    >
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-yellow-500"></div>
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
            <div className="animate-ping rounded-full h-16 w-16 bg-yellow-500 opacity-75"></div>
          </div>
        </div>
        <div className="text-center">
          <p className="text-white text-xl font-medium mb-2 font-poppins-bold">Loading content...</p>
          <p className="text-gray-300 text-sm font-alegreya-normal">Please wait while we fetch the data</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner; 