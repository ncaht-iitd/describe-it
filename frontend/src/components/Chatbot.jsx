import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Mic, X, Globe } from 'lucide-react';
import axios from 'axios';

// Language configuration
const LANGUAGES = {
  'en-US': { label: 'English', nativeName: 'English' },
  'hi-IN': { label: 'Hindi', nativeName: 'हिन्दी' }
  // Add more languages as needed, following the format:
  // 'language-code': { label: 'Display Name in English', nativeName: 'Native Name' }
  // Examples:
  // 'es-ES': { label: 'Spanish', nativeName: 'Español' },
  // 'fr-FR': { label: 'French', nativeName: 'Français' },
  // 'de-DE': { label: 'German', nativeName: 'Deutsch' },
};

const Chatbot = ({ figNo, description }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  
  // Use useRef to maintain reference throughout component lifecycle
  const recognitionRef = useRef(null);

  // Initialize or reset speech recognition when language changes
  useEffect(() => {
    setupSpeechRecognition();
    
    // Clean up function
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          // Ignore errors when stopping recognition that wasn't started
        }
      }
    };
  }, [selectedLanguage]); // Re-initialize when language changes

  const setupSpeechRecognition = () => {
    // Check if speech recognition is available
    if ('webkitSpeechRecognition' in window) {
      // Stop existing instance if any
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          // Ignore errors
        }
      }
      
      // Initialize speech recognition with the selected language
      recognitionRef.current = new window.webkitSpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = selectedLanguage;
      
      // Setup event handlers
      recognitionRef.current.onstart = () => {
        setIsListening(true);
        console.log(`Started listening in ${LANGUAGES[selectedLanguage].label}`);
      };
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setUserInput(transcript);
        console.log(`Recognized speech: ${transcript}`);
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
        console.log('Speech recognition ended');
      };
    } else {
      console.warn('Speech recognition is not supported in this browser.');
    }
  };

  const startListening = () => {
    try {
      if (recognitionRef.current) {
        // If already listening, stop it first
        if (isListening) {
          recognitionRef.current.stop();
        } else {
          recognitionRef.current.start();
        }
      } else {
        console.warn("Speech recognition not available");
      }
    } catch (error) {
      console.error("Error with speech recognition:", error);
    }
  };

  const changeLanguage = (langCode) => {
    setSelectedLanguage(langCode);
    setShowLanguageMenu(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || !figNo) return;

    const userMessage = userInput;
    setUserInput('');
    setMessages((prev) => [...prev, { 
      type: 'user', 
      content: userMessage,
      language: selectedLanguage // Store the language used for this message
    }]);
    setIsLoading(true);

    try {
      const response = await axios.post('/askMore', {
        fig_no: figNo,
        user_query: userMessage,
        language: selectedLanguage // Send the language to the backend
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data) {
        const botMessage = response.data.response || 
                           response.data.error || 
                           'I received your message but couldn\'t generate a proper response.';
        
        setMessages((prev) => [...prev, { 
          type: 'bot', 
          content: botMessage,
          language: response.data.language || 'en-US'
        }]);
      } else {
        throw new Error('Empty response received');
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [...prev, { 
        type: 'bot', 
        content: 'Sorry, I encountered an error. Please try again.',
        language: 'en-US'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 shadow-lg transition-colors"
          aria-label="Open chat"
        >
          <MessageCircle className="w-6 h-6" />
          <span>Ask More</span>
        </button>
      ) : (
        <div className="bg-white rounded-lg shadow-xl w-96 h-[500px] flex flex-col">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="font-semibold text-gray-800">
              Ask More Questions {figNo && `(Figure ${figNo})`}
            </h3>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <button
                  onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                  aria-label="Change language"
                >
                  <Globe className="w-5 h-5" />
                </button>
                {showLanguageMenu && (
                  <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10 border">
                    <ul className="py-1">
                      {Object.entries(LANGUAGES).map(([code, { label, nativeName }]) => (
                        <li key={code}>
                          <button
                            onClick={() => changeLanguage(code)}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                              selectedLanguage === code ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                            }`}
                          >
                            {label} ({nativeName})
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.type === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {message.content}
                  {message.language && message.language !== 'en-US' && (
                    <div className="text-xs opacity-75 mt-1">
                      Input language: {LANGUAGES[message.language]?.label || message.language}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">Thinking...</div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-4 border-t">
            <div className="flex space-x-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={figNo 
                  ? `Type your question in ${LANGUAGES[selectedLanguage]?.label || 'selected language'}...` 
                  : "Please select a figure first"
                }
                className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading || !figNo}
              />
              <button
                type="button"
                onClick={startListening}
                className={`p-2 rounded-lg ${isListening ? 'bg-red-500 text-white' : 'bg-gray-200'} hover:bg-gray-300`}
                disabled={isLoading || !figNo}
                aria-label={`Start voice input in ${LANGUAGES[selectedLanguage]?.label || 'selected language'}`}
                title={`Click to speak in ${LANGUAGES[selectedLanguage]?.label || 'selected language'}`}
              >
                <Mic className="w-5 h-5" />
              </button>
              <button
                type="submit"
                className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                disabled={isLoading || !userInput.trim() || !figNo}
                aria-label="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Current language: {LANGUAGES[selectedLanguage]?.label || selectedLanguage} {LANGUAGES[selectedLanguage]?.nativeName ? `(${LANGUAGES[selectedLanguage].nativeName})` : ''}
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Chatbot;