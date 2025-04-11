import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Headset, LogOut, User } from "lucide-react";
import PropTypes from 'prop-types';
import { isLoggedIn, logout } from '../services/appwriteService';

function Navbar({ scrollToAbout, scrollToContact, scrollToWhyVisionText }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const checkUserAuth = async () => {
      try {
        const loggedIn = await isLoggedIn();
        setUserLoggedIn(loggedIn);
      } catch (error) {
        console.error('Error checking login status:', error);
        setUserLoggedIn(false);
      }
    };

    checkUserAuth();
  }, []);

  const handleAboutClick = () => {
    scrollToAbout();
    setIsMobileMenuOpen(false);
  };

  const handleContactClick = () => {
    scrollToContact();
    setIsMobileMenuOpen(false);
  };

  const handleVisionTextClick = (e) => {
    e.preventDefault();
    scrollToWhyVisionText();
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUserLoggedIn(false);
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <nav className={`navbar fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-gray-900/80 backdrop-blur-sm shadow-lg' : 'bg-transparent'}`}>
      <div className="navbar-container">
        <div className="flex justify-between items-center py-4 px-4">
          {/* Logo with positioning class */}
          <div className="logo-container md:w-auto w-full text-center md:text-left">
            <button 
              onClick={handleVisionTextClick}
              className="text-yellow-400 hover:text-yellow-300 text-2xl font-poppins-normal"
            >
              <span className="text-white">Vision</span>Text
            </button>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8 font-poppins-normal">
            <Link 
              to="/"
              className="text-white hover:text-yellow-400 transition-colors"
            >
              Home
            </Link>
            <button 
              onClick={handleAboutClick} 
              className="text-white hover:text-yellow-400 transition-colors"
            >
              About
            </button>
            <button 
              onClick={handleContactClick}
              className="text-white hover:text-yellow-400 transition-colors"
            >
              Contact Us
            </button>

            <div className="border-l border-gray-600 h-6 mx-2"></div>

            {userLoggedIn ? (
              <>
                <Link 
                  to="/dashboard"
                  className="text-white hover:text-yellow-400 transition-colors flex items-center gap-2"
                >
                  <User size={18} /> Dashboard
                </Link>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-600 hover:border-yellow-400 text-white hover:text-yellow-400 rounded-md transition-colors"
                >
                  <LogOut size={18} /> Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login"
                  className="text-white hover:text-yellow-400 transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/signup"
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-md transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-white hover:text-yellow-400 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="bg-gray-900/80 backdrop-blur-sm border-t border-gray-800">
          <div className="px-4 py-2 space-y-2">
            <Link 
              to="/" 
              className="block text-white hover:text-yellow-400 py-2 transition-colors font-poppins-normal"
            >
              Home
            </Link>
            <button 
              onClick={handleAboutClick}
              className="block w-full text-left text-white hover:text-yellow-400 py-2 transition-colors font-poppins-normal"
            >
              About
            </button>
            <button 
              onClick={handleContactClick}
              className="block w-full text-left text-white hover:text-yellow-400 py-2 transition-colors font-poppins-normal"
            >
              Contact Us
            </button>
            
            <div className="border-t border-gray-700 my-2"></div>
            
            {userLoggedIn ? (
              <>
                <Link 
                  to="/dashboard"
                  className="flex items-center gap-2 text-white hover:text-yellow-400 py-2 transition-colors font-poppins-normal"
                >
                  <User size={18} /> Dashboard
                </Link>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full text-left text-white hover:text-yellow-400 py-2 transition-colors font-poppins-normal"
                >
                  <LogOut size={18} /> Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login"
                  className="block text-white hover:text-yellow-400 py-2 transition-colors font-poppins-normal"
                >
                  Login
                </Link>
                <Link 
                  to="/signup"
                  className="block text-white hover:text-yellow-400 py-2 transition-colors font-poppins-normal"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

Navbar.propTypes = {
  scrollToAbout: PropTypes.func.isRequired,
  scrollToContact: PropTypes.func.isRequired,
  scrollToWhyVisionText: PropTypes.func.isRequired,
};

export default Navbar;