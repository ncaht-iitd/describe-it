import { Link } from 'react-router-dom';
import { LogoMark } from './Logo';

const SiteFooter = () => (
  <footer className="mt-16 bg-surface border-t border-theme border-line">
    <div className="max-w-content mx-auto px-4 sm:px-6 py-10 grid gap-8 md:grid-cols-3">
      <div>
        <p className="flex items-center gap-3 font-heading font-semibold text-h3">
          <LogoMark size={28} /> Describe-it
        </p>
        <p className="mt-3 text-small text-muted max-w-sm">
          Built by NCAHT (National Centre for Assistive Health Technologies), a joint initiative of ICMR, IIT Delhi and AIIMS Delhi.
        </p>
      </div>

      <div>
        <h2 className="text-h3 mb-3">Contact</h2>
        <address className="not-italic text-small text-muted leading-relaxed">
          Room GA3, Research and Innovation Park, IIT Delhi, Hauz Khas, New Delhi 110016
          <br />Phone: +91 11 26596080
          <br />Email: <a href="mailto:ncaht.iitd@gmail.com">ncaht.iitd@gmail.com</a>
          <br />Monday to Friday, 10 am to 6 pm
        </address>
      </div>

      <div>
        <h2 className="text-h3 mb-3">More</h2>
        <ul className="list-none p-0 m-0 space-y-2 text-small">
          <li><Link to="/accessibility">Accessibility statement</Link></li>
          <li><Link to="/about">About Describe-it</Link></li>
          <li>
            <a href="https://www.linkedin.com/company/ncaht-iitdelhi/" target="_blank" rel="noopener noreferrer">
              NCAHT on LinkedIn<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </li>
        </ul>
      </div>
    </div>
  </footer>
);

export default SiteFooter;
