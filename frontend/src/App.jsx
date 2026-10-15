import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

import SiteLayout from './components/SiteLayout';
import HomePage from './pages/Home';
import DescriptionPage from './pages/DescriptionPage';
import SearchResults from './pages/SearchResults';
import CollectionPage from './pages/CollectionPage';
import { CollectionsIndex, Tools, DescribeImage, About, AccessibilityStatement } from './pages/InfoPages';
import Login from './forms/Login';
import Signup from './forms/Signup';
import Dashboard from './pages/Dashboard';
import FileExtractor from './components/FileExtractor';
import ImageDescriptionTool from './components/ImageDescriptionGenerator';
import { isLoggedIn } from './services/appwriteService';

// Pages that need an account. The public library never waits for the login service.
const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    isLoggedIn().then(setIsAuthenticated).catch(() => setIsAuthenticated(false));
  }, []);

  if (isAuthenticated === null) return <p role="status" className="page">Checking your account…</p>;
  return isAuthenticated ? children : <Navigate to="/login" />;
};

ProtectedRoute.propTypes = { children: PropTypes.node };

// Start each new page at the top
const ScrollToTop = () => {
  const { pathname, search } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname, search]);
  return null;
};

function App() {
  return (
    <SiteLayout>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search-results" element={<SearchResults />} />
        <Route path="/collections" element={<CollectionsIndex />} />
        <Route path="/collections/:id" element={<CollectionPage />} />
        <Route path="/description" element={<DescriptionPage />} />
        <Route path="/tools" element={<Tools />} />
        <Route path="/describe-image" element={<DescribeImage />} />
        <Route path="/file-extractor" element={<FileExtractor />} />
        <Route path="/image-description-generator" element={<ImageDescriptionTool />} />
        <Route path="/about" element={<About />} />
        <Route path="/accessibility" element={<AccessibilityStatement />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route
          path="*"
          element={(
            <div className="page">
              <h1 className="text-h1 mb-4">Page not found</h1>
              <p>Check the address, or <a href="/">go to the home page</a>.</p>
            </div>
          )}
        />
      </Routes>
    </SiteLayout>
  );
}

export default App;
