import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Header from './Headers';

const renderHeader = () =>
  render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>,
  );

describe('Header', () => {
  it('links the logo to the home page', () => {
    renderHeader();
    expect(screen.getByRole('link', { name: 'FH' })).toHaveAttribute('href', '/');
  });

  it('links to email, LinkedIn and GitHub', () => {
    renderHeader();
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('mailto:frederik.heda@gmx.net');
    expect(hrefs).toContain('https://www.linkedin.com/in/frederik-heda/');
    expect(hrefs).toContain('https://github.com/Fredheda?tab=repositories');
  });

  it('opens the mobile menu and locks body scroll, then restores it', () => {
    renderHeader();
    const before = screen.getAllByRole('link').length;

    fireEvent.click(screen.getByLabelText('Toggle menu'));

    expect(document.body.style.overflow).toBe('hidden');
    // The overlay repeats the three social links.
    expect(screen.getAllByRole('link').length).toBe(before + 3);

    fireEvent.click(screen.getByLabelText('Toggle menu'));
    expect(document.body.style.overflow).toBe('');
  });
});
