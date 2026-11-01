import { describe, expect, it } from 'vitest';
import { content } from './content';
import { buildRouteMeta, renderHead, routeHeads } from './routeMeta';

const { profile, projects } = content;

describe('buildRouteMeta', () => {
  it('names every route the server should answer with a 200', () => {
    const meta = buildRouteMeta(content);
    expect(Object.keys(meta).sort()).toEqual(
      ['/', '/about', '/privacy-policy', ...projects.map((p) => `/projects/${p.id}`)].sort(),
    );
  });

  it('gives each route its title and description', () => {
    const meta = buildRouteMeta(content);
    expect(meta['/']).toEqual({ title: profile.name, description: profile.claim });
    expect(meta['/about']).toEqual({ title: `About ${profile.name}`, description: profile.claim });
    expect(meta['/privacy-policy'].title).toBe(`Privacy policy · ${profile.name}`);
    expect(meta[`/projects/${projects[0].id}`]).toEqual({
      title: `${projects[0].title} · ${profile.name}`,
      description: projects[0].plainEnglish,
    });
  });
});

describe('renderHead', () => {
  it('escapes text so content can never become markup', () => {
    const head = renderHead({
      title: 'Tom & "Jerry" <b>',
      description: "it's <script>",
      url: 'https://frederikheda.com/about',
      image: 'https://frederikheda.com/images/x.jpg',
    });
    expect(head).toContain('content="Tom &amp; &quot;Jerry&quot; &lt;b&gt;"');
    expect(head).toContain('content="it&#39;s &lt;script&gt;"');
    expect(head).not.toMatch(/<b>|<script>/);
  });

  it('carries the Open Graph and Twitter tags a link preview reads', () => {
    const head = renderHead({ title: 'T', description: 'D', url: 'https://x/a', image: 'https://x/i.jpg' });
    for (const tag of [
      '<meta name="description" content="D">',
      '<meta property="og:title" content="T">',
      '<meta property="og:description" content="D">',
      '<meta property="og:type" content="website">',
      '<meta property="og:url" content="https://x/a">',
      '<meta property="og:image" content="https://x/i.jpg">',
      '<meta name="twitter:card" content="summary_large_image">',
    ]) {
      expect(head).toContain(tag);
    }
  });
});

describe('routeHeads', () => {
  it('pairs an escaped title with the head tags for each route, with absolute URLs', () => {
    const heads = routeHeads(content);
    expect(heads['/about'].title).toBe(`About ${profile.name}`);
    expect(heads['/about'].head).toContain('<meta property="og:url" content="https://frederikheda.com/about">');
    expect(heads['/'].head).toContain(
      `<meta property="og:image" content="https://frederikheda.com${profile.photo.srcLarge}">`,
    );
  });
});
