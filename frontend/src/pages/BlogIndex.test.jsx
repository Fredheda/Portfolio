import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BlogError, listPosts } from '../lib/blogApi';
import BlogIndex from './BlogIndex';

vi.mock('../lib/blogApi', async (original) => ({ ...(await original()), listPosts: vi.fn() }));

const post = (slug, title, extra = {}) => ({
  postId: slug,
  slug,
  title,
  summary: `About ${title}.`,
  tags: ['maths'],
  publishedAt: '2026-11-10T08:00:00Z',
  updatedAt: '2026-11-10T08:00:00Z',
  readingTimeMinutes: 4,
  ...extra,
});

const renderAt = (path = '/blog') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <BlogIndex />
    </MemoryRouter>,
  );

beforeEach(() => vi.mocked(listPosts).mockReset());

describe('BlogIndex', () => {
  it('lists each post with its summary, date, reading time and a tag filter link', async () => {
    vi.mocked(listPosts).mockResolvedValue({ items: [post('hello-world', 'Hello world')], nextCursor: null });
    renderAt();
    expect(await screen.findByRole('link', { name: 'Hello world' })).toHaveAttribute('href', '/blog/hello-world');
    expect(screen.getByText('About Hello world.')).toBeInTheDocument();
    expect(screen.getByText(/10 November 2026/)).toBeInTheDocument();
    expect(screen.getByText(/4 min read/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'maths' })).toHaveAttribute('href', '/blog?tag=maths');
    expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull();
  });

  it('says so when there are no posts', async () => {
    vi.mocked(listPosts).mockResolvedValue({ items: [], nextCursor: null });
    renderAt();
    expect(await screen.findByText('No posts yet.')).toBeInTheDocument();
  });

  it('shows fixed text on failure and loads again on retry', async () => {
    vi.mocked(listPosts)
      .mockRejectedValueOnce(new BlogError('unavailable'))
      .mockResolvedValueOnce({ items: [post('a', 'Alpha')], nextCursor: null });
    renderAt();
    expect(await screen.findByRole('alert')).toHaveTextContent("Posts can't be loaded right now.");
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('link', { name: 'Alpha' })).toBeInTheDocument();
  });

  it('passes the tag from the address to the API', async () => {
    vi.mocked(listPosts).mockResolvedValue({ items: [], nextCursor: null });
    renderAt('/blog?tag=maths');
    await screen.findByText('No posts yet.');
    expect(listPosts).toHaveBeenCalledWith(expect.objectContaining({ tag: 'maths' }));
    expect(screen.getByRole('link', { name: 'Show all posts' })).toHaveAttribute('href', '/blog');
  });

  it('loads the next page with the cursor and keeps the first page', async () => {
    vi.mocked(listPosts)
      .mockResolvedValueOnce({ items: [post('a', 'Alpha')], nextCursor: 'c2' })
      .mockResolvedValueOnce({ items: [post('b', 'Beta')], nextCursor: null });
    renderAt();
    fireEvent.click(await screen.findByRole('button', { name: 'Load more' }));
    expect(await screen.findByRole('link', { name: 'Beta' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Alpha' })).toBeInTheDocument();
    expect(vi.mocked(listPosts).mock.calls[1][0]).toMatchObject({ cursor: 'c2' });
    expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull();
  });

  it('keeps the posts and says so when the next page fails', async () => {
    vi.mocked(listPosts)
      .mockResolvedValueOnce({ items: [post('a', 'Alpha')], nextCursor: 'c2' })
      .mockRejectedValueOnce(new BlogError('unavailable'));
    renderAt();
    fireEvent.click(await screen.findByRole('button', { name: 'Load more' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent("More posts can't be loaded right now."));
    expect(screen.getByRole('link', { name: 'Alpha' })).toBeInTheDocument();
  });
});
