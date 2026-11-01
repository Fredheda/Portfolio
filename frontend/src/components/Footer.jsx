import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { content } from '../lib/content';
import ContactLinks from './ContactLinks';

function Footer() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-page flex-col items-start gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between md:px-6">
        <p className="m-0 text-sm text-muted">
          &copy; {new Date().getFullYear()} {content.profile.name} ·{' '}
          <Link to="/privacy-policy" className="text-muted underline-offset-4 hover:text-ink hover:underline">
            Privacy policy
          </Link>
        </p>
        <ContactLinks className="flex" />
      </div>

      {showTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-4 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-ink shadow-sm hover:text-royal"
          aria-label="Back to top"
        >
          <i className="fas fa-arrow-up text-sm" aria-hidden="true" />
        </button>
      )}
    </footer>
  );
}

export default Footer;
