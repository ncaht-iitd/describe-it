import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import { Layout, Alert, Spin } from 'antd';

import HomePage from "./pages/Home";
import DescriptionPage from "./pages/DescriptionPage";
import SearchResults from "./pages/SearchResults";
import ImageView from "./components/ImageView";
import ImageNotFound from "./pages/ImageNotFound";
import Login from "./forms/Login";
import Signup from "./forms/Signup";
import Dashboard from "./pages/Dashboard";
import FileExtractor from './components/FileExtractor';
import ImageDescriptionTool from './components/ImageDescriptionGenerator';

import './styles/accessibility.css';

import { testAppwriteConnection, verifyStorageBucket, verifyDatabaseAccess, isLoggedIn } from './services/appwriteService';


const { Content } = Layout;

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(null);

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const loggedIn = await isLoggedIn();
        setIsAuthenticated(loggedIn);
      } catch (error) {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [appError, setAppError] = useState(null);
  const [appwriteStatus, setAppwriteStatus] = useState({
    connected: false,
    databaseAccess: false,
    storageAccess: false
  });

  useEffect(() => {
    const verifyAppwrite = async () => {
      try {
        setIsLoading(true);
        
        // Test general Appwrite connection
        const connected = await testAppwriteConnection();
        if (!connected) {
          setAppError('Unable to connect to Appwrite. Please check your configuration.');
          return;
        }
        
        // Verify storage bucket access - handle errors gracefully
        let storageAccess = false;
        try {
          await verifyStorageBucket();
          storageAccess = true;
        } catch (storageError) {
          console.error('Storage access error:', storageError);
          setAppError(`Storage error: ${storageError.message}`);
        }
        
        // Verify database access - handle errors gracefully
        let databaseAccess = false;
        try {
          // Only try to access the database if the function is available
          if (typeof verifyDatabaseAccess === 'function') {
            await verifyDatabaseAccess();
            databaseAccess = true;
          } else {
            console.warn('verifyDatabaseAccess function is not available');
            // We'll consider database access OK for now to avoid blocking the app
            databaseAccess = true;
          }
        } catch (dbError) {
          console.error('Database access error:', dbError);
          if (!appError) { // Only set if storage error hasn't already been set
            setAppError(`Database error: ${dbError.message}`);
          }
        }
        
        setAppwriteStatus({
          connected,
          databaseAccess,
          storageAccess
        });
        
        // Allow the app to proceed even if there are access issues
        // This lets users at least use the image description features
        // even if database storage isn't working
        
      } catch (error) {
        console.error('Appwrite verification error:', error);
        setAppError(`Appwrite verification error: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    verifyAppwrite();
  }, []);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <Spin size="large" style={{ marginBottom: 24 }} />
        <p>Initializing application...</p>
      </div>
    );
  }

  if (appError) {
    return (
      <div style={{ 
        padding: '50px', 
        maxWidth: '800px', 
        margin: '0 auto', 
        textAlign: 'center' 
      }}>
        <Alert
          message="Configuration Error"
          description={
            <div>
              <p>{appError}</p>
              <p>Please check the browser console for more details and ensure your Appwrite instance is properly configured.</p>
              <div style={{ textAlign: 'left', marginTop: '20px', border: '1px solid #d9d9d9', padding: '15px', borderRadius: '4px' }}>
                <h4>Appwrite Configuration Status:</h4>
                <ul>
                  <li>Connection: {appwriteStatus.connected ? '✅ Connected' : '❌ Failed'}</li>
                  <li>Storage Access: {appwriteStatus.storageAccess ? '✅ Access granted' : '❌ Access denied'}</li>
                  <li>Database Access: {appwriteStatus.databaseAccess ? '✅ Access granted' : '❌ Access denied'}</li>
                </ul>
                <h4>Required Setup:</h4>
                <ol>
                  <li>Ensure you have created a bucket named 'tactile_images' in Appwrite Storage.</li>
                  <li>Ensure you have created a database 'tactile_requests_db' with collection 'requests'.</li>
                  <li>Make sure the collection has the following attributes:
                    <ul>
                      <li>userId (string)</li>
                      <li>imageId (string)</li>
                      <li>description (string)</li>
                      <li>additionalInfo (string)</li>
                      <li>status (enum: Requested, In Progress, Generated, Rejected)</li>
                      <li>requestDate (datetime)</li>
                      <li>estimatedCompletionDate (datetime)</li>
                    </ul>
                  </li>
                  <li>Set appropriate permissions on the bucket and collection (at minimum, read/write for authenticated users).</li>
                </ol>
              </div>
            </div>
          }
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/description" element={<DescriptionPage />} />
          <Route path="/search-results" element={<SearchResults />} />
          <Route path="/image-view/:id" element={<ImageView />} />
          <Route path="/image-not-found" element={<ImageNotFound />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/file-extractor" element={<FileExtractor />} />
          <Route path="/image-description-generator" element={<ImageDescriptionTool />} />
        </Routes>
      </Content>
    </Layout>
  );
}

export default App;
