import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import MagneticButton from './MagneticButton';

describe('MagneticButton', () => {
  it('renders its children inside a wrapper with the given class', () => {
    render(
      <MagneticButton className="extra">
        <button>Click me</button>
      </MagneticButton>,
    );
    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button.parentElement.className).toContain('inline-block');
    expect(button.parentElement.className).toContain('extra');
  });

  it('tolerates mouse movement and leave without throwing', () => {
    render(
      <MagneticButton>
        <button>Hover me</button>
      </MagneticButton>,
    );
    const wrapper = screen.getByRole('button', { name: 'Hover me' }).parentElement;

    fireEvent.mouseEnter(wrapper);
    fireEvent.mouseMove(wrapper, { clientX: 10, clientY: 10 });
    fireEvent.mouseLeave(wrapper);

    expect(screen.getByRole('button', { name: 'Hover me' })).toBeInTheDocument();
  });
});
