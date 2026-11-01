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

  it('gives every project an architecture line', () => {
    const content = contentSchema.parse(raw);
    for (const project of content.projects) {
      expect(project.caseStudy.architecture.length, project.id).toBeGreaterThan(0);
    }
  });

  it('rejects a project without an architecture line', () => {
    const bad = copy();
    delete bad.projects[0].caseStudy.architecture;
    expect(() => contentSchema.parse(bad)).toThrow();
  });

  it('lists the five featured projects and no MCP client', () => {
    const ids = contentSchema.parse(raw).projects.map((p) => p.id);
    expect(ids).toEqual(['paper-podcasts', 'tfl-mcp-server', 'copilotkit-canvas', 'restaurant-researcher', 'shap-open-source']);
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
