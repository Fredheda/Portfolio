import { describe, expect, it } from 'vitest';
import { blogUrlTransform } from './blogMarkdown';

const transform = blogUrlTransform('hello-world');

describe('blogUrlTransform', () => {
  it('turns media: ids into the proxy route', () => {
    expect(transform('media:m_1')).toBe('/api/blog/posts/hello-world/media/m_1');
  });

  it('keeps https, anchors and relative targets', () => {
    for (const url of ['https://example.com/a?b=1', '#section', '/blog/other-post', 'other-post', '?tag=x']) {
      expect(transform(url)).toBe(url);
    }
  });

  it('drops everything else, including tricks browsers normalise', () => {
    const bad = [
      'javascript:alert(1)',
      'JaVaScRiPt:alert(1)',
      'java\tscript:alert(1)',
      ' javascript:alert(1)',
      'data:text/html,<b>x</b>',
      'http://example.com',
      'mailto:a@b.c',
      '//evil.example',
      '/\\evil.example',
      '\\\\evil.example',
      'java%09script:alert(1)',
      'media:../x',
      'media:',
      'file:///etc/passwd',
    ];
    for (const url of bad) expect(transform(url), url).toBe('');
  });
});
