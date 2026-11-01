import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { content } from '../../lib/content';
import Experience from './Experience';
import Hero from './Hero';
import Posts from './Posts';

const { profile, experience, postsUrl } = content;

const post = (overrides) => ({
  id: 'p',
  date: '2026-10-29',
  text: 'Post text',
  url: 'https://www.linkedin.com/feed/update/1',
  reactions: 12,
  comments: 3,
  ...overrides,
});

describe('Hero', () => {
  it('shows the claim as the only h1, the now line and a labelled graph', () => {
    render(
      <MemoryRouter>
        <Hero />
      </MemoryRouter>,
    );
    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent(profile.claim);
    expect(screen.getByText(profile.now)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /.+/ })).toBeInTheDocument();
  });
});

describe('Experience', () => {
  it('shows role, sector, years and impact for each entry', () => {
    render(<Experience />);
    const section = screen.getByRole('region', { name: 'Experience' });
    expect(section).toHaveAttribute('id', 'experience');
    for (const entry of experience) {
      const card = within(section).getByRole('heading', { name: entry.role }).closest('article');
      expect(card).toHaveTextContent(entry.sector);
      expect(card).toHaveTextContent(`${entry.start} to ${entry.end ?? 'now'}`);
      expect(card).toHaveTextContent(entry.impact);
    }
  });
});

describe('Posts', () => {
  it('lists posts newest first, each linking to LinkedIn with its counts', () => {
    const older = post({ id: 'a', date: '2026-10-01', text: 'Older post' });
    const newer = post({ id: 'b', date: '2026-10-30', text: 'Newer post', reactions: 148, comments: 23 });
    render(<Posts posts={[older, newer]} now={new Date('2026-11-01T12:00:00Z')} />);

    const links = screen.getAllByRole('link', { name: /post/i }).filter((a) => a.getAttribute('href') !== postsUrl);
    expect(links[0]).toHaveTextContent('Newer post');
    expect(links[1]).toHaveTextContent('Older post');
    expect(links[0]).toHaveAttribute('href', newer.url);
    expect(links[0]).toHaveAttribute('target', '_blank');
    expect(links[0]).toHaveTextContent('148');
    expect(links[0]).toHaveTextContent('23 comments');
    expect(links[0]).toHaveTextContent('2d');
  });

  it('shortens a long post to 300 characters', () => {
    render(<Posts posts={[post({ text: 'x'.repeat(400) })]} now={new Date('2026-11-01T12:00:00Z')} />);
    const shown = screen.getByText(/^x+…$/).textContent;
    expect(shown.length).toBeLessThanOrEqual(301);
  });

  it('shows no age for a post dated in the future', () => {
    render(<Posts posts={[post({ date: '2026-12-01' })]} now={new Date('2026-11-01T12:00:00Z')} />);
    expect(screen.getByRole('region', { name: 'Recent posts' })).not.toHaveTextContent(/NaN|-\d/);
  });

  it('is the section with id "posts" and links to all posts', () => {
    render(<Posts posts={[post({})]} />);
    expect(screen.getByRole('region', { name: 'Recent posts' })).toHaveAttribute('id', 'posts');
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'See all on LinkedIn' })).toHaveAttribute('href', postsUrl);
  });
});
