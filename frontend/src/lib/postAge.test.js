import { describe, expect, it } from 'vitest';
import { postAge } from './postAge';

const now = new Date('2026-11-01T12:00:00Z');

describe('postAge', () => {
  it.each([
    ['2026-11-01', 'today'],
    ['2026-10-29', '3d'],
    ['2026-10-18', '2w'],
    ['2026-06-04', '5mo'],
    ['2025-09-27', '1y'],
  ])('%s is %s', (date, expected) => {
    expect(postAge(date, now)).toBe(expected);
  });

  it('gives no age for a future or invalid date', () => {
    expect(postAge('2026-11-05', now)).toBe('');
    expect(postAge('nope', now)).toBe('');
  });
});
