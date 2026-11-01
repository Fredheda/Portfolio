import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { content } from '../lib/content';
import Footer from './Footer';

const { profile } = content;

const renderFooter = () =>
  render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>,
  );

beforeEach(() => {
  window.scrollTo.mockClear();
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
});

describe('Footer', () => {
  it('shows the copyright year and a privacy policy link', () => {
    renderFooter();
    expect(screen.getByText(new RegExp(`© ${new Date().getFullYear()} ${profile.name}`))).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Privacy policy' })).toHaveAttribute('href', '/privacy-policy');
  });

  it('links to email, LinkedIn and GitHub from the content file', () => {
    renderFooter();
    expect(screen.getByLabelText('Email')).toHaveAttribute('href', profile.links.email);
    expect(screen.getByLabelText('LinkedIn')).toHaveAttribute('href', profile.links.linkedin);
    expect(screen.getByLabelText('GitHub')).toHaveAttribute('href', profile.links.github);
  });

  it('never offers a CV or says he is looking', () => {
    renderFooter();
    expect(document.body.textContent).not.toMatch(/\bcv\b|résumé|resume|open to work|hire me/i);
  });

  it('shows the back-to-top button only after scrolling, and scrolls to the top', () => {
    renderFooter();
    expect(screen.queryByLabelText('Back to top')).not.toBeInTheDocument();

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 700, configurable: true });
      fireEvent.scroll(window);
    });

    fireEvent.click(screen.getByLabelText('Back to top'));
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });
});
