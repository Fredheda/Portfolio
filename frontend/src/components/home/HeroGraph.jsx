// Static stand-in for the animated hero graph (phase 5 animates it): the
// things fredbot connects, drawn as a small network. fredbot is the live
// node, in royal blue.
const nodes = [
  { id: 'teams', x: 60, y: 60, r: 5, label: '6 teams', lx: 60, ly: 48 },
  { id: 'tfl', x: 150, y: 40, r: 6, label: 'TfL agent', lx: 150, ly: 28 },
  { id: 'mcp', x: 250, y: 70, r: 5, label: 'MCP tools', lx: 250, ly: 58 },
  { id: 'fredbot', x: 110, y: 130, r: 8, label: 'fredbot', lx: 122, ly: 120, live: true },
  { id: 'azure', x: 210, y: 150, r: 5, label: 'Azure', lx: 210, ly: 168 },
  { id: 'a', x: 40, y: 160, r: 4 },
  { id: 'b', x: 280, y: 130, r: 4 },
];

const edges = [
  ['teams', 'tfl'],
  ['tfl', 'mcp'],
  ['teams', 'fredbot'],
  ['fredbot', 'tfl'],
  ['fredbot', 'azure'],
  ['azure', 'mcp'],
  ['a', 'fredbot'],
  ['b', 'mcp'],
  ['azure', 'b'],
];

const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));

export default function HeroGraph() {
  return (
    <svg
      viewBox="0 0 320 190"
      role="img"
      aria-label="A network linking fredbot to the TfL agent, MCP tools, Azure and six teams"
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
