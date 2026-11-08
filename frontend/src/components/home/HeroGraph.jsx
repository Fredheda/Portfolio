import { content } from '../../lib/content';

// Static stand-in for the animated hero graph (phase 5 animates it): a small
// network around fredbot, the live node, in royal blue. The four labels come
// from the content file; keep each short enough for its slot.
const { labels } = content.heroGraph;

const nodes = [
  { id: 'lead', x: 60, y: 60, r: 5, label: labels.lead, lx: 60, ly: 48 },
  { id: 'focus', x: 150, y: 40, r: 6, label: labels.focus, lx: 150, ly: 28 },
  { id: 'openSource', x: 250, y: 70, r: 5, label: labels.openSource, lx: 250, ly: 46 },
  { id: 'fredbot', x: 110, y: 130, r: 8, label: 'fredbot', lx: 122, ly: 120, live: true },
  { id: 'community', x: 210, y: 150, r: 5, label: labels.community, lx: 210, ly: 168 },
  { id: 'a', x: 40, y: 160, r: 4 },
  { id: 'b', x: 280, y: 130, r: 4 },
];

const edges = [
  ['lead', 'focus'],
  ['focus', 'openSource'],
  ['lead', 'fredbot'],
  ['fredbot', 'focus'],
  ['fredbot', 'community'],
  ['community', 'openSource'],
  ['a', 'fredbot'],
  ['b', 'openSource'],
  ['community', 'b'],
];

const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));

export default function HeroGraph() {
  return (
    <svg
      viewBox="0 0 320 190"
      role="img"
      aria-label={`A network linking fredbot to ${labels.lead}, ${labels.focus}, ${labels.openSource} and ${labels.community}`}
      className="h-auto w-full rounded-xl border border-line bg-white/70"
    >
      <g stroke="#c7d2e6" strokeWidth="1.2">
        {edges.map(([from, to]) => (
          <line key={`${from}-${to}`} x1={byId[from].x} y1={byId[from].y} x2={byId[to].x} y2={byId[to].y} />
        ))}
      </g>
      {nodes.map((n) => (
        <circle key={n.id} cx={n.x} cy={n.y} r={n.r} fill={n.live ? '#1d4ed8' : '#0f2440'} />
      ))}
      <g fontSize="10" fill="#4b5c78" fontFamily="Inter, sans-serif" textAnchor="middle">
        {nodes
          .filter((n) => n.label)
          .map((n) => (
            <text key={n.id} x={n.lx} y={n.ly} textAnchor={n.live ? 'start' : 'middle'}>
              {n.label}
            </text>
          ))}
      </g>
    </svg>
  );
}
