import { useId, useState } from 'react';
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
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  const handleSearch = async (e) => {
    e.preventDefault();
    setError(null);
    const term = keyword.trim();
    if (!term) {
      setError('Type a word to search for, for example "magnet" or "triangle".');
      return;
    }
    setSearching(true);
    try {
      const response = await searchImagesByKeyword(term, collection);
      navigate('/search-results', {
        state: {
          searchResults: response.data,
          searchMode: 'keyword',
          searchParams: { keyword: term, collection: collections.find((c) => c.id === collection)?.title },
        },
      });
    } catch (err) {
      console.error('Search error:', err);
      setError('The search did not finish. Check your connection and try again.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <form onSubmit={handleSearch} role="search" aria-label="Library" className="card p-5 sm:p-6" noValidate>
      <label htmlFor={`${id}-q`} className="field-label text-body">Search the library</label>
      <p id={hintId} className="text-small text-muted mb-3">
        Try a topic or object, for example magnet, triangle or digestive system.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          id={`${id}-q`}
          type="search"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          aria-describedby={error ? `${hintId} ${errorId}` : hintId}
          aria-invalid={error ? true : undefined}
          className="field flex-1"
          autoComplete="off"
        />
        <button type="submit" className="btn-primary" aria-disabled={searching}>
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.5" />
            <path d="M15.5 15.5 21 21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          {searching ? 'Searching…' : 'Search'}
        </button>
      </div>

      <div className="mt-4 max-w-sm">
        <label htmlFor={`${id}-c`} className="field-label">Collection <span className="font-normal text-muted">(optional)</span></label>
        <select id={`${id}-c`} value={collection} onChange={(e) => setCollection(e.target.value)} className="field">
          <option value="">All collections</option>
          {collections.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>

      <div role="alert">
        {error && (
          <p id={errorId} className="mt-4 flex items-start gap-2 font-bold text-error">
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10" fill="currentColor" />
              <path d="M12 7v6M12 16.5v.5" stroke="var(--surface)" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            {error}
          </p>
        )}
      </div>
    </form>
  );
};

SearchForm.propTypes = {
  collections: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string, title: PropTypes.string })),
};

export default SearchForm;
