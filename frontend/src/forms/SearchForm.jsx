import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { searchImagesByKeyword, getImageDescription } from "../api/config";

const SearchForm = ({ allData }) => {
  const [searchMode, setSearchMode] = useState('keyword'); // 'keyword' or 'advanced'
  const [subject, setSubject] = useState('');
  const [standard, setStandard] = useState('');
  const [chapter, setChapter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [figNo, setFigNo] = useState('');
  
  const [subjects, setSubjects] = useState([]);
  const [standards, setStandards] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (allData && Object.keys(allData).length > 0) {
      const subjectList = Object.keys(allData).sort();
      setSubjects(subjectList);
    } else {
      setSubjects([]);
    }
  }, [allData]);

  const isLoadingSubjects = !allData;
  const isAdvanced = searchMode === 'advanced';
  
  const navigate = useNavigate();
  
  // Reset dependent fields when subject changes
  useEffect(() => {
    setStandard('');
    setChapter('');
    
    if (subject && allData?.[subject]) {
      try {
        const standardList = Object.keys(allData[subject]).sort((a, b) => {
          const numA = Number(a.replace(/\D/g, ''));
          const numB = Number(b.replace(/\D/g, ''));
          return numA - numB;
        });
        setStandards(standardList);
      } catch (error) {
        console.error("Error processing standards:", error);
        setStandards([]);
      }
    } else {
      setStandards([]);
    }
  }, [subject, allData]);
  
  // Reset dependent fields when standard changes
  useEffect(() => {
    setChapter('');
    
    if (standard && subject && allData?.[subject]?.[standard]) {
      try {
        const standardData = allData[subject][standard];

        // Simplify chapter handling - directly use the array of chapter names
        const chapterList = Array.isArray(standardData) ? standardData : Object.keys(standardData);
        
        // Sort chapters alphabetically
        const sortedChapters = chapterList.sort((a, b) => {
          return a.localeCompare(b);
        });
        
        setChapters(sortedChapters);
      } catch (error) {
        console.error("Error processing chapters:", error);
        setChapters([]);
      }
    } else {
      setChapters([]);
    }
  }, [standard, subject, allData]);
  
  const handleSearch = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      let response;
      if (searchMode === 'keyword') {
        if (!keyword.trim()) {
          setError('Please enter a keyword to search');
          return;
        }
        response = await searchImagesByKeyword(standard, subject, chapter, keyword);
      } else {
        // Advanced search
        if (!standard || !subject || !chapter) {
          setError('Please select standard, subject, and chapter');
          return;
        }
        if (!figNo.trim()) {
          setError('Please enter a figure number');
          return;
        }
        response = await getImageDescription(standard, subject, chapter, figNo);
      }

      if (response && response.success) {
        navigate('/search-results', {
          state: {
            searchResults: response.data,
            searchMode,
            searchParams: searchMode === 'keyword'
              ? { standard, subject, chapter, keyword }
              : { standard, subject, chapter, figNo }
          }
        });
      } else {
        setError('No results found');
      }
    } catch (error) {
      console.error('Search error:', error);
      if (error.response?.status === 404) {
        setError(`No figure "${figNo}" was found in that chapter. Check the figure number, or try Keyword Search.`);
      } else {
        setError('The search did not complete. Check your connection and try again.');
      }
    }
  };
  
  const handleModeChange = (mode) => {
    setSearchMode(mode);
    // Reset form fields when changing modes
    setKeyword('');
    setFigNo('');
    setError(null);
  };

  return (
    <div className="search-form-container bg-gray-900 rounded-xl shadow-lg p-8 max-w-2xl mx-auto font-alegreya-normal">
      <div className="search-mode-toggle flex justify-center gap-4 mb-8">
        <button 
          type="button"
          className={`toggle-btn px-6 py-3 rounded-lg font-poppins-bold transition-all duration-200 ${
            searchMode === 'keyword' 
              ? 'bg-blue-600 text-yellow-400 shadow-lg hover:bg-blue-700' 
              : 'bg-gray-800 text-white hover:bg-gray-700'
          }`}
          onClick={() => handleModeChange('keyword')}
          aria-pressed={searchMode === 'keyword'}
        >
          Keyword Search
        </button>
        <button 
          type="button"
          className={`toggle-btn px-6 py-3 rounded-lg font-poppins-bold transition-all duration-200 ${
            searchMode === 'advanced' 
              ? 'bg-blue-600 text-yellow-400 shadow-lg hover:bg-blue-700' 
              : 'bg-gray-800 text-white hover:bg-gray-700'
          }`}
          onClick={() => handleModeChange('advanced')}
          aria-pressed={searchMode === 'advanced'}
        >
          Advanced Search
        </button>
      </div>

      <form onSubmit={handleSearch} className="space-y-6">
        <div role="alert">
          {error && (
            <div className="error-message bg-red-900/50 text-red-200 p-4 rounded-lg text-sm font-poppins-normal">
              {error}
            </div>
          )}
        </div>

        <p role="status" className="text-gray-300 text-base">
          {isLoadingSubjects
            ? 'Loading subjects… The server can take up to a minute to wake up.'
            : !isAdvanced && 'Subject, standard and chapter are optional. Use them to narrow the search.'}
        </p>
        
        <div className="form-group">
          <label htmlFor="subject" className="block text-white font-poppins-bold mb-2 text-lg">
            Subject:
          </label>
          <select
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-600
                     bg-gray-800 text-white font-alegreya-normal text-lg
                     focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500
                     transition-colors"
            required={isAdvanced}
          >
            <option value="" className="bg-gray-800">Select Subject</option>
            {subjects.map((sub) => (
              <option key={sub} value={sub} className="bg-gray-800 text-white">
                {sub}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="standard" className="block text-white font-poppins-bold mb-2 text-lg">
            Standard:
          </label>
          <select
            id="standard"
            value={standard}
            onChange={(e) => setStandard(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-600
                     bg-gray-800 text-white font-alegreya-normal text-lg
                     focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500
                     transition-colors"
            required={isAdvanced}
          >
            <option value="" className="bg-gray-800">Select Standard</option>
            {standards.map((std) => (
              <option key={std} value={std} className="bg-gray-800 text-white">
                {std}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="chapter" className="block text-white font-poppins-bold mb-2 text-lg">
            Chapter:
          </label>
          <select
            id="chapter"
            value={chapter}
            onChange={(e) => setChapter(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-600
                     bg-gray-800 text-white font-alegreya-normal text-lg
                     focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500
                     transition-colors"
            required={isAdvanced}
          >
            <option value="" className="bg-gray-800">Select Chapter</option>
            {chapters.map((chap) => (
              <option key={chap} value={chap} className="bg-gray-800 text-white">
                {chap}
              </option>
            ))}
          </select>
        </div>

        {searchMode === 'keyword' ? (
          <div className="form-group">
            <label htmlFor="keyword" className="block text-white font-poppins-bold mb-2 text-lg">
              Keyword:
            </label>
            <input
              type="text"
              id="keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Enter keyword to search"
              className="w-full px-4 py-3 rounded-lg border border-gray-600
                       bg-gray-800 text-white font-alegreya-normal text-lg
                       focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500
                       transition-colors placeholder-gray-400"
              required
            />
          </div>
        ) : (
          <div className="form-group">
            <label htmlFor="figNo" className="block text-white font-poppins-bold mb-2 text-lg">
              Figure Number:
            </label>
            <input
              type="text"
              id="figNo"
              value={figNo}
              onChange={(e) => setFigNo(e.target.value)}
              placeholder="Enter figure number"
              className="w-full px-4 py-3 rounded-lg border border-gray-600
                       bg-gray-800 text-white font-alegreya-normal text-lg
                       focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500
                       transition-colors placeholder-gray-400"
              required
            />
          </div>
        )}

        <button 
          type="submit" 
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-poppins-bold text-lg py-4 px-6 rounded-lg
                   transition-colors shadow-md hover:shadow-lg focus:outline-none focus:ring-2 
                   focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-900"
        >
          Search
        </button>
      </form>
    </div>
  );
};

SearchForm.propTypes = {
  allData: PropTypes.object,
};

export default SearchForm;