import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { getCollections } from '../api/config';
import CollectionCard from '../components/CollectionCard';
import ImageUploadComponent from '../forms/ImageUpload';

const usePageTitle = (title) => useEffect(() => { document.title = `${title} | Describe-it`; }, [title]);

const PageHeader = ({ title, intro }) => (
  <>
    <h1 className="text-h1 mb-3">{title}</h1>
    {intro && <p className="text-body-lg text-muted prose-measure mb-8">{intro}</p>}
  </>
);
PageHeader.propTypes = { title: PropTypes.string.isRequired, intro: PropTypes.string };

export function CollectionsIndex() {
  usePageTitle('Collections');
  const [collections, setCollections] = useState([]);
  const [error, setError] = useState(false);
  useEffect(() => { getCollections().then(setCollections).catch(() => setError(true)); }, []);
  return (
    <div className="page">
      <PageHeader title="Collections" intro="Each collection groups diagrams from one source. Open one to browse every diagram in it." />
      <p role="status" className="text-muted">
        {error ? 'The collections did not load. Reload the page to try again.'
          : collections.length === 0 && 'Loading collections… The server can take up to a minute to wake up.'}
      </p>
      <ul className="grid gap-6 md:grid-cols-3 list-none p-0 m-0">
        {collections.map((c) => <CollectionCard key={c.id} collection={c} headingLevel="h2" />)}
      </ul>
    </div>
  );
}

const TOOLS = [
  ['/describe-image', 'Describe an image', 'Upload one diagram and get an AI-written description. You can then request a tactile version.'],
  ['/image-description-generator', 'Describe many images', 'Upload a batch of images or a ZIP file and download all descriptions as a spreadsheet.'],
  ['/file-extractor', 'Extract images from a PDF', 'Pull every image out of a textbook PDF so you can describe them.'],
];

export function Tools() {
  usePageTitle('Tools');
  return (
    <div className="page">
      <PageHeader title="Tools" intro="Make your own teaching material accessible. AI-written descriptions are drafts: always check them before sharing." />
      <ul className="grid gap-6 md:grid-cols-3 list-none p-0 m-0">
        {TOOLS.map(([to, title, text]) => (
          <li key={to} className="card relative p-6 hover:border-accent focus-within:border-accent">
            <h2 className="text-h3 mb-2">
              <Link to={to} className="text-ink no-underline hover:underline after:absolute after:inset-0">{title}</Link>
            </h2>
            <p className="text-small text-muted">{text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DescribeImage() {
  usePageTitle('Describe an image');
  return (
    <div className="page">
      <nav aria-label="Breadcrumb" className="mb-4 text-small"><Link to="/tools">Tools</Link></nav>
      <PageHeader title="Describe an image" intro="Upload one image. You will get an AI-written description to review, and you can request a tactile version." />
      <div className="max-w-2xl"><ImageUploadComponent /></div>
    </div>
  );
}

export function About() {
  usePageTitle('About');
  return (
    <div className="page prose-measure">
      <PageHeader title="About Describe-it" />
      <div className="space-y-5 text-body-lg">
        <p>
          Describe-it is an online library of accessible image descriptions and tactile graphics for school textbooks.
          It helps students with visual impairment, special educators and accessible content creators understand
          diagrams that are otherwise only visual.
        </p>
        <p>
          Each diagram has a written description, and selected diagrams have a tactile version you can print on swell
          paper or emboss. You can ask follow-up questions about a diagram in English or Hindi.
        </p>
        <h2 className="text-h2 pt-4">Who makes it</h2>
        <p>
          Describe-it is built by NCAHT, the National Centre for Assistive Health Technologies, a joint initiative of
          ICMR, IIT Delhi and AIIMS Delhi.
        </p>
        <h2 className="text-h2 pt-4">Contact</h2>
        <p>
          Email <a href="mailto:ncaht.iitd@gmail.com">ncaht.iitd@gmail.com</a> or call +91 11 26596080,
          Monday to Friday, 10 am to 6 pm.
        </p>
      </div>
    </div>
  );
}

export function AccessibilityStatement() {
  usePageTitle('Accessibility statement');
  return (
    <div className="page prose-measure">
      <PageHeader title="Accessibility statement" />
      <div className="space-y-5 text-body-lg">
        <p>
          We want everyone to be able to use Describe-it, including people who use screen readers, magnifiers,
          high-contrast settings or only a keyboard. We aim to meet WCAG 2.2 level AA.
        </p>
        <h2 className="text-h2 pt-4">What you can do</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Use the <strong>Display</strong> button at the top of every page to choose light, dark or high-contrast colours, larger text or wider spacing. Your choice is remembered in this browser.</li>
          <li>Zoom the page up to 400% without losing content.</li>
          <li>Use every feature with a keyboard. The first Tab on any page offers “Skip to content”.</li>
        </ul>
        <h2 className="text-h2 pt-4">Known problems</h2>
        <p>
          The account pages and the batch tools have not yet been redesigned and may be harder to use.
          Many diagrams in the new NCERT Science collection do not have descriptions yet.
        </p>
        <h2 className="text-h2 pt-4">Tell us about a problem</h2>
        <p>
          Email <a href="mailto:ncaht.iitd@gmail.com">ncaht.iitd@gmail.com</a> with the page and what went wrong.
          We aim to reply within 5 working days.
        </p>
      </div>
    </div>
  );
}
