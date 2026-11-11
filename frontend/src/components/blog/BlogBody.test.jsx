import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import BlogBody from './BlogBody';

const FENCE = '`'.repeat(3);
const renderBody = (markdown) => render(<BlogBody slug="s">{markdown}</BlogBody>).container;

describe('BlogBody maths', () => {
  it('emits MathML only, inline and display', () => {
    // Display maths needs $$ on its own lines; one-line $$x$$ is inline maths.
    const container = renderBody('Euler: $e^{i\\pi}+1=0$\n\n$$\n\\int_0^1 x\\,dx\n$$');
    expect(container.querySelectorAll('math').length).toBe(2);
    expect(container.querySelector('.katex-html')).toBeNull();
    expect(container.querySelector('math[display="block"]')).not.toBeNull();
  });

  it('keeps an overflowing display equation reachable by keyboard', () => {
    const container = renderBody('$$\nx\n$$');
    const display = container.querySelector('.katex-display');
    expect(display).toHaveAttribute('tabindex', '0');
    expect(display).toHaveAttribute('aria-label', 'Equation');
  });

  it('does not link from maths', () => {
    const container = renderBody('$\\href{javascript:alert(1)}{x}$');
    expect(container.querySelector('a')).toBeNull();
  });
});

describe('BlogBody code', () => {
  it('highlights Python', () => {
    const container = renderBody(`${FENCE}python\nfor i in range(3):\n    print('hi')\n${FENCE}`);
    expect(container.querySelector('pre code.hljs .hljs-keyword')).toHaveTextContent('for');
    expect(container.querySelector('pre code .hljs-string')).toHaveTextContent("'hi'");
  });

  it('highlights MATLAB, which is not in the default language set', () => {
    const container = renderBody(`${FENCE}matlab\nfunction y = f(x)\n  y = x.^2;\nend\n${FENCE}`);
    expect(container.querySelector('pre code .hljs-keyword')).toHaveTextContent('function');
  });

  it('shows an unknown language as plain code', () => {
    const container = renderBody(`${FENCE}nosuchlang\nx = 1\n${FENCE}`);
    expect(container.querySelector('pre code')).toHaveTextContent('x = 1');
  });

  it('lets a long code line scroll inside its box by keyboard', () => {
    expect(renderBody(`${FENCE}python\nx = 1\n${FENCE}`).querySelector('pre')).toHaveAttribute('tabindex', '0');
  });
});

describe('BlogBody media and links', () => {
  it('loads an image through the proxy route', () => {
    const img = renderBody('![A pixel](media:m1)').querySelector('img');
    expect(img).toHaveAttribute('src', '/api/blog/posts/s/media/m1');
    expect(img).toHaveAttribute('alt', 'A pixel');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('drops an image whose target is not allowed and keeps its alt text', () => {
    const container = renderBody('![caption here](http://example.com/x.png)');
    expect(container.querySelector('img')).toBeNull();
    expect(container).toHaveTextContent('caption here');
  });

  it('opens https links safely in a new tab and keeps the text of a blocked link', () => {
    const container = renderBody('[ok](https://example.com) and [bad](javascript:alert(1))');
    const ok = container.querySelector('a');
    expect(ok).toHaveAttribute('target', '_blank');
    expect(ok).toHaveAttribute('rel', 'noopener noreferrer');
    expect(container.querySelectorAll('a').length).toBe(1);
    expect(container).toHaveTextContent('bad');
  });

  it('keeps an in-page anchor and a relative post link in the same tab', () => {
    const links = [...renderBody('[a](#sec) [b](/blog/other)').querySelectorAll('a')];
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['#sec', '/blog/other']);
    expect(links.some((a) => a.hasAttribute('target'))).toBe(false);
  });
});

describe('BlogBody structure and safety', () => {
  it('does not render raw HTML', () => {
    const container = renderBody('<script>alert(1)</script>\n\n<img src=x onerror="alert(1)">\n\ntext');
    expect(container.querySelector('script, img')).toBeNull();
    // skipHtml: a stray tag renders as nothing, not as literal text.
    expect(container).not.toHaveTextContent('<script>');
    expect(container).toHaveTextContent('text');
  });

  it('demotes headings so the page keeps the only h1', () => {
    const container = renderBody('# One\n\n## Two\n\n###### Six');
    expect(container.querySelector('h1')).toBeNull();
    expect([...container.querySelectorAll('h2, h3, h6')].map((h) => h.tagName)).toEqual(['H2', 'H3', 'H6']);
  });

  it('wraps a table so a wide one scrolls inside its box', () => {
    const container = renderBody('| a | b |\n|---|---|\n| 1 | 2 |');
    const wrapper = container.querySelector('.blog-table');
    expect(wrapper).toHaveAttribute('tabindex', '0');
    expect(wrapper.querySelector('table')).not.toBeNull();
  });

  it('leaves prose that looks like markup syntax alone', () => {
    const container = renderBody('Note:foo at 10:30 and ::video-ish and {braces}');
    expect(container).toHaveTextContent('Note:foo at 10:30 and ::video-ish and {braces}');
  });
});

describe('BlogBody video', () => {
  const line = '::video{media="v1" poster="p1" loop muted autoplay caption="A *loop*"}';

  it('renders a figure with controls, the poster and a plain-text caption', () => {
    const container = renderBody(line);
    const video = container.querySelector('figure.blog-video video');
    expect(video).toHaveAttribute('src', '/api/blog/posts/s/media/v1');
    expect(video).toHaveAttribute('poster', '/api/blog/posts/s/media/p1');
    expect(video.loop).toBe(true);
    expect(video.muted).toBe(true);
    expect(video).toHaveAttribute('autoplay');
    expect(video).toHaveAttribute('controls');
    expect(container.querySelector('figcaption')).toHaveTextContent('A *loop*');
  });

  it('autoplays only when muted', () => {
    const video = renderBody('::video{media="v1" autoplay}').querySelector('video');
    expect(video).not.toHaveAttribute('autoplay');
    expect(video).toHaveAttribute('controls');
  });

  it('keeps a line with a bad media id visible as text', () => {
    const container = renderBody('::video{media="../x"}');
    expect(container.querySelector('video')).toBeNull();
    expect(container).toHaveTextContent('::video{media="../x"}');
  });
});
