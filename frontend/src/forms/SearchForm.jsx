import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { searchImagesByKeyword } from '../api/config';

// Keyword search only, for now. Chapter, topic and other filters come after the
// search-design session (tracker T37); the figure-number API is kept on the server.
const SearchForm = ({ collections = [] }) => {
  const [keyword, setKeyword] = useState('');
  const [collection, setCollection] = useState('');
  const [error, setError] = useState(null);
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    setError(null);
    const term = keyword.trim();
    if (!term) {
      setError('Enter a word to search for, for example "magnet" or "triangle".');
      return;
    }
    setSearching(true);
    try {
      const response = await searchImagesByKeyword(term, collection);
      navigate('/search-results', {
        state: {
          searchResults: response.data,
          searchMode: 'keyword',
          searchParams: {
            keyword: term,
            collection: collections.find((c) => c.id === collection)?.title,
          },
        },
      });
    } catch (err) {
      console.error('Search error:', err);
      setError('The search did not complete. Check your connection and try again.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="search-form-container bg-gray-900 rounded-xl shadow-lg p-8 max-w-2xl mx-auto font-alegreya-normal">
      <form onSubmit={handleSearch} className="space-y-6" role="search" aria-label="Search the library">
        <div role="alert">
          {error && (
            <div className="error-message bg-red-900/50 text-red-100 p-4 rounded-lg text-base font-poppins-normal">
              {error}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="keyword" className="block text-white font-poppins-bold mb-2 text-lg">
            Search for a diagram
          </label>
          <input
            type="search"
            id="keyword"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="For example: magnet, triangle, digestive system"
            className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white font-alegreya-normal text-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 placeholder-gray-400"
          />
        </div>

        <div className="form-group">
          <label htmlFor="collection" className="block text-white font-poppins-bold mb-2 text-lg">
            Collection <span className="font-poppins-normal text-gray-300">(optional)</span>
          </label>
          <select
            id="collection"
            value={collection}
            onChange={(e) => setCollection(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white font-alegreya-normal text-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
          >
            <option value="">All collections</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={searching}
          className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:opacity-60 text-black font-poppins-bold text-lg py-4 px-6 rounded-lg transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-900"
        >
          {searching ? 'Searching…' : 'Search'}
        </button>
      </form>
    </div>
  );
};

SearchForm.propTypes = {
  collections: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string, title: PropTypes.string })),
};

export default SearchForm;
