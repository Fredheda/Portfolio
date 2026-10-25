import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import Footer from './Footer';

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
    expect(screen.getByText(new RegExp(`© ${new Date().getFullYear()} Frederik Heda`))).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute(
      'href',
      '/privacy-policy',
    );
  });

  it('links to email, LinkedIn and GitHub', () => {
    renderFooter();
    expect(screen.getByLabelText('Email')).toHaveAttribute('href', 'mailto:frederik.heda@gmx.net');
    expect(screen.getByLabelText('LinkedIn')).toHaveAttribute(
      'href',
      'https://www.linkedin.com/in/frederik-heda/',
    );
    expect(screen.getByLabelText('GitHub')).toHaveAttribute(
      'href',
      'https://github.com/Fredheda?tab=repositories',
    );
  });

  it('shows the back-to-top button only after scrolling, and scrolls to the top', () => {
    renderFooter();
    expect(screen.queryByLabelText('Back to top')).not.toBeInTheDocument();

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 700, configurable: true });
      fireEvent.scroll(window);
    });

    const button = screen.getByLabelText('Back to top');
    fireEvent.click(button);
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });
});
