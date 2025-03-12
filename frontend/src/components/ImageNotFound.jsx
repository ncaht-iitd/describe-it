import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { uploadImage } from '../config/config'; // You'll need to implement this function

function ImageNotFound() {
  const [file, setFile] = useState(null);
  const [email, setEmail] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const grade = searchParams.get('grade');
  const subject = searchParams.get('subject');
  const chapter = searchParams.get('chapter');
  const figNo = searchParams.get('figNo');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !email) {
      setUploadStatus('Please select a file and enter your email.');
      return;
    }

    setIsUploading(true);
    try {
      await uploadImage(file, email, { grade, subject, chapter, figNo });
      setUploadStatus('Image uploaded successfully. We will email you when the description is ready.');
    } catch (error) {
      setUploadStatus('Error uploading image. Please try again.');
      console.error(error);
    }
    setIsUploading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-8">Image Not Found</h1>
      <p className="text-xl mb-8">
        We couldn't find the image for {grade} {subject}, Chapter: {chapter}, Figure: {figNo}.
      </p>
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <div className="mb-4">
          <label htmlFor="file" className="block mb-2">Upload Image:</label>
          <input
            type="file"
            id="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="email" className="block mb-2">Your Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={handleEmailChange}
            className="w-full p-2 border rounded text-black"
            placeholder="Enter your email"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isUploading}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          {isUploading ? 'Uploading...' : 'Upload Image'}
        </button>
      </form>
      {uploadStatus && <p className="mt-4 text-center">{uploadStatus}</p>}
    </div>
  );
}

export default ImageNotFound;