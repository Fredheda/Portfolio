import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { content } from '../lib/content';
import ContactLinks from './ContactLinks';

const { profile } = content;

// Section links point at the home page ("/#experience"), so they work from
// every route; useHashScroll on the home page does the scrolling.
export const navLinks = [
  { label: 'Experience', to: '/#experience' },
  { label: 'Ask fredbot', to: '/#fredbot' },
  { label: 'Projects', to: '/#projects' },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const { pathname } = useLocation();
  const close = () => setMobileOpen(false);

  // A link to the page you are already on does not scroll by itself.
  const goHome = () => {
    close();
    if (pathname !== '/') return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    // Solid background, no backdrop-filter: a filter makes the header the
    // containing block of the fixed mobile panel (it collapses to a strip) and
    // repaints behind the header on every scroll frame.
    <header className="sticky top-0 z-40 border-b border-line bg-page">
      <div className="mx-auto flex max-w-page items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link to="/" onClick={goHome} className="font-heading text-lg font-semibold text-ink no-underline">
          {profile.name}
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="text-sm font-medium text-muted no-underline transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ContactLinks className="hidden sm:flex" />
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-ink md:hidden"
          >
            Menu
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="fixed inset-x-0 bottom-0 top-[57px] z-30 flex flex-col gap-1 overflow-y-auto border-t border-line bg-page px-4 py-6 md:hidden"
        >
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              onClick={close}
              className="rounded-lg px-2 py-3 font-heading text-2xl font-semibold text-ink no-underline"
            >
              {link.label}
            </Link>
          ))}
          <ContactLinks className="mt-6 flex px-2" />
        </nav>
      )}
    </header>
  );
};

export default Header;
