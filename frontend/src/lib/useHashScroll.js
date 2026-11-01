import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Scrolls to the element named by the URL hash after each navigation, so
// header links like "/#experience" work from any route. Keyed on the
// location key: clicking the same link twice still scrolls.
export function useHashScroll() {
  const { hash, key } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const target = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!target) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }, [hash, key]);
}
