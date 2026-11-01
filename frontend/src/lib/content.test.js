import { describe, expect, it } from 'vitest';
import raw from '../../content/site-content.json';
import { contentSchema } from './content';

const copy = () => structuredClone(raw);

describe('site content', () => {
  it('parses the real content file', () => {
    expect(() => contentSchema.parse(raw)).not.toThrow();
  });

  it('has the sections the home page renders', () => {
    const content = contentSchema.parse(raw);
    expect(content.experience.length).toBeGreaterThanOrEqual(1);
    expect(content.posts.length).toBeGreaterThanOrEqual(3);
    expect(content.posts.length).toBeLessThanOrEqual(6);
    expect(content.fredbot.suggestions).toHaveLength(3);
    const ids = content.projects.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('rejects an impossible post date', () => {
    const bad = copy();
    bad.posts[0].date = '2026-13-40';
    expect(() => contentSchema.parse(bad)).toThrow();
  });

  it('rejects a project id that is not a URL slug', () => {
    const bad = copy();
    bad.projects[0].id = 'Paper Podcasts';
    expect(() => contentSchema.parse(bad)).toThrow();
  });
});
