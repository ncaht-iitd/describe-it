import PropTypes from 'prop-types';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';

// Frame shared by every page: skip link, header, one <main> landmark, footer.
// Pages render their content (starting with one h1) inside <main>.
const SiteLayout = ({ children }) => (
  <div className="min-h-screen flex flex-col bg-bg text-ink font-body">
    <a href="#main" className="skip-link">Skip to content</a>
    <SiteHeader />
    <main id="main" tabIndex={-1} className="flex-1 w-full focus:outline-none">
      {children}
    </main>
    <SiteFooter />
  </div>
);

SiteLayout.propTypes = { children: PropTypes.node };

export default SiteLayout;
