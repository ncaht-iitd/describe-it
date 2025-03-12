import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Headset } from "lucide-react";
import PropTypes from 'prop-types';

function Navbar({ scrollToAbout }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-black shadow-lg' : 'bg-transparent'}`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo with positioning class */}
          <div className="md:w-auto w-full text-center md:text-left">
            <Link to="/" className="text-white text-2xl font-poppins-thin">VisionText</Link>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6 font-poppins-thin">
            <Link reloadDocument className="text-white hover:text-gray-300">Home</Link>
            <button onClick={scrollToAbout} className="text-white hover:text-gray-300">About</button>
            <Link to="#" className="text-white hover:text-gray-300">Contact Us</Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-white absolute right-4"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-black">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link to="/" className="text-white block px-3 py-2 rounded-md">Home</Link>
            <button onClick={scrollToAbout} className="text-white block px-3 py-2 rounded-md w-full text-left">About</button>
            <Link to="/contact" className="text-white block px-3 py-2 rounded-md">Contact Us</Link>
          </div>
        </div>
      )}
    </nav>
  );
}

Navbar.propTypes = {
  scrollToAbout: PropTypes.func.isRequired, // onClick should be a function
};

export default Navbar;