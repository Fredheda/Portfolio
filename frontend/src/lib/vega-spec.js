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

export function normalizeSpec(spec, opts = {}) {
  return withTooltip({
    ...spec,
    width: 'container',
    height: opts.height ?? 300,
    autosize: { type: 'fit-x', contains: 'padding' },
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
