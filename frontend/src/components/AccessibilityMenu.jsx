// AccessibilityMenu.jsx
import React, { useState, useEffect } from 'react';
import AccessibilityIcon from '../assets/images/accessibility-logo.svg';
import { Type, Contrast, Eye, Plus, Minus, AlignJustify, Space } from "lucide-react";

const AccessibilityMenu = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [contrast, setContrast] = useState('normal');
  const [isReadingModeActive, setIsReadingModeActive] = useState(false);
  const [lineSpacing, setLineSpacing] = useState(1.5);
  const [wordSpacing, setWordSpacing] = useState(0.25);

  // Apply accessibility settings
  useEffect(() => {
    // Font size management
    document.documentElement.style.fontSize = `${fontSize}px`;

    // Line and word spacing management
    document.documentElement.style.setProperty('--line-spacing', `${lineSpacing}em`);
    document.documentElement.style.setProperty('--word-spacing', `${wordSpacing}em`);

    // Contrast and reading mode management
    const body = document.body;
    
    // Remove all accessibility classes first
    body.classList.remove('high-contrast', 'reading-mode', 'high-contrast-reading-mode');
    
    // Apply appropriate classes based on current state
    if (contrast === 'high' && isReadingModeActive) {
      body.classList.add('high-contrast-reading-mode');
    } else if (contrast === 'high') {
      body.classList.add('high-contrast');
    } else if (isReadingModeActive) {
      body.classList.add('reading-mode');
    }
  }, [fontSize, contrast, isReadingModeActive, lineSpacing, wordSpacing]);

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

  // Increase line spacing
  const increaseLineSpacing = () => {
    setLineSpacing(prev => Math.min(prev + 0.25, 2.5));
  };

  // Decrease line spacing
  const decreaseLineSpacing = () => {
    setLineSpacing(prev => Math.max(prev - 0.25, 1));
  };

  // Increase word spacing
  const increaseWordSpacing = () => {
    setWordSpacing(prev => Math.min(prev + 0.1, 0.5));
  };

  // Decrease word spacing
  const decreaseWordSpacing = () => {
    setWordSpacing(prev => Math.max(prev - 0.1, 0));
  };

  return (
    <div className="fixed top-4 left-4 z-50">
      {/* Accessibility Menu Trigger */}
      <button
        onClick={toggleMenu}
        className="bg-yellow-500 text-black p-3 rounded-full shadow-lg hover:bg-yellow-600 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
        aria-label="Accessibility Menu"
        aria-expanded={isMenuOpen}
      >
        <img src={AccessibilityIcon} alt="Accessibility Menu Icon" className="w-6 h-6" />
      </button>

      {/* Accessibility Menu */}
      {isMenuOpen && (
        <div
          className="absolute top-12 left-0 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 w-72 border border-gray-200 dark:border-gray-700"
          role="menu"
          aria-labelledby="accessibility-menu"
        >
          <h3 id="accessibility-menu" className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Accessibility Options</h3>

          {/* Font Size Control */}
          <div className="flex items-center justify-between mb-4">
            <label htmlFor="font-size-control" className="flex items-center text-gray-700 dark:text-gray-300">
              <Type className="mr-2" />
              Font Size
            </label>
            <div className="flex items-center">
              <button
                onClick={decreaseFontSize}
                className="bg-gray-200 dark:bg-gray-700 p-1 rounded mr-2 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Decrease font size"
              >
                <Minus size={16} className="text-gray-700 dark:text-gray-300" />
              </button>
              <button
                onClick={increaseFontSize}
                className="bg-gray-200 dark:bg-gray-700 p-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Increase font size"
              >
                <Plus size={16} className="text-gray-700 dark:text-gray-300" />
              </button>
            </div>
          </div>

          {/* Line Spacing Control */}
          <div className="flex items-center justify-between mb-4">
            <label htmlFor="line-spacing-control" className="flex items-center text-gray-700 dark:text-gray-300">
              <AlignJustify className="mr-2" />
              Line Spacing
            </label>
            <div className="flex items-center">
              <button
                onClick={decreaseLineSpacing}
                className="bg-gray-200 dark:bg-gray-700 p-1 rounded mr-2 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Decrease line spacing"
              >
                <Minus size={16} className="text-gray-700 dark:text-gray-300" />
              </button>
              <button
                onClick={increaseLineSpacing}
                className="bg-gray-200 dark:bg-gray-700 p-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Increase line spacing"
              >
                <Plus size={16} className="text-gray-700 dark:text-gray-300" />
              </button>
            </div>
          </div>

          {/* Word Spacing Control */}
          <div className="flex items-center justify-between mb-4">
            <label htmlFor="word-spacing-control" className="flex items-center text-gray-700 dark:text-gray-300">
              <Space className="mr-2" />
              Word Spacing
            </label>
            <div className="flex items-center">
              <button
                onClick={decreaseWordSpacing}
                className="bg-gray-200 dark:bg-gray-700 p-1 rounded mr-2 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Decrease word spacing"
              >
                <Minus size={16} className="text-gray-700 dark:text-gray-300" />
              </button>
              <button
                onClick={increaseWordSpacing}
                className="bg-gray-200 dark:bg-gray-700 p-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Increase word spacing"
              >
                <Plus size={16} className="text-gray-700 dark:text-gray-300" />
              </button>
            </div>
          </div>

          {/* Contrast Control */}
          <div className="flex items-center justify-between mb-4">
            <label htmlFor="contrast-control" className="flex items-center text-gray-700 dark:text-gray-300">
              <Contrast className="mr-2" />
              Contrast
            </label>
            <button
              onClick={toggleContrast}
              className={`px-3 py-1 rounded transition-colors ${
                contrast === 'high' 
                  ? 'bg-yellow-500 text-black hover:bg-yellow-600' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              aria-label="Toggle high contrast mode"
              aria-pressed={contrast === 'high'}
            >
              High Contrast
            </button>
          </div>

          {/* Reading Mode */}
          <div className="flex items-center justify-between">
            <label htmlFor="reading-mode-control" className="flex items-center text-gray-700 dark:text-gray-300">
              <Eye className="mr-2" />
              Reading Mode
            </label>
            <button
              onClick={toggleReadingMode}
              className={`px-3 py-1 rounded transition-colors ${
                isReadingModeActive 
                  ? 'bg-yellow-500 text-black hover:bg-yellow-600' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              aria-label="Toggle reading mode"
              aria-pressed={isReadingModeActive}
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
