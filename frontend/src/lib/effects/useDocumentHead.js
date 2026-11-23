import { useEffect } from 'react';

// Sets the tab title (and, for a page that must stay out of search results,
// a noindex robots tag) while the page is shown, then puts both back.
export function useDocumentHead({ title, noindex = false }) {
  useEffect(() => {
    const previous = document.title;
    if (title) document.title = title;
    let meta;
    if (noindex) {
      meta = document.createElement('meta');
      meta.name = 'robots';
      meta.content = 'noindex';
      document.head.appendChild(meta);
    }
    return () => {
      document.title = previous;
      meta?.remove();
    };
  }, [title, noindex]);
}
