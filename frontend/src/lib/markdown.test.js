import { describe, expect, it } from 'vitest';
import { normalizeMathDelimiters } from './markdown';

describe('normalizeMathDelimiters', () => {
  it('converts \\( \\) inline math to dollar signs', () => {
    expect(normalizeMathDelimiters('area is \\(\\pi r^2\\) here')).toBe('area is $\\pi r^2$ here');
  });

  it('converts \\[ \\] display math to double dollar signs', () => {
    expect(normalizeMathDelimiters('\\[x^2 + y^2\\]')).toBe('$$x^2 + y^2$$');
  });

  it('handles display math that spans lines', () => {
    expect(normalizeMathDelimiters('\\[\na = b\n\\]')).toBe('$$\na = b\n$$');
  });

  it('leaves text that already uses dollar signs alone', () => {
    expect(normalizeMathDelimiters('already $x$ and $$y$$')).toBe('already $x$ and $$y$$');
  });

  it('leaves plain text alone', () => {
    expect(normalizeMathDelimiters('no math here')).toBe('no math here');
  });
});
