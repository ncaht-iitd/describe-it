// AccessibilityMenu.jsx
import React, { useState, useEffect } from 'react';
import AccessibilityIcon from '../assets/images/accessibility-logo.svg';
import { Type, Contrast, Eye, Plus, Minus } from "lucide-react";

const AccessibilityMenu = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [contrast, setContrast] = useState('normal');
  const [isReadingModeActive, setIsReadingModeActive] = useState(false);

  // Apply accessibility settings
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;

    // Contrast management
    if (contrast === 'high') {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }

    // Reading mode
    if (isReadingModeActive) {
      document.body.classList.add('reading-mode');
    } else {
      document.body.classList.remove('reading-mode');
    }
  }, [fontSize, contrast, isReadingModeActive]);

  // Toggle menu visibility
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Increase font size
  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 2, 24));
  };

  // Decrease font size
  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 2, 12));
  };

  // Toggle contrast
  const toggleContrast = () => {
    setContrast(prev => (prev === 'normal' ? 'high' : 'normal'));
  };

  // Toggle reading mode
  const toggleReadingMode = () => {
    setIsReadingModeActive(!isReadingModeActive);
  };

  return (
    <div className="fixed top-4 left-4 z-50">
      {/* Accessibility Menu Trigger */}
      <button
        onClick={toggleMenu}
        className="bg-yellow-500 text-black p-3 rounded-full shadow-lg hover:bg-yellow-600 transition-colors"
        aria-label="Accessibility Menu"
      >
        <img src={AccessibilityIcon} alt="Accessibility Menu Icon" className="w-6 h-6" />
      </button>

      {/* Accessibility Menu */}
      {isMenuOpen && (
        <div
          className="absolute top-12 left-0 bg-white shadow-lg rounded-lg p-4 w-64 border"
          role="menu"
          aria-labelledby="accessibility-menu"
        >
          <h3 id="accessibility-menu" className="text-lg font-bold mb-4">Accessibility Options</h3>

          {/* Font Size Control */}
          <div className="flex items-center justify-between mb-4">
            <label htmlFor="font-size-control" className="flex items-center">
              <Type className="mr-2" />
              Font Size
            </label>
            <div className="flex items-center">
              <button
                onClick={decreaseFontSize}
                className="bg-gray-200 p-1 rounded mr-2"
                aria-label="Decrease font size"
              >
                <Minus size={16} />
              </button>
              <button
                onClick={increaseFontSize}
                className="bg-gray-200 p-1 rounded"
                aria-label="Increase font size"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Contrast Control */}
          <div className="flex items-center justify-between mb-4">
            <label htmlFor="contrast-control" className="flex items-center">
              <Contrast className="mr-2" />
              Contrast
            </label>
            <button
              onClick={toggleContrast}
              className={`px-3 py-1 rounded ${
                contrast === 'high' ? 'bg-yellow-500' : 'bg-gray-200'
              }`}
              aria-label="Toggle high contrast mode"
            >
              High Contrast
            </button>
          </div>

          {/* Reading Mode */}
          <div className="flex items-center justify-between">
            <label htmlFor="reading-mode-control" className="flex items-center">
              <Eye className="mr-2" />
              Reading Mode
            </label>
            <button
              onClick={toggleReadingMode}
              className={`px-3 py-1 rounded ${
                isReadingModeActive ? 'bg-yellow-500' : 'bg-gray-200'
              }`}
              aria-label="Toggle reading mode"
            >
              {isReadingModeActive ? 'On' : 'Off'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessibilityMenu;
