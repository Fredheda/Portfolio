import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PrivacyPolicy from './PrivacyPolicy';

describe('PrivacyPolicy', () => {
  it('renders the heading and the last-updated line', () => {
    render(<PrivacyPolicy />);
    expect(screen.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeInTheDocument();
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
  });

  it('scrolls to the top on mount', () => {
    window.scrollTo.mockClear();
    render(<PrivacyPolicy />);
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });
});
