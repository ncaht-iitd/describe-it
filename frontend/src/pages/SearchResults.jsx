import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AccessibilityMenu from '../components/AccessibilityMenu';
import ImageCard from '../components/ImageCard';

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { searchResults, searchParams = {} } = location.state || {};
  const headingRef = useRef(null);

  // Move focus to the page heading so screen readers announce the new page and result count
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  if (!searchResults) {
    return (
      <main className="error-container p-6 pt-20 max-w-3xl mx-auto">
        <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold mb-4 focus:outline-none">No search to show</h1>
        <p className="mb-4">Start a new search from the home page.</p>
        <button onClick={() => navigate('/')} className="back-button bg-yellow-500 text-black font-bold px-6 py-3 rounded-lg">
          Back to search
        </button>
      </main>
    );
  }

  const count = searchResults.length;
  const filters = [
    ['Keyword', searchParams.keyword],
    ['Collection', searchParams.collection || 'All collections'],
  ].filter(([, value]) => value);

  return (
    <div className="search-results-container min-h-screen bg-gray-50 dark:bg-gray-900">
      <AccessibilityMenu />

      <main className="search-info px-6 pt-20 pb-12 max-w-7xl mx-auto">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-3xl font-bold mb-6 text-gray-900 dark:text-yellow-400 focus:outline-none"
        >
          {count === 1 ? '1 result' : `${count} results`}
          {count === 50 && <span className="ml-3 text-lg font-normal">(showing the first 50)</span>}
        </h1>

        <section aria-label="Search details" className="flex flex-wrap items-end gap-6 mb-8">
          <dl className="flex flex-wrap gap-4">
            {filters.map(([label, value]) => (
              <div key={label} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-3 rounded-lg">
                <dt className="text-sm uppercase tracking-wide font-bold text-gray-600 dark:text-yellow-400">{label}</dt>
                <dd className="text-lg font-bold text-gray-900 dark:text-yellow-200">{value}</dd>
              </div>
            ))}
          </dl>
          <button
            onClick={() => navigate('/')}
            className="back-button bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-6 py-3 rounded-lg transition-colors shadow-md"
          >
            New search
          </button>
        </section>

        {count === 0 ? (
          <div className="no-results text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <p className="text-lg font-medium text-gray-700 dark:text-yellow-200">
              No diagrams matched. Try a shorter or different word, or search all collections.
            </p>
          </div>
        ) : (
          <ul className="results-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 list-none p-0">
            {searchResults.map((image) => <ImageCard key={image._id} image={image} />)}
          </ul>
        )}
      </main>
    </div>
  );
};

export default SearchResults;
