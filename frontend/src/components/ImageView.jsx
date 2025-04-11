// Create this file at src/components/ImageView.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Loader from './Loader'; 

const baseURI = import.meta.env.VITE_BACKEND_URL;

const ImageView = () => {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchImageDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${baseURI}/image/${id}`);
        
        if (response.data.success) {
          setImage(response.data.data);
        } else {
          setError("Failed to fetch image details");
        }
      } catch (err) {
        console.error("Error fetching image details:", err);
        setError("An error occurred while fetching image details");
      } finally {
        setLoading(false);
      }
    };
    
    fetchImageDetails();
  }, [id]);
  
  const handleBackClick = () => {
    navigate(-1); // Go back to previous page
  };
  
  if (loading) return <Loader />;
  
  if (error) return <div className="error-message">{error}</div>;
  
  if (!image) return <div className="not-found">Image not found</div>;
  
  return (
    <div className="image-view-container">
      <button className="back-button" onClick={handleBackClick}>
        &larr; Back
      </button>
      
      <div className="image-section">
        <img src={image.image_url} alt={image.image_name} />
        {image.fig_no && <p className="fig-label">Figure {image.fig_no}</p>}
      </div>
      
      <div className="image-info">
        <h1>{image.image_name}</h1>
        <div className="meta-info">
          <p><strong>Subject:</strong> {image.subject}</p>
          <p><strong>Grade:</strong> {image.standard}</p>
          <p><strong>Chapter:</strong> {image.chapter.number} - {image.chapter.name}</p>
          <p><strong>Book:</strong> {image.book}</p>
        </div>
        
        <div className="description-section">
          <h2>Description</h2>
          <p>{image.description}</p>
        </div>
        
        {image.keywords && image.keywords.length > 0 && (
          <div className="keywords-section">
            <h3>Keywords</h3>
            <div className="keywords">
              {image.keywords.map((keyword, index) => (
                <span key={index} className="keyword-tag">{keyword}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageView;