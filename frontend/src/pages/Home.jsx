import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCollections } from '../api/config';
import SearchForm from '../forms/SearchForm';
import CollectionCard from '../components/CollectionCard';

function Home() {
  const [collections, setCollections] = useState([]);
  const [collectionsError, setCollectionsError] = useState(false);

  useEffect(() => {
    getCollections().then(setCollections).catch(() => setCollectionsError(true));
  }, []);

  useEffect(() => { document.title = 'Describe-it: accessible descriptions of educational diagrams'; }, []);

  return (
    <>
      <section aria-labelledby="home-title" className="bg-surface border-b border-theme border-line">
        <div className="max-w-content mx-auto px-4 sm:px-6 py-12 md:py-16 grid gap-10 md:grid-cols-[1fr_1.1fr] items-center">
          <div>
            <h1 id="home-title" className="text-h1 md:text-display mb-4">
              Accessible descriptions of educational diagrams
            </h1>
            <p className="text-body-lg text-muted prose-measure">
              Search thousands of NCERT diagrams, read clear descriptions written for screen reader users, and download tactile versions to print.
            </p>
          </div>
          <SearchForm collections={collections} />
        </div>
      </section>

      <section aria-labelledby="collections-title" className="page">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h2 id="collections-title" className="text-h2 mb-2">Browse the collections</h2>
            <p className="text-muted">Explore every diagram in a collection, one page at a time.</p>
          </div>
          <Link to="/collections" className="font-bold">All collections</Link>
        </div>
        <p role="status" className="text-muted">
          {collectionsError
            ? 'The collections did not load. Reload the page to try again.'
            : collections.length === 0 && 'Loading collections… The server can take up to a minute to wake up.'}
        </p>
        <ul className="grid gap-6 md:grid-cols-3 list-none p-0 m-0">
          {collections.map((c) => <CollectionCard key={c.id} collection={c} />)}
        </ul>
      </section>

      <section aria-labelledby="tools-title" className="page pt-0">
        <h2 id="tools-title" className="text-h2 mb-2">Tools</h2>
        <p className="text-muted mb-6">Make your own material accessible.</p>
        <ul className="grid gap-6 md:grid-cols-3 list-none p-0 m-0">
          {[
            ['/describe-image', 'Describe an image', 'Upload a diagram and get an AI-written description you can review.'],
            ['/image-description-generator', 'Describe many images', 'Upload a batch of images and download the descriptions as a spreadsheet.'],
            ['/file-extractor', 'Extract images from a PDF', 'Pull every diagram out of a textbook PDF in one step.'],
          ].map(([to, title, text]) => (
            <li key={to} className="card relative p-6 hover:border-accent focus-within:border-accent">
              <h3 className="text-h3 mb-2">
                <Link to={to} className="text-ink no-underline hover:underline after:absolute after:inset-0">{title}</Link>
              </h3>
              <p className="text-small text-muted">{text}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

export default Home;
