import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mermaid = vi.hoisted(() => ({ initialize: vi.fn(), render: vi.fn() }));
vi.mock('mermaid', () => ({ default: mermaid }));

import Diagram from './Diagram';

const SOURCE = 'flowchart TB\n  A --> B';

beforeEach(() => {
  mermaid.initialize.mockClear();
  mermaid.render.mockReset();
});

describe('Diagram', () => {
  it('renders the Mermaid source as an svg with strict security', async () => {
    mermaid.render.mockResolvedValue({ svg: '<svg data-testid="drawn"></svg>' });
    render(<Diagram source={SOURCE} />);
    expect(await screen.findByTestId('drawn')).toBeInTheDocument();
    expect(mermaid.initialize).toHaveBeenCalledWith(expect.objectContaining({ securityLevel: 'strict' }));
    expect(mermaid.render).toHaveBeenCalledWith(expect.any(String), SOURCE);
    expect(screen.getByRole('figure', { name: 'Architecture diagram' })).toBeInTheDocument();
  });

  it('falls back to the source text when rendering fails', async () => {
    mermaid.render.mockRejectedValue(new Error('parse error'));
    render(<Diagram source={SOURCE} />);
    expect(await screen.findByText(/A --> B/)).toBeInTheDocument();
  });
});
