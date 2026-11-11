import { Children, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { blogRehypePlugins, blogRemarkPlugins, blogUrlTransform } from '../../lib/blogMarkdown';

// react-markdown passes the syntax-tree `node` to every component; it must
// not reach a DOM element.
function plain(props) {
  const rest = { ...props };
  delete rest.node;
  return rest;
}

// A body never owns the page's h1: its h1 becomes h2, and so on.
const heading = (level) =>
  function Heading(props) {
    const Tag = `h${Math.min(level + 1, 6)}`;
    return <Tag {...plain(props)} />;
  };

function Link(props) {
  const { href, children, ...rest } = plain(props);
  if (!href) return <span>{children}</span>;
  const external = /^https:/i.test(href);
  const target = external ? { target: '_blank', rel: 'noopener noreferrer' } : {};
  return (
    <a href={href} {...rest} {...target}>
      {children}
    </a>
  );
}

function Image(props) {
  const { src, alt = '', ...rest } = plain(props);
  if (!src) return alt ? <span>{alt}</span> : null;
  return <img src={src} alt={alt} loading="lazy" decoding="async" {...rest} />;
}

const Pre = (props) => <pre tabIndex={0} {...plain(props)} />;

const Table = (props) => (
  <div className="blog-table" tabIndex={0} role="region" aria-label="Table">
    <table {...plain(props)} />
  </div>
);

// Display maths can be wider than a phone: it scrolls inside its own box.
function Span(props) {
  const rest = plain(props);
  // With output 'mathml' KaTeX emits <span class="katex"><math display="block">
  // and no .katex-display wrapper, so display maths is detected from its child.
  const child = Children.toArray(rest.children)[0];
  const isKatex = typeof rest.className === 'string' && rest.className.split(' ').includes('katex');
  if (isKatex && child?.type === 'math' && child.props?.display === 'block') {
    return <span {...rest} className="katex katex-display" tabIndex={0} role="group" aria-label="Equation" />;
  }
  return <span {...rest} />;
}

const components = {
  h1: heading(1),
  h2: heading(2),
  h3: heading(3),
  h4: heading(4),
  h5: heading(5),
  h6: heading(6),
  a: Link,
  img: Image,
  pre: Pre,
  table: Table,
  span: Span,
};

export default function BlogBody({ slug, children }) {
  const remarkPlugins = useMemo(() => blogRemarkPlugins(slug), [slug]);
  const urlTransform = useMemo(() => blogUrlTransform(slug), [slug]);
  return (
    <div className="blog-prose">
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={blogRehypePlugins}
        skipHtml
        urlTransform={urlTransform}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
