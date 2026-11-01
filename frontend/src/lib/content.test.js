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
    expect(content.posts.length).toBeLessThanOrEqual(6);
    expect(content.fredbot.suggestions).toHaveLength(3);
    const ids = content.projects.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives each built project a top-down Mermaid diagram and SHAP none', () => {
    const { projects } = contentSchema.parse(raw);
    for (const project of projects) {
      const { architecture } = project.caseStudy;
      if (project.id === 'shap-open-source') expect(architecture).toBeUndefined();
      else expect(architecture, project.id).toMatch(/^flowchart TB\n/);
    }
  });

  it('ships no [draft] marker in any text', () => {
    expect(JSON.stringify(contentSchema.parse(raw))).not.toContain('[draft]');
  });

  it('names the role "AI & Engineering Lead" and lists no earlier role', () => {
    const { profile, experience } = contentSchema.parse(raw);
    expect(profile.headline).toBe('AI & Engineering Lead');
    expect(experience.map((entry) => entry.role)).toEqual(['AI & Engineering Lead']);
  });

  it('lists no posts while the Posts section is hidden', () => {
    expect(contentSchema.parse(raw).posts).toEqual([]);
  });

  it('lists the five featured projects and no MCP client', () => {
    const ids = contentSchema.parse(raw).projects.map((p) => p.id);
    expect(ids).toEqual(['paper-podcasts', 'tfl-mcp-server', 'copilotkit-canvas', 'restaurant-researcher', 'shap-open-source']);
  });

  it('rejects an impossible post date', () => {
    const bad = copy();
    bad.posts = [
      { id: 'p', date: '2026-13-40', text: 'x', url: 'https://example.com', reactions: 0, comments: 0 },
    ];
    expect(() => contentSchema.parse(bad)).toThrow();
  });

  it('rejects a project id that is not a URL slug', () => {
    const bad = copy();
    bad.projects[0].id = 'Paper Podcasts';
    expect(() => contentSchema.parse(bad)).toThrow();
  });
});
