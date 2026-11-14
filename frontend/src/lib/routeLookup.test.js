import { describe, expect, it } from 'vitest';
import { lookupRoute } from '../../routeLookup.js';

const routeMeta = {
  '/': { title: 'Home' },
  '/blog': { title: 'Blog' },
};

describe('lookupRoute', () => {
  it('returns the entry of a known route', () => {
    expect(lookupRoute(routeMeta, '/')).toBe(routeMeta['/']);
    expect(lookupRoute(routeMeta, '/blog')).toBe(routeMeta['/blog']);
  });

  it('returns nothing for a path that is not a route', () => {
    expect(lookupRoute(routeMeta, '/nope')).toBeUndefined();
  });

  it('never matches a property every object inherits', () => {
    for (const key of ['constructor', '__proto__', 'toString', 'hasOwnProperty', 'valueOf']) {
      expect(lookupRoute(routeMeta, key), key).toBeUndefined();
    }
  });
});
