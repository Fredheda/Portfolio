import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import About from './About';

describe('About', () => {
  it('scrolls to the top on mount', () => {
    window.scrollTo.mockClear();
    render(<About />);
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });
});
