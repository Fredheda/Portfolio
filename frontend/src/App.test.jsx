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
  it('home shows hero, experience, projects and fredbot in that order, with no posts', () => {
    renderAt('/');
    const order = ['experience', 'projects'].map((id) => document.getElementById(id));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(profile.claim);
    expect(order.every(Boolean)).toBe(true);
    expect(document.getElementById('posts')).toBeNull();
    const fredbot = screen.getByText('fredbot stub');
    expect(order[0].compareDocumentPosition(order[1]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(order[1].compareDocumentPosition(fredbot) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('about shows the name, the photo and every About paragraph', async () => {
    renderAt('/about');
    expect(await screen.findByRole('heading', { level: 1, name: profile.name })).toBeInTheDocument();
    const photo = screen.getByRole('img', { name: profile.photo.alt });
    expect(photo).toHaveAttribute('loading', 'lazy');
    expect(photo).toHaveAttribute('width', String(profile.photo.width));
    expect(photo).toHaveAttribute('height', String(profile.photo.height));
    for (const paragraph of about.paragraphs) {
      expect(screen.getByText(paragraph)).toBeInTheDocument();
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
