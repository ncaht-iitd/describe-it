import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import ImageCard from '../components/ImageCard';
import { LoadingStatus, EmptyIcon } from '../components/Motion';
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
          : 'The diagrams did not load. Check your connection and try again.');
      });
    return () => { cancelled = true; };
  }, [id, page]);

  const title = info?.title || 'Collection';
  useEffect(() => { document.title = `${title}${page > 1 ? `, page ${page}` : ''} | Describe-it`; }, [title, page]);

  // After a page change, move focus to the heading so screen readers announce where they are
  useEffect(() => { if (result) headingRef.current?.focus(); }, [result]);

  const goTo = (n) => setSearchParams({ page: String(n) });

  return (
    <div className="page">
      <nav aria-label="Breadcrumb" className="mb-4 text-small">
        <ol className="flex flex-wrap gap-2 list-none p-0 m-0">
          <li><Link to="/collections">Collections</Link><span aria-hidden="true" className="ml-2 text-muted">/</span></li>
          <li aria-current="page" className="text-muted">{title}</li>
        </ol>
      </nav>

      <h1 ref={headingRef} tabIndex={-1} className="text-h1 focus:outline-none">{title}</h1>
      {info?.description && <p className="mt-2 text-muted prose-measure">{info.description}</p>}

      {!result && !error && <div className="my-6"><LoadingStatus>Loading diagrams… The server can take up to a minute to wake up.</LoadingStatus></div>}
      <p role="status" className={result ? 'my-6 font-bold' : 'sr-only'}>
        {result && `${result.total.toLocaleString('en-IN')} diagrams${result.pages > 1 ? `, page ${result.page} of ${result.pages}` : ''}`}
      </p>
      {error && <p role="alert" className="text-error font-bold">{error}</p>}

      {result && (result.data.length === 0 ? (
        <div className="flex items-center gap-4 text-muted"><EmptyIcon size={56} /> This collection has no diagrams yet.</div>
      ) : (
        <ul className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 list-none p-0 m-0">
          {result.data.map((image) => <ImageCard key={image._id} image={image} />)}
        </ul>
      ))}

      {result && result.pages > 1 && (
        <nav aria-label="Pages" className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button type="button" onClick={() => goTo(page - 1)} disabled={page <= 1} className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed">
            Previous page
          </button>
          <span className="font-bold">Page {result.page} of {result.pages}</span>
          <button type="button" onClick={() => goTo(page + 1)} disabled={page >= result.pages} className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed">
            Next page
          </button>
        </nav>
      )}
    </div>
  );
};

export default CollectionPage;
