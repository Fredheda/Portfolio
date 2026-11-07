import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { content } from '../../lib/content';
import HeroGraph from './HeroGraph';

const LIVE_BLUE = '#1d4ed8';

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
