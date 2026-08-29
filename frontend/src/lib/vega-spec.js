import { compile } from 'vega-lite';
import { parse } from 'vega';

function withTooltip(unit) {
  const mark = unit.mark;
  if (typeof mark === 'string') {
    return { ...unit, mark: { type: mark, tooltip: true } };
  }
  if (mark !== null && typeof mark === 'object' && !('tooltip' in mark)) {
    return { ...unit, mark: { ...mark, tooltip: true } };
  }
  return unit;
}

// Mono-glow theme: grayscale bars instead of Vega-Lite's default rainbow
// categorical palette, transparent background so the chart blends into its
// zinc-900 wrapper, and axis/legend text in the same zinc tones used
// elsewhere on the page.
const MONO_GLOW_CONFIG = {
  background: 'transparent',
  view: { stroke: 'transparent' },
  axis: {
    domainColor: '#3f3f46',
    gridColor: '#27272a',
    labelColor: '#a1a1aa',
    tickColor: '#3f3f46',
    titleColor: '#d4d4d8',
  },
  legend: {
    labelColor: '#a1a1aa',
    titleColor: '#d4d4d8',
  },
  range: {
    category: ['#f4f4f5', '#d4d4d8', '#a1a1aa', '#71717a', '#52525b', '#3f3f46'],
  },
  mark: { color: '#e4e4e7' },
};

export function normalizeSpec(spec, opts = {}) {
  return withTooltip({
    ...spec,
    width: 'container',
    height: opts.height ?? 300,
    autosize: { type: 'fit-x', contains: 'padding' },
    config: { ...MONO_GLOW_CONFIG, ...spec.config },
  });
}

export function validateSpec(spec) {
  try {
    const compiled = compile(normalizeSpec(spec)).spec;
    parse(compiled);
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}
