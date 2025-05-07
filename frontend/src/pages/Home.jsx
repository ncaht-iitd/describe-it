import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getData } from "../api/config";
import { motion } from "framer-motion";
import { message } from "antd";

import "../index.css";
import Navbar from "../components/Navbar";
import AccessibilityMenu from "../components/AccessibilityMenu";
import AboutUs from "../components/AboutUs";
import ImageUploadComponent from "../forms/ImageUpload";

import libraryBackground from "../assets/images/library-background.png";
import uploadGif from "../assets/images/upload.gif";
import searchDescriptionGif from "../assets/images/search-description.gif";
import brailleGif from "../assets/images/braille.gif";
import SearchForm from "../forms/SearchForm";

function Home() {             
  const [grade, setGrade] = useState("");
  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState("");
  const [figNo, setFigNo] = useState("");

  const [gradeList, setGradeList] = useState([]);
  const [subjectList, setSubjectList] = useState([]);
  const [chapterList, setChapterList] = useState([]);
  const [figNoList, setFigNoList] = useState([]);
  const [allData, setAllData] = useState(null);

  const [showUploadModal, setShowUploadModal] = useState(false);

  const getDataBlob = async () => {
    try {
      const response = await getData();
      if (response && response.success && response.data) {
        setAllData(response.data);
        const subjects = Object.keys(response.data);
        setSubjectList(subjects);
        return response.data;
      }
      return null;
    } catch (error) {
      console.error("Error fetching data:", error);
      return null;
    }
  };

  useEffect(() => {
    getDataBlob();
  }, []);

  useEffect(() => {
    if (allData && subject) {
      const standards = Object.keys(allData[subject] || {});
      setGradeList(standards);
    }
  }, [subject, allData]);

  useEffect(() => {
    if (allData && grade && subject) {
      setChapterList(allData[subject][grade] || []);
    }
  }, [subject, grade, allData]);

  useEffect(() => {
    if (allData && grade && subject && chapter) {
      setFigNoList(allData[grade][subject][chapter]);
    }
  }, [chapter, grade, subject, allData]);

  const aboutRef = useRef(null);
  const whyVisionTextRef = useRef(null);
  const contactRef = useRef(null);

  const navigate = useNavigate();

  const scrollToAbout = () => {
    if (aboutRef.current) {
      aboutRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const scrollToWhyVisionText = () => {
    if (whyVisionTextRef.current) {
      whyVisionTextRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const scrollToContact = () => {
    if (contactRef.current) {
      contactRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Function to handle mouse enter/leave for GIF play/pause
  const [hoveredCard, setHoveredCard] = useState(null);

  const handleTactileRequest = async (imageFile, description) => {
    try {
      // Store the data temporarily
      const tempRequest = {
        imageFile,
        description,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('pendingTactileRequest', JSON.stringify(tempRequest));
      
      // Redirect to login
      navigate('/login');
    } catch (error) {
      console.error('Error handling tactile request:', error);
      message.error('Failed to process your request. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Navbar 
        scrollToAbout={scrollToAbout} 
        scrollToContact={scrollToContact}
        scrollToWhyVisionText={scrollToWhyVisionText}
      />
      <AccessibilityMenu className="accessibility-menu" />
      
      {/* Main content area with library background */}
      <motion.div 
        className="flex flex-col md:flex-row flex-grow main-content"
        style={{
          backgroundImage: `url(${libraryBackground})`,
          backgroundRepeat: 'repeat',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Search functionality section */}
        <div className="w-full bg-black bg-opacity-10 text-white p-4 md:p-40 flex flex-col justify-between">
          <motion.div 
            className="flex flex-col items-center justify-center flex-grow mt-16 md:mt-20 w-full max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <motion.h2 
              className="text-2xl md:text-6xl font-poppins-normal mb-4 md:mb-8 text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              Search for Image <br /> Descriptions with Us
            </motion.h2>
            <motion.div
              className="w-full"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
            >
              <SearchForm allData={allData} />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Document Tools Section */}
      <div className="bg-gradient-to-b from-gray-900 to-gray-800 py-16">
        <div className="container mx-auto px-8">
          <motion.div 
            className="flex flex-col items-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-poppins-bold mb-6 text-yellow-400">Document Tools</h2>
            <p className="text-gray-300 font-poppins-thin text-lg mb-12 text-center max-w-2xl">
              Powerful tools to process your educational materials and generate accessible content
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
              {/* Image Extraction Tool Card */}
              <motion.div
                className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-8 border border-gray-700 shadow-xl"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex flex-col h-full">
                  <h3 className="text-2xl font-poppins-bold mb-4 text-yellow-400">Image Extraction</h3>
                  <p className="text-gray-300 font-poppins-thin mb-6">
                    Extract images from your documents with our powerful tool. Perfect for processing textbooks and educational materials.
                  </p>
                  <motion.button
                    onClick={() => navigate('/file-extractor')}
                    className="mt-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300 font-poppins-normal flex items-center justify-center space-x-2 shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span>Extract Images</span>
                  </motion.button>
                </div>
              </motion.div>

              {/* Image Description Tool Card */}
              <motion.div
                className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-8 border border-gray-700 shadow-xl"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex flex-col h-full">
                  <h3 className="text-2xl font-poppins-bold mb-4 text-yellow-400">Description Generator</h3>
                  <p className="text-gray-300 font-poppins-thin mb-6">
                    Generate detailed, accessible descriptions for your images using AI. Ideal for creating inclusive educational content.
                  </p>
                  <motion.button
                    onClick={() => navigate('/image-description-generator')}
                    className="mt-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300 font-poppins-normal flex items-center justify-center space-x-2 shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 14h16M4 10h16M4 18h7" />
                    </svg>
                    <span>Generate Descriptions</span>
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

    {/* Features Section */}
      <div className="bg-gradient-to-b from-gray-900 to-gray-800 py-32">
        <div className="container mx-auto px-8">
          <motion.h2 
            className="text-5xl font-poppins-bold mb-24 text-center text-yellow-400"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            Our Features
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            {/* Image Upload Feature */}
            <motion.div 
              className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-10 text-center hover:transform hover:scale-105 transition-transform duration-300 shadow-2xl cursor-pointer border border-gray-700"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ 
                scale: 1.03,
                y: -5,
                transition: { duration: 0.2 }
              }}
              onMouseEnter={() => setHoveredCard('upload')}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => setShowUploadModal(true)}
            >
              <div className="relative w-full aspect-video mb-8 rounded-lg overflow-hidden bg-white">
                <img 
                  src={uploadGif}
                  alt="Image Upload Feature" 
                  className={`absolute inset-0 w-full h-full object-contain p-4 transition-opacity duration-300 ${
                    hoveredCard === 'upload' ? 'opacity-100' : 'opacity-0'
                  }`}
                />
                <div className={`absolute inset-0 w-full h-full flex items-center justify-center transition-opacity duration-300 ${
                  hoveredCard === 'upload' ? 'opacity-0' : 'opacity-100'
                }`}>
                  <svg className="w-24 h-24 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"/>
                  </svg>
                </div>
              </div>
              <h3 className="text-3xl font-poppins-bold mb-4 text-yellow-400">Image Upload</h3>
              <p className="text-gray-300 font-poppins-thin text-lg leading-relaxed">
                Upload any image and get real-time descriptions instantly. Perfect for custom images and diagrams.
              </p>
            </motion.div>

            {/* Search Description Feature */}
            <motion.div 
              className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-10 text-center hover:transform hover:scale-105 transition-transform duration-300 shadow-2xl border border-gray-700"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ 
                scale: 1.03,
                y: -5,
                transition: { duration: 0.2 }
              }}
              onMouseEnter={() => setHoveredCard('search')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="relative w-full aspect-video mb-8 rounded-lg overflow-hidden bg-white">
                <img 
                  src={searchDescriptionGif}
                  alt="Search Description Feature" 
                  className={`absolute inset-0 w-full h-full object-contain p-4 transition-opacity duration-300 ${
                    hoveredCard === 'search' ? 'opacity-100' : 'opacity-0'
                  }`}
                />
                <div className={`absolute inset-0 w-full h-full flex items-center justify-center transition-opacity duration-300 ${
                  hoveredCard === 'search' ? 'opacity-0' : 'opacity-100'
                }`}>
                  <svg className="w-24 h-24 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                  </svg>
                </div>
              </div>
              <h3 className="text-3xl font-poppins-bold mb-4 text-yellow-400">Search Descriptions</h3>
              <p className="text-gray-300 font-poppins-thin text-lg leading-relaxed">
                Find detailed descriptions for textbook images by searching through our comprehensive database.
              </p>
            </motion.div>

            {/* Downloadable Tactile Version Feature */}
            <motion.div 
                className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-10 text-center hover:transform hover:scale-105 transition-transform duration-300 shadow-2xl border border-gray-700"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                whileHover={{ 
                  scale: 1.03,
                  y: -5,
                  transition: { duration: 0.2 }
                }}
                onMouseEnter={() => setHoveredCard('braille')}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="relative w-full aspect-video mb-8 rounded-lg overflow-hidden bg-white">
                  <img 
                    src={brailleGif}
                    alt="Downloadable Tactile Version Feature" 
                    className={`absolute inset-0 w-full h-full object-contain p-4 transition-opacity duration-300 ${
                      hoveredCard === 'braille' ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  <div className={`absolute inset-0 w-full h-full flex items-center justify-center transition-opacity duration-300 ${
                    hoveredCard === 'braille' ? 'opacity-0' : 'opacity-100'
                  }`}>
                  <svg className="w-24 h-24 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="6" cy="6" r="2"/>
                    <circle cx="6" cy="12" r="2"/>
                    <circle cx="6" cy="18" r="2"/>
                    <circle cx="12" cy="6" r="2"/>
                    <circle cx="12" cy="12" r="2"/>
                    <circle cx="12" cy="18" r="2"/>
                  </svg>
                  </div>
                </div>
                <h3 className="text-3xl font-poppins-bold mb-4 text-yellow-400">Tactile Version</h3>
                <p className="text-gray-300 font-poppins-thin text-lg leading-relaxed">
                  Get access to downloadable tactile diagrams for selected images in printable formats.
                </p>
            </motion.div>

          </div>
        </div>
      </div>

      {/* About Section */}
      <div ref={aboutRef}>
        <AboutUs whyVisionTextRef={whyVisionTextRef} />
      </div>

      {/* Contact Section */}
      <div ref={contactRef} className="bg-gradient-to-b from-gray-800 to-gray-900 py-32">
        <div className="container mx-auto px-8">
          <motion.h2 
            className="text-5xl font-poppins-bold mb-16 text-center text-yellow-400"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            Contact Us
          </motion.h2>
          <div className="flex flex-col md:flex-row gap-12">
            <motion.div 
              className="md:w-1/2"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-10 shadow-2xl border border-gray-700">
                <div className="space-y-10 font-alegreya-normal">
                  <div>
                    <h3 className="text-2xl font-poppins-bold text-yellow-400 mb-4">Address</h3>
                    <p className="text-gray-300 text-lg leading-relaxed">
                      Room No GA3, Research and Innovation Park, Indian Institute of
                      Technology Delhi (IITD), Hauz Khas, New Delhi- 110016
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-poppins-bold text-yellow-400 mb-4">Contact</h3>
                    <p className="text-gray-300 text-lg leading-relaxed">
                      +91 11 26596080
                      <br />
                      <a
                        href="mailto:ncaht.iitd@gmail.com"
                        className="text-yellow-400 hover:text-yellow-300 transition-colors"
                      >
                        ncaht.iitd@gmail.com
                      </a>
                      ,{" "}
                      <a
                        href="mailto:assistech.iitd@gmail.com"
                        className="text-yellow-400 hover:text-yellow-300 transition-colors"
                      >
                        assistech.iitd@gmail.com
                      </a>
                    </p>
                  </div>

                  <div>
                    <h3 className="text-2xl font-poppins-bold text-yellow-400 mb-4">Opening Hours</h3>
                    <p className="text-gray-300 text-lg leading-relaxed">
                      Mon - Fri
                      <br />
                      10 am – 6:00 pm
                    </p>
                  </div>

                  <div>
                    <a
                      href="https://www.linkedin.com/company/ncaht-iitdelhi/posts/?feedView=all"
                      className="inline-block text-yellow-400 hover:text-yellow-300 transition-colors font-poppins-normal text-lg"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Visit us on LinkedIn →
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="md:w-1/2"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-10 shadow-2xl h-full border border-gray-700">
                <iframe
                  title="NCAHT Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1758.0595160101248!2d77.19154285630076!3d28.545380785862!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d1df5d40b8051%3A0xe7c5426de4885f4e!2sIIT%20Delhi%20Research%20and%20Innovation%20Park!5e0!3m2!1sen!2sin!4v1234567890"
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: "450px" }}
                  allowFullScreen=""
                  loading="lazy"
                  className="rounded-lg"
                ></iframe>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Image Upload Modal */}
      {showUploadModal && (
        <motion.div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div 
            className="bg-gray-900 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-4 flex justify-end">
              <button 
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ImageUploadComponent />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

export default Home;