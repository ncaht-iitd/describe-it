import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import AccessibilityMenu from '../components/AccessibilityMenu';
import ImageCard from '../components/ImageCard';
import { getCollections, getCollectionImages } from '../api/config';

const PAGE_SIZE = 24;

// One collection as a grid of diagrams, one page at a time.
// The page number lives in the URL (?page=3) so a page can be bookmarked or shared.
const CollectionPage = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(parseInt(searchParams.get('page'), 10) || 1, 1);

  const [info, setInfo] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const headingRef = useRef(null);

  useEffect(() => {
    getCollections()
      .then((list) => setInfo(list.find((c) => c.id === id) || { title: 'Collection' }))
      .catch(() => setInfo({ title: 'Collection' }));
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    setResult(null);
    setError(null);
    getCollectionImages(id, page, PAGE_SIZE)
      .then((data) => { if (!cancelled) setResult(data); })
      .catch((err) => {
        if (cancelled) return;
        setError(err.response?.status === 404
          ? 'This collection does not exist.'
          : 'The images did not load. Check your connection and try again.');
      });
    return () => { cancelled = true; };
  }, [id, page]);

  // After a page change, move focus to the heading so screen readers announce where they are
  useEffect(() => {
    if (result) headingRef.current?.focus();
  }, [result]);

  const goTo = (n) => setSearchParams({ page: String(n) });
  const title = info?.title || 'Collection';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AccessibilityMenu />
      <main className="max-w-7xl mx-auto px-6 pt-20 pb-12">
        <nav aria-label="Breadcrumb" className="mb-4 text-base">
          <Link to="/" className="text-yellow-800 dark:text-yellow-400 underline">Home</Link>
          <span aria-hidden="true" className="mx-2 text-gray-500">/</span>
          <span className="text-gray-700 dark:text-gray-300">{title}</span>
        </nav>

        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-3xl font-bold text-gray-900 dark:text-yellow-400 focus:outline-none"
        >
          {title}
          {result && <span className="ml-3 text-lg font-normal text-gray-600 dark:text-gray-300">{result.total} diagrams</span>}
        </h1>
        {info?.description && <p className="mt-2 mb-6 text-gray-700 dark:text-gray-300 max-w-3xl">{info.description}</p>}

        <div role="status" className="my-4 text-gray-700 dark:text-gray-300">
          {!result && !error && 'Loading diagrams… The server can take up to a minute to wake up.'}
          {result && result.pages > 1 && `Page ${result.page} of ${result.pages}`}
        </div>
        {error && <p role="alert" className="text-red-700 dark:text-red-300">{error}</p>}

        {result && (
          result.data.length === 0 ? (
            <p className="text-gray-700 dark:text-gray-300">This collection has no diagrams yet.</p>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 list-none p-0">
              {result.data.map((image) => <ImageCard key={image._id} image={image} />)}
            </ul>
          )
        )}

        {result && result.pages > 1 && (
          <nav aria-label="Pages" className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => goTo(page - 1)}
              disabled={page <= 1}
              className="px-5 py-2 rounded-lg bg-yellow-500 text-black font-bold disabled:opacity-40"
            >
              Previous page
            </button>
            <span className="text-gray-800 dark:text-gray-200">Page {result.page} of {result.pages}</span>
            <button
              type="button"
              onClick={() => goTo(page + 1)}
              disabled={page >= result.pages}
              className="px-5 py-2 rounded-lg bg-yellow-500 text-black font-bold disabled:opacity-40"
            >
              Next page
            </button>
          </nav>
        )}
      </main>
    </div>
  );
};

export default CollectionPage;
