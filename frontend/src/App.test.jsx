import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

// Lenis drives smooth scrolling via requestAnimationFrame; irrelevant here.
vi.mock('lenis', () => ({
  default: class {
    raf() {}
    destroy() {}
  },
}));
vi.mock('./components/TerminalHero', () => ({ default: () => <div>hero stub</div> }));
vi.mock('./components/Projects', () => ({ default: () => <div>projects stub</div> }));
vi.mock('./components/AgentTools', () => ({ default: () => null }));

beforeEach(() => {
  window.history.pushState({}, '', '/');
  vi.stubGlobal('requestAnimationFrame', vi.fn());
});

describe('App', () => {
  it('renders the header, the main content and the footer on the home route', () => {
    render(<App />);
    expect(screen.getByRole('link', { name: 'FH' })).toBeInTheDocument();
    expect(screen.getByText('hero stub')).toBeInTheDocument();
    expect(screen.getByText('projects stub')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toBeInTheDocument();
  });
});
