import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ImageCard from '../components/ImageCard';

const SearchResults = () => {
  const location = useLocation();
  const { searchResults, searchParams = {} } = location.state || {};
  const headingRef = useRef(null);
  const count = searchResults?.length ?? 0;

  useEffect(() => {
    document.title = searchResults
      ? `${count} results for "${searchParams.keyword}" | Describe-it`
      : 'Search | Describe-it';
    // Move focus to the heading so screen readers announce the new page and result count
    headingRef.current?.focus();
  }, [searchResults, count, searchParams.keyword]);

  if (!searchResults) {
    return (
      <div className="page">
        <h1 ref={headingRef} tabIndex={-1} className="text-h1 mb-4 focus:outline-none">No search to show</h1>
        <p className="mb-6">Start a new search from the home page.</p>
        <Link to="/" className="btn-primary">Go to search</Link>
      </div>
    );
  }

  return (
    <div className="page">
      <h1 ref={headingRef} tabIndex={-1} className="text-h1 focus:outline-none">
        {count === 1 ? '1 result' : `${count} results`} for “{searchParams.keyword}”
      </h1>
      <p className="mt-2 text-muted">
        In {searchParams.collection || 'all collections'}
        {count === 50 && '. Showing the first 50; try a more specific word to narrow it down'}.
      </p>
      <p className="mt-4 mb-8"><Link to="/" className="font-bold">New search</Link></p>

      {count === 0 ? (
        <div className="card p-6 prose-measure">
          <h2 className="text-h3 mb-2">No diagrams matched</h2>
          <p className="text-muted">Try a shorter or different word, or search all collections.</p>
        </div>
      ) : (
        <ul className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 list-none p-0 m-0">
          {searchResults.map((image) => <ImageCard key={image._id} image={image} />)}
        </ul>
      )}
    </div>
  );
};

export default SearchResults;
