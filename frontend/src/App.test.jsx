import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { AgentUIProvider } from './context/AgentUIContext';
import { content } from './lib/content';

// Lenis drives smooth scrolling via requestAnimationFrame; irrelevant here.
vi.mock('lenis', () => ({
  default: class {
    raf() {}
    destroy() {}
  },
}));
vi.mock('./components/FredbotPanel', () => ({ default: () => <div>fredbot stub</div> }));
vi.mock('./components/AgentTools', () => ({ default: () => null }));

const { profile, about } = content;

const renderAt = (path) => {
  window.history.pushState({}, '', path);
  return render(
    <AgentUIProvider>
      <App />
    </AgentUIProvider>,
  );
};

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', vi.fn());
  Element.prototype.scrollIntoView.mockClear();
});

describe('App routes', () => {
  it('home shows hero, experience, fredbot and projects in that order, with no posts', () => {
    renderAt('/');
    const experience = document.getElementById('experience');
    const projects = document.getElementById('projects');
    const fredbot = screen.getByText('fredbot stub');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(profile.claim);
    expect(experience).not.toBeNull();
    expect(projects).not.toBeNull();
    expect(document.getElementById('posts')).toBeNull();
    expect(experience.compareDocumentPosition(fredbot) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(fredbot.compareDocumentPosition(projects) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('/about is hidden: it lands on the home page and shows no About text', async () => {
    renderAt('/about');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(profile.claim);
    expect(window.location.pathname).toBe('/');
    for (const paragraph of about.paragraphs) {
      expect(screen.queryByText(paragraph)).toBeNull();
    }
  });

  it.each(['/projects/nope', '/missing'])('%s shows the not-found page', async (path) => {
    renderAt(path);
    expect(await screen.findByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to the home page' })).toHaveAttribute('href', '/');
  });

  it('a hash link scrolls to its section', () => {
    renderAt('/#experience');
    const scrolled = Element.prototype.scrollIntoView.mock.contexts;
    expect(scrolled).toContain(document.getElementById('experience'));
  });
});
