import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBlogAvailable } from '../lib/useBlogAvailable';
import Header from './Headers';

vi.mock('../lib/useBlogAvailable', () => ({ useBlogAvailable: vi.fn() }));

const renderAt = (path = '/') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Header />
    </MemoryRouter>,
  );

beforeEach(() => vi.mocked(useBlogAvailable).mockReset());

describe('Header Blog link', () => {
  it('is absent while the blog has no post', () => {
    vi.mocked(useBlogAvailable).mockReturnValue(false);
    renderAt();
    expect(screen.queryByRole('link', { name: 'Blog' })).toBeNull();
  });

  it('comes last in the main nav and in the mobile menu once the blog has a post', () => {
    vi.mocked(useBlogAvailable).mockReturnValue(true);
    renderAt();
    const main = within(screen.getByRole('navigation', { name: 'Main' }));
    expect(main.getAllByRole('link').map((link) => link.textContent)).toEqual([
      'Experience',
      'Ask fredbot',
      'Projects',
      'Blog',
    ]);
    expect(main.getByRole('link', { name: 'Blog' })).toHaveAttribute('href', '/blog');
    screen.getByRole('button', { name: 'Menu' }).click();
    const mobile = within(screen.getByRole('navigation', { name: 'Mobile' }));
    expect(mobile.getByRole('link', { name: 'Blog' })).toHaveAttribute('href', '/blog');
  });

  it('marks the current page: page on /blog, true below it, nothing elsewhere', () => {
    vi.mocked(useBlogAvailable).mockReturnValue(true);
    const link = () => screen.getAllByRole('link', { name: 'Blog' })[0];
    const { unmount } = renderAt('/blog');
    expect(link()).toHaveAttribute('aria-current', 'page');
    unmount();
    const second = renderAt('/blog/hello-world');
    expect(link()).toHaveAttribute('aria-current', 'true');
    second.unmount();
    renderAt('/privacy-policy');
    expect(link()).not.toHaveAttribute('aria-current');
  });
});
