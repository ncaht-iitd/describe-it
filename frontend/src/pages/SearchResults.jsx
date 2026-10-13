import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AccessibilityMenu from '../components/AccessibilityMenu';

// A readable name for a diagram, e.g. "Figure 3.3" or "Prime Time, diagram 2",
// instead of its file name.
function figureLabel(image) {
  if (image.fig_no?.trim()) return image.fig_no.trim();
  const chapter = image.chapter?.name?.replace(/\s+/g, ' ').trim();
  const number = image.image_name?.match(/(\d+)\.[a-z]+$/i)?.[1];
  if (chapter && number) return `${chapter}, diagram ${number}`;
  return chapter || 'Diagram';
}

function descriptionLink(image) {
  const grade = image.standard?.match(/\d+/)?.[0] || image.standard;
  const params = new URLSearchParams({
    grade,
    subject: image.subject,
    chapter: image.chapter?.name || '',
    figNo: image.fig_no || '',
    imageName: image.image_name || '',
  });
  return `/description?${params}`;
}

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { searchResults, searchMode, searchParams = {} } = location.state || {};
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const headingRef = useRef(null);

  // Move focus to the page heading so screen readers announce the new page and result count
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  if (!searchResults) {
    return (
      <main className="error-container p-6 max-w-3xl mx-auto">
        <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold mb-4">No search to show</h1>
        <p className="mb-4">Start a new search from the home page.</p>
        <button onClick={() => navigate('/')} className="back-button bg-yellow-500 text-black font-bold px-6 py-3 rounded-lg">
          Back to search
        </button>
      </main>
    );
  }

  const toggleDescription = (imageId) => {
    setExpandedDescriptions((prev) => ({ ...prev, [imageId]: !prev[imageId] }));
  };

  const filters = [
    searchMode === 'keyword'
      ? ['Keyword', searchParams.keyword]
      : ['Figure', searchParams.figNo],
    ['Subject', searchParams.subject],
    ['Standard', searchParams.standard],
    ['Chapter', searchParams.chapter],
  ].filter(([, value]) => value);

  const count = searchResults.length;

  return (
    <div className="search-results-container min-h-screen dark:bg-gray-900">
      <AccessibilityMenu />

      <main className="search-info p-6 max-w-7xl mx-auto">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-3xl font-bold mb-6 text-gray-900 dark:text-yellow-400 focus:outline-none"
        >
          {count === 1 ? '1 result' : `${count} results`}
        </h1>

        <section
          aria-label="Search details"
          className="search-params bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mb-6 border border-gray-200 dark:border-gray-700"
        >
          <p className="text-lg font-bold text-gray-900 dark:text-yellow-400 mb-4">
            {searchMode === 'keyword' ? 'Keyword search' : 'Figure search'}
          </p>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filters.map(([label, value]) => (
              <div key={label} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <dt className="block text-sm uppercase tracking-wide font-bold text-gray-500 dark:text-yellow-400 mb-2">{label}</dt>
                <dd className="text-xl font-bold text-gray-900 dark:text-yellow-200">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="flex gap-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="back-button bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-6 py-3 rounded-lg transition-colors shadow-md"
          >
            New search
          </button>
        </div>

        {count === 0 ? (
          <div className="no-results text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <p className="text-lg font-medium text-gray-600 dark:text-yellow-200">
              No diagrams matched. Try a shorter keyword or remove a filter.
            </p>
          </div>
        ) : (
          <ul className="results-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 list-none p-0">
            {searchResults.map((image) => {
              const label = figureLabel(image);
              const expanded = !!expandedDescriptions[image._id];
              const descriptionId = `desc-${image._id}`;
              return (
                <li
                  key={image._id}
                  className="image-card relative bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all focus-within:ring-4 focus-within:ring-yellow-400"
                >
                  <div className="image-container relative aspect-video">
                    {/* The visible title and description below carry the meaning, so the thumbnail is decorative */}
                    <img src={image.image_url} alt="" loading="lazy" className="w-full h-full object-cover" />
                  </div>
                  <div className="image-details p-6">
                    <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-yellow-400">
                      {/* The link covers the whole card for mouse users; keyboard users reach it with Tab */}
                      <Link
                        to={descriptionLink(image)}
                        state={{ imageData: image }}
                        className="after:absolute after:inset-0 hover:underline focus:outline-none"
                      >
                        {label}
                      </Link>
                    </h2>
                    <dl className="image-meta space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <dt className="block text-sm uppercase tracking-wide font-bold text-gray-500 dark:text-yellow-400 mb-1">Subject</dt>
                          <dd className="text-gray-800 dark:text-yellow-200">{image.subject}</dd>
                        </div>
                        <div>
                          <dt className="block text-sm uppercase tracking-wide font-bold text-gray-500 dark:text-yellow-400 mb-1">Standard</dt>
                          <dd className="text-gray-800 dark:text-yellow-200">{image.standard}</dd>
                        </div>
                      </div>
                      {image.chapter?.name && (
                        <div>
                          <dt className="block text-sm uppercase tracking-wide font-bold text-gray-500 dark:text-yellow-400 mb-1">Chapter</dt>
                          <dd className="text-gray-800 dark:text-yellow-200">{image.chapter.name.trim()}</dd>
                        </div>
                      )}
                    </dl>
                    {image.description && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p id={descriptionId} className={`text-gray-600 dark:text-yellow-100/90 ${expanded ? '' : 'line-clamp-3'}`}>
                          {image.description}
                        </p>
                        {image.description.length > 150 && (
                          <button
                            type="button"
                            onClick={() => toggleDescription(image._id)}
                            aria-expanded={expanded}
                            aria-controls={descriptionId}
                            className="relative z-10 mt-2 text-yellow-700 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300 font-medium underline"
                          >
                            {expanded ? 'Show less' : 'Show full description'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
};

export default SearchResults;
