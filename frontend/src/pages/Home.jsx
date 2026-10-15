import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCollections } from '../api/config';
import SearchForm from '../forms/SearchForm';
import CollectionCard from '../components/CollectionCard';
import { FeatureList, ToolList } from '../components/FeatureCards';
import { LogoReveal, LoadingStatus, Reveal } from '../components/Motion';

function Home() {
  const [collections, setCollections] = useState([]);
  const [collectionsError, setCollectionsError] = useState(false);

  useEffect(() => {
    getCollections().then(setCollections).catch(() => setCollectionsError(true));
  }, []);

  useEffect(() => { document.title = 'Describe-it: accessible descriptions of educational diagrams'; }, []);

  const total = collections.reduce((n, c) => (c.id === 'tactile' ? n : n + (c.count || 0)), 0);

  return (
    <>
      <section aria-labelledby="home-title" className="bg-surface border-b border-theme border-line overflow-hidden">
        <div className="max-w-content mx-auto px-4 sm:px-6 py-12 md:py-16 grid gap-10 md:grid-cols-[1fr_1.1fr] items-center">
          <div>
            <div className="mb-8"><LogoReveal size={72} /></div>
            <h1 id="home-title" className="text-h1 md:text-display mb-4">
              Accessible descriptions of educational diagrams
            </h1>
            <p className="text-body-lg text-muted prose-measure">
              Search {total ? total.toLocaleString('en-IN') : 'thousands of'} NCERT diagrams, read clear descriptions
              written for screen reader users, and download tactile versions to print.
            </p>
          </div>
          <SearchForm collections={collections} />
        </div>
      </section>

      <Reveal as="section" aria-labelledby="features-title" className="page">
        <h2 id="features-title" className="text-h2 mb-2">What you can do</h2>
        <p className="text-muted mb-6 prose-measure">Everything for one diagram stays together: the image, its description, your questions and its tactile version.</p>
        <FeatureList />
      </Reveal>

      <Reveal as="section" aria-labelledby="collections-title" className="page pt-0">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h2 id="collections-title" className="text-h2 mb-2">Browse the collections</h2>
            <p className="text-muted">Each collection groups diagrams from one source. Open one to see every diagram in it.</p>
          </div>
          <Link to="/collections" className="font-bold">All collections</Link>
        </div>
        {collectionsError && <p role="alert" className="text-error font-bold">The collections did not load. Reload the page to try again.</p>}
        {!collectionsError && collections.length === 0 && (
          <LoadingStatus>Loading collections… The server can take up to a minute to wake up.</LoadingStatus>
        )}
        <ul className="grid gap-6 md:grid-cols-3 list-none p-0 m-0">
          {collections.map((c) => <CollectionCard key={c.id} collection={c} />)}
        </ul>
      </Reveal>

      <Reveal as="section" aria-labelledby="tools-title" className="page pt-0">
        <h2 id="tools-title" className="text-h2 mb-2">Tools for your own material</h2>
        <p className="text-muted mb-6 prose-measure">Describe images that are not in the library yet. AI-written descriptions are drafts: always check them before sharing.</p>
        <ToolList />
      </Reveal>
    </>
  );
}

export default Home;
