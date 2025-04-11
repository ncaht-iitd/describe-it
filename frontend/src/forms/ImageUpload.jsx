import React, { useState } from 'react';
import { Upload, Button, Spin, Alert, Card, Typography, Input, Modal, message } from 'antd';
import { FileImageOutlined, UploadOutlined } from '@ant-design/icons';
import { getUserImageDescription } from '../api/config';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, submitTactileRequest } from '../services/appwriteService';
import { ID, Permission, Role } from 'appwrite';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

const ImageDescriptionComponent = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [description, setDescription] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [processed, setProcessed] = useState(false);
  const [showTactileModal, setShowTactileModal] = useState(false);

  const handleFileChange = (info) => {
    const file = info.file.originFileObj || info.file;
    if (file) {
      setFile(file);
      
      // Create a preview URL for the image
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Reset states
      setDescription('');
      setError('');
      setProcessed(false);
    }
  };

  const handleGenerateDescription = async () => {
    if (!file) {
      setError('Please select an image first');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Create form data
      const formData = new FormData();
      formData.append('image', file);
      
      // Add additional info if provided
      if (additionalInfo.trim()) {
        formData.append('additionalInfo', additionalInfo);
      }
      
      // Use the new API function
      const response = await getUserImageDescription(formData);

      if (response.description) {
        setDescription(response.description);
        setProcessed(true);
        // Show tactile image request modal after successful description generation
        setShowTactileModal(true);
      } else {
        throw new Error('No description received from server');
      }
      
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.message || 'Failed to generate image description');
    } finally {
      setLoading(false);
    }
  };

  const handleTactileRequest = async () => {
    try {
      setLoading(true);
      
      // Check if user is logged in
      let user;
      try {
        user = await getCurrentUser();
      } catch (error) {
        // User is not logged in
        // Store the file preview URL instead of the file itself for localStorage
        const reader = new FileReader();
        
        reader.onload = (event) => {
          const tempRequest = {
            imageDataUrl: event.target.result, // Store as data URL
            description: description,
            additionalInfo: additionalInfo,
            timestamp: new Date().toISOString()
          };
          localStorage.setItem('pendingTactileRequest', JSON.stringify(tempRequest));
          setShowTactileModal(false);
          message.info('Please log in to submit your request');
          navigate('/login');
        };
        
        reader.onerror = () => {
          console.error('Error reading file');
          message.error('Error processing image. Please try again.');
          setLoading(false);
        };
        
        // Read the file as Data URL
        reader.readAsDataURL(file);
        return;
      }

      // User is logged in, proceed with request
      await submitTactileRequest(file, description, additionalInfo);
      message.success('Tactile request submitted successfully!');
      setShowTactileModal(false);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error submitting tactile request:', error);
      message.error(error.message || 'Failed to submit tactile request');
    } finally {
      setLoading(false);
    }
  };

  const uploadProps = {
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        setError('You can only upload image files!');
      } else {
        const isLt5M = file.size / 1024 / 1024 < 5;
        if (!isLt5M) {
          setError('Image must be smaller than 5MB!');
        } else {
          setError('');
        }
      }
      return false; // Prevent automatic upload
    },
    onChange: handleFileChange,
    accept: 'image/*',
    showUploadList: false,
  };

  return (
    <div className="image-description-container">
      <Card style={{ width: '100%', maxWidth: 600, margin: '0 auto' }}>
      <Title level={3} className="image-upload-title">
        Image Description Generator
      </Title>
      <Paragraph className="image-upload-para">
        Upload an image to get an AI-generated description.
      </Paragraph>

        <div style={{ marginBottom: 16 }}>
          <Upload {...uploadProps}>
            <Button icon={<FileImageOutlined />}>Select Image</Button>
          </Upload>
        </div>

        {previewUrl && (
          <div style={{ marginBottom: 16 }}>
            <img 
              src={previewUrl} 
              alt="Preview" 
              style={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain' }}
            />
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <TextArea
            placeholder="Optional: Add any additional information about this image"
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            rows={3}
          />
        </div>

        {error && <Alert message={error} type="error" style={{ marginBottom: 16 }} />}

        <Button 
          type="primary" 
          onClick={handleGenerateDescription} 
          loading={loading} 
          disabled={!file}
          style={{ marginBottom: 16 }}
        >
          Generate Description
        </Button>

        {loading && (
          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <Spin />
            <div style={{ marginTop: 8 }}>Analyzing image and generating description...</div>
          </div>
        )}

        {description && (
          <div className="description-result">
            <Title level={4}>Image Description:</Title>
            <Card type="inner">
              <Paragraph>{description}</Paragraph>
            </Card>
          </div>
        )}

        {processed && !loading && (
          <Alert 
            message="Description generated successfully" 
            type="success" 
            showIcon 
            style={{ marginTop: 16 }}
          />
        )}
        
        {/* Tactile Image Request Modal */}
        <Modal
          title="Request Tactile Image"
          open={showTactileModal}
          onCancel={() => setShowTactileModal(false)}
          footer={[
            <Button key="later" onClick={() => setShowTactileModal(false)}>
              Maybe Later
            </Button>,
            <Button key="request" type="primary" onClick={handleTactileRequest}>
              Yes, Request Tactile Image
            </Button>,
          ]}
        >
          <p>Would you like to request a tactile version of this image?</p>
          <p>This will require creating an account or logging in to track your request.</p>
        </Modal>
      </Card>
    </div>
  );
};

export default ImageDescriptionComponent;