import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BlogError, getPost } from '../lib/blogApi';
import { content } from '../lib/content';
import BlogPost from './BlogPost';

vi.mock('../lib/blogApi', async (original) => ({ ...(await original()), getPost: vi.fn() }));

const post = {
  postId: 'p1',
  slug: 'hello-world',
  title: 'Hello world',
  summary: 'A first post.',
  tags: ['maths', 'python'],
  publishedAt: '2026-11-10T08:00:00Z',
  updatedAt: '2026-11-10T08:00:00Z',
  readingTimeMinutes: 4,
  coverMediaId: 'm1',
  body: 'First paragraph.\n\n## Section\n\nSecond paragraph.',
  media: [{ id: 'm1', kind: 'image', mime: 'image/png', alt: 'A pixel' }],
};

const renderAt = (slug) =>
  render(
    <MemoryRouter initialEntries={[`/blog/${slug}`]}>
      <Routes>
        <Route path="/blog/:slug" element={<BlogPost />} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.mocked(getPost).mockReset();
  document.title = 'before';
  document.head.querySelectorAll('meta[name="robots"]').forEach((meta) => meta.remove());
});

describe('BlogPost', () => {
  it('shows the article: title, date, reading time, tags, cover and body', async () => {
    vi.mocked(getPost).mockResolvedValue(post);
    renderAt('hello-world');
    expect(await screen.findByRole('heading', { level: 1, name: 'Hello world' })).toBeInTheDocument();
    expect(screen.getByText(/10 November 2026/)).toBeInTheDocument();
    expect(screen.getByText(/4 min read/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'python' })).toHaveAttribute('href', '/blog?tag=python');
    expect(screen.getByRole('img', { name: 'A pixel' })).toHaveAttribute('src', '/api/blog/posts/hello-world/media/m1');
    expect(screen.getByText('First paragraph.')).toBeInTheDocument();
    // "## Section" in a body is demoted by one level.
    expect(screen.getByRole('heading', { level: 3, name: 'Section' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'All posts' })).toHaveAttribute('href', '/blog');
    expect(document.title).toBe(`Hello world · ${content.profile.name}`);
  });

  it('puts the title back when the page goes away', async () => {
    vi.mocked(getPost).mockResolvedValue(post);
    const { unmount } = renderAt('hello-world');
    await screen.findByRole('heading', { level: 1, name: 'Hello world' });
    unmount();
    expect(document.title).toBe('before');
  });

  it('shows not-found and asks search engines to skip an unknown post', async () => {
    vi.mocked(getPost).mockRejectedValue(new BlogError('not_found'));
    renderAt('missing');
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  });

  it('makes no request for a slug that is not slug-shaped', () => {
    renderAt('Bad_Slug');
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(getPost).not.toHaveBeenCalled();
  });

  it('shows fixed text on failure and loads again on retry', async () => {
    vi.mocked(getPost).mockRejectedValueOnce(new BlogError('unavailable')).mockResolvedValueOnce(post);
    renderAt('hello-world');
    expect(await screen.findByRole('alert')).toHaveTextContent("This post can't be loaded right now.");
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Hello world' })).toBeInTheDocument();
  });
});
