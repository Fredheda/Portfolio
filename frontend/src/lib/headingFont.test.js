import { describe, expect, it } from 'vitest';
import indexHtml from '../../index.html?raw';
import tailwind from '../../tailwind.config.js';

// Every component's source, as text, to check the classes headings carry.
const sources = import.meta.glob('../**/*.jsx', { query: '?raw', import: 'default', eager: true });

// Built from parts so this file does not match its own search.
const OLD_SERIF_CLASS = `font-${'serif'}`;

describe('heading font', () => {
  it('is Inter, through the `heading` family', () => {
    const families = tailwind.theme.extend.fontFamily;
    expect(families.heading[0]).toBe('Inter');
    expect(families.serif).toBeUndefined();
  });

  it('is requested from Google Fonts without Fraunces and with Inter 700', () => {
    expect(indexHtml).not.toContain('Fraunces');
    expect(indexHtml).toMatch(/family=Inter:wght@[^&]*\b700\b/);
  });

  it('no component still uses the old serif class', () => {
    const offenders = Object.entries(sources)
      .filter(([, text]) => text.includes(OLD_SERIF_CLASS))
      .map(([path]) => path);
    expect(offenders).toEqual([]);
  });

  it('gives every h1 weight 700 and every other heading-font element weight 600', () => {
    const uses = [];
    for (const [path, text] of Object.entries(sources)) {
      for (const match of text.matchAll(/<(\w+)\s[^>]*?className="([^"]*\bfont-heading\b[^"]*)"/g)) {
        uses.push({ path, tag: match[1], classes: match[2].split(/\s+/) });
      }
    }
    expect(uses.length).toBeGreaterThan(0);
    for (const { path, tag, classes } of uses) {
      const weight = tag === 'h1' ? 'font-bold' : 'font-semibold';
      expect(classes, `${tag} in ${path}`).toContain(weight);
    }
  });
});
