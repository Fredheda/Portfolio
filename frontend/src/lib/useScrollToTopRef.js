import { useCallback } from 'react';

export function useScrollToTopRef() {
  return useCallback((element) => {
    if (element) window.scrollTo(0, 0);
  }, []);
}
