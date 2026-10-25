import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Explicit rather than relying on Testing Library's global-afterEach
// auto-detection, which needs `test.globals: true` (not set here: tests
// import describe/it/expect explicitly from "vitest"). Without this, render()
// output from one test leaks into the next in the same file.
afterEach(() => {
  cleanup();
});

// jsdom lacks these browser APIs; framer-motion and the components under test
// call them.
class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
vi.stubGlobal('IntersectionObserver', IntersectionObserverStub);
window.scrollTo = vi.fn();
Element.prototype.scrollTo = vi.fn();
Element.prototype.scrollIntoView = vi.fn();
window.matchMedia =
  window.matchMedia ||
  ((query) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
