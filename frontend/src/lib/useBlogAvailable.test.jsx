import { render, renderHook, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Header from '../components/Headers';
import { BlogError, listPosts } from './blogApi';
import { useBlogAvailable } from './useBlogAvailable';

vi.mock('./blogApi', async (original) => ({ ...(await original()), listPosts: vi.fn() }));

const page = (count) => ({
  items: Array.from({ length: count }, (_, i) => ({ postId: `p${i}`, slug: `s${i}` })),
  nextCursor: null,
});

beforeEach(() => vi.mocked(listPosts).mockReset());

describe('useBlogAvailable', () => {
  it('is true once the list holds a post, and asks for one post only', async () => {
    vi.mocked(listPosts).mockResolvedValue(page(1));
    const { result } = renderHook(() => useBlogAvailable());
    expect(result.current).toBe(false);
    await waitFor(() => expect(result.current).toBe(true));
    expect(listPosts).toHaveBeenCalledWith(expect.objectContaining({ limit: 1 }));
  });

  it('stays false for an empty list', async () => {
    vi.mocked(listPosts).mockResolvedValue(page(0));
    const { result } = renderHook(() => useBlogAvailable());
    await waitFor(() => expect(listPosts).toHaveBeenCalled());
    await Promise.resolve();
    expect(result.current).toBe(false);
  });

  it('stays false when the blog is off or down, without an unhandled rejection', async () => {
    vi.mocked(listPosts).mockRejectedValue(new BlogError('unavailable'));
    const { result } = renderHook(() => useBlogAvailable());
    await waitFor(() => expect(listPosts).toHaveBeenCalled());
    await Promise.resolve();
    expect(result.current).toBe(false);
  });

  it('aborts the request when the header goes away', async () => {
    vi.mocked(listPosts).mockReturnValue(new Promise(() => {}));
    const { unmount } = renderHook(() => useBlogAvailable());
    const { signal } = vi.mocked(listPosts).mock.calls[0][0];
    expect(signal.aborted).toBe(false);
    unmount();
    expect(signal.aborted).toBe(true);
  });

  it('does not hold up the header while the list request hangs', () => {
    vi.mocked(listPosts).mockReturnValue(new Promise(() => {}));
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );
    const main = within(screen.getByRole('navigation', { name: 'Main' }));
    expect(main.getAllByRole('link').map((link) => link.textContent)).toEqual([
      'Experience',
      'Ask fredbot',
      'Projects',
    ]);
    expect(screen.getByRole('button', { name: 'Menu' })).toBeEnabled();
  });
});
