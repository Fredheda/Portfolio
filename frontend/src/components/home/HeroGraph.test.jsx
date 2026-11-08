import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { content } from '../../lib/content';
import HeroGraph from './HeroGraph';

const LIVE_BLUE = '#1d4ed8';

// Geometry guard: a label must not sit on an edge or leave the drawing. Text
// width is estimated generously (5.4 units per character at font-size 10);
// the box runs from 8 units above the baseline to 2 below it.
const CHAR_WIDTH = 5.4;
const VIEW = { width: 320, height: 190 };

function labelBox(text) {
  const x = Number(text.getAttribute('x'));
  const y = Number(text.getAttribute('y'));
  const width = text.textContent.length * CHAR_WIDTH;
  const left = text.getAttribute('text-anchor') === 'start' ? x : x - width / 2;
  return { left, right: left + width, top: y - 8, bottom: y + 2 };
}

function edgeCrossesBox(line, box) {
  const [x1, y1, x2, y2] = ['x1', 'y1', 'x2', 'y2'].map((name) => Number(line.getAttribute(name)));
  for (let t = 0; t <= 1; t += 0.005) {
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    if (x >= box.left && x <= box.right && y >= box.top && y <= box.bottom) return true;
  }
  return false;
}

describe('HeroGraph label placement', () => {
  it('keeps every label off every edge', () => {
    const { container } = render(<HeroGraph />);
    const lines = [...container.querySelectorAll('line')];
    for (const text of container.querySelectorAll('text')) {
      const box = labelBox(text);
      const crossed = lines.filter((line) => edgeCrossesBox(line, box));
      expect(crossed, `"${text.textContent}" overlaps an edge`).toHaveLength(0);
    }
  });

  it('keeps every label inside the drawing', () => {
    const { container } = render(<HeroGraph />);
    for (const text of container.querySelectorAll('text')) {
      const box = labelBox(text);
      expect(box.left, text.textContent).toBeGreaterThanOrEqual(0);
      expect(box.right, text.textContent).toBeLessThanOrEqual(VIEW.width);
      expect(box.top, text.textContent).toBeGreaterThanOrEqual(0);
      expect(box.bottom, text.textContent).toBeLessThanOrEqual(VIEW.height);
    }
  });
});

describe('HeroGraph', () => {
  it('labels the four slots from the content file and fredbot', () => {
    render(<HeroGraph />);
    const { lead, focus, openSource, community } = content.heroGraph.labels;
    for (const text of [lead, focus, openSource, community, 'fredbot']) {
      expect(screen.getByText(text)).toBeInTheDocument();
    }
  });

  it('keeps fredbot as the only live (royal blue) node', () => {
    const { container } = render(<HeroGraph />);
    expect(container.querySelectorAll(`circle[fill="${LIVE_BLUE}"]`)).toHaveLength(1);
  });

  it('keeps the same shape: 7 nodes, 9 edges, 5 labels', () => {
    const { container } = render(<HeroGraph />);
    expect(container.querySelectorAll('circle')).toHaveLength(7);
    expect(container.querySelectorAll('line')).toHaveLength(9);
    expect(container.querySelectorAll('text')).toHaveLength(5);
  });

  it('names the linked labels in its accessible description', () => {
    render(<HeroGraph />);
    const { lead, focus, openSource, community } = content.heroGraph.labels;
    expect(screen.getByRole('img')).toHaveAccessibleName(
      `A network linking fredbot to ${lead}, ${focus}, ${openSource} and ${community}`,
    );
  });
});
