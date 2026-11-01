import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { content } from '../lib/content';
import Header from './Headers';

const { profile } = content;

const renderHeader = () =>
  render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>,
  );

describe('Header', () => {
  it('links the name to the home page', () => {
    renderHeader();
    expect(screen.getByRole('link', { name: profile.name })).toHaveAttribute('href', '/');
  });

  it('links each section, also from other routes', () => {
    renderHeader();
    const nav = within(screen.getByRole('navigation', { name: 'Main' }));
    const expected = {
      About: '/about',
      Experience: '/#experience',
      Projects: '/#projects',
      Posts: '/#posts',
      'Ask fredbot': '/#fredbot',
    };
    for (const [name, href] of Object.entries(expected)) {
      expect(nav.getByRole('link', { name })).toHaveAttribute('href', href);
    }
  });

  it('links to email, LinkedIn and GitHub from the content file', () => {
    renderHeader();
    expect(screen.getByLabelText('Email')).toHaveAttribute('href', profile.links.email);
    expect(screen.getByLabelText('LinkedIn')).toHaveAttribute('href', profile.links.linkedin);
    expect(screen.getByLabelText('GitHub')).toHaveAttribute('href', profile.links.github);
  });

  it('opens and closes the mobile menu', () => {
    renderHeader();
    const toggle = screen.getByRole('button', { name: 'Menu' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(document.body.style.overflow).toBe('hidden');
    expect(within(screen.getByRole('navigation', { name: 'Mobile' })).getByRole('link', { name: 'About' })).toBeVisible();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(document.body.style.overflow).toBe('');
  });

  it('never offers a CV or says he is looking', () => {
    renderHeader();
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    expect(document.body.textContent).not.toMatch(/\bcv\b|résumé|resume|open to work|hire me/i);
  });
});
