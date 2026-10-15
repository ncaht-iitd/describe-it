import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LogoLockup } from './Logo';
import DisplaySettings from './DisplaySettings';
import { isLoggedIn, logout } from '../services/appwriteService';

const NAV = [
  ['/', 'Search', true],
  ['/collections', 'Collections'],
  ['/tools', 'Tools'],
  ['/about', 'About'],
];

// NavLink sets aria-current="page" on the current page; it is also underlined (not colour alone)
const navClass = ({ isActive }) =>
  `inline-flex items-center min-h-[44px] px-2 font-bold text-label no-underline hover:underline underline-offset-[6px] decoration-2 ${
    isActive ? 'text-accent underline' : 'text-ink'
  }`;

const SiteHeader = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    isLoggedIn().then(setLoggedIn).catch(() => setLoggedIn(false));
  }, [location.pathname]);

  const handleLogout = async () => {
    try { await logout(); } catch { /* already logged out */ }
    setLoggedIn(false);
    navigate('/');
  };

  return (
    <header className="bg-surface border-b border-theme border-line">
      <div className="max-w-content mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-x-8 gap-y-3">
        <Link to="/" aria-label="Describe-it home" className="no-underline rounded-control">
          <LogoLockup fontSize={22} />
        </Link>

        <nav aria-label="Main" className="order-3 w-full md:order-none md:w-auto">
          <ul className="flex flex-wrap gap-x-5 list-none p-0 m-0">
            {NAV.map(([to, label, end]) => (
              <li key={to}><NavLink to={to} end={end} className={navClass}>{label}</NavLink></li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <DisplaySettings />
          {loggedIn ? (
            <>
              <NavLink to="/dashboard" className={navClass}>My requests</NavLink>
              <button
                type="button"
                onClick={handleLogout}
                className="min-h-[44px] px-4 rounded-control border-2 border-control bg-surface text-ink font-bold text-label hover:border-accent"
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center min-h-[44px] px-4 rounded-control bg-accent text-on-accent font-bold text-label no-underline hover:bg-accent-hover hover:text-on-accent"
            >
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;
