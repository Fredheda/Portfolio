import { useEffect, useId, useState } from 'react';

// Site palette: navy text and lines, royal blue borders, soft blue wash fill.
const THEME = {
  fontFamily: 'Inter, system-ui, sans-serif',
  primaryColor: '#f7f9fd',
  primaryBorderColor: '#1d4ed8',
  primaryTextColor: '#0f2440',
  lineColor: '#0f2440',
  clusterBkg: '#ffffff',
  clusterBorder: '#c7d2e6',
};

// Draws Mermaid source as an svg. Mermaid is heavy, so it is imported on the
// first render of a diagram (only when "For engineers" is on). If it fails to
// load or parse, the source shows as plain text instead of an empty box.
export default function Diagram({ source }) {
  const id = `diagram-${useId().replace(/:/g, '')}`;
  const [svg, setSvg] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSvg(null);
    setFailed(false);
    import('mermaid')
      .then(({ default: mermaid }) => {
        mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'base', themeVariables: THEME });
        return mermaid.render(id, source);
      })
      .then((result) => {
        if (!cancelled) setSvg(result.svg);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id, source]);

  if (failed) {
    return <pre className="overflow-x-auto whitespace-pre-wrap break-words text-sm text-muted">{source}</pre>;
  }
  return (
    <figure
      aria-label="Architecture diagram"
      className="m-0 overflow-x-auto rounded-xl border border-line bg-white p-4 [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full"
      // Mermaid returns sanitised svg when securityLevel is "strict".
      dangerouslySetInnerHTML={{ __html: svg ?? '' }}
    />
  );
}
