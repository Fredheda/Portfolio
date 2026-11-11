import matlab from 'highlight.js/lib/languages/matlab';
import { common } from 'lowlight';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { mediaUrl } from './blogApi';

const MEDIA = /^media:([A-Za-z0-9_-]{1,64})$/;
const ID = /^[A-Za-z0-9_-]{1,64}$/;

// Link and image targets a body may use (spec section 4): https, media:<id>,
// #anchor and relative links. Anything else becomes '' and the component
// drops the link or image. The checks mirror how browsers read a URL:
// control characters are stripped inside a scheme ("java\tscript:"), and a
// backslash counts as a slash ("/\host" is protocol-relative).
export function blogUrlTransform(slug) {
  return (url) => {
    const media = MEDIA.exec(url);
    if (media) return mediaUrl(slug, media[1]);
    // eslint-disable-next-line no-control-regex -- the control range is the point
    if (/[\u0000- \u007f]/.test(url) || /^[\\/]{2}/.test(url)) return '';
    const colon = url.indexOf(':');
    const stop = url.search(/[/?#]/);
    const hasScheme = colon !== -1 && (stop === -1 || colon < stop);
    if (hasScheme) return /^https:/i.test(url) ? url : '';
    return url;
  };
}

const DIRECTIVE = /^::video\{([^}\n]*)\}$/;

function parseAttributes(text) {
  const attributes = {};
  for (const [, name, value] of text.matchAll(/([a-z]+)(?:="([^"]*)")?/g)) {
    attributes[name] = value ?? true;
  }
  return attributes;
}

function videoNode(slug, attributes) {
  const id = (value) => (typeof value === 'string' && ID.test(value) ? value : null);
  const media = id(attributes.media);
  if (!media) return null;
  const poster = id(attributes.poster);
  const caption = typeof attributes.caption === 'string' ? attributes.caption : '';
  const properties = { src: mediaUrl(slug, media), controls: true, playsInline: true, preload: 'metadata' };
  if (poster) properties.poster = mediaUrl(slug, poster);
  if (attributes.loop) properties.loop = true;
  if (attributes.muted) properties.muted = true;
  // Sound that starts by itself is not allowed: autoplay needs muted.
  if (attributes.autoplay && attributes.muted) properties.autoPlay = true;
  if (caption) properties.ariaLabel = caption;
  return {
    type: 'blogVideo',
    data: { hName: 'figure', hProperties: { className: ['blog-video'] } },
    children: [
      { type: 'blogVideoPlayer', data: { hName: 'video', hProperties: properties }, children: [] },
      ...(caption
        ? [{ type: 'blogVideoCaption', data: { hName: 'figcaption' }, children: [{ type: 'text', value: caption }] }]
        : []),
    ],
  };
}

// Turns a paragraph that is exactly `::video{...}` into a figure with a
// video. The line is read from the source text, so Markdown characters in
// the caption stay literal. Everything else, including text such as
// "Note:foo", is left alone (a general directive parser would swallow it).
export function remarkBlogVideo({ slug }) {
  return (tree, file) => {
    const source = String(file.value ?? '');
    const walk = (parent) => {
      parent.children?.forEach((node, index) => {
        if (node.type === 'paragraph' && node.position) {
          const raw = source.slice(node.position.start.offset, node.position.end.offset).trim();
          const match = DIRECTIVE.exec(raw);
          const replacement = match ? videoNode(slug, parseAttributes(match[1])) : null;
          if (replacement) parent.children[index] = replacement;
          return;
        }
        walk(node);
      });
    };
    walk(tree);
  };
}

export const blogRemarkPlugins = (slug) => [remarkGfm, remarkMath, [remarkBlogVideo, { slug }]];

// Maths as MathML only: no KaTeX HTML tree, so no maths font is needed.
// Highlighting skips the maths blocks and plain-text fences.
export const blogRehypePlugins = [
  [rehypeKatex, { output: 'mathml' }],
  [rehypeHighlight, { languages: { ...common, matlab }, plainText: ['math', 'text', 'txt'] }],
];
