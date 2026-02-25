import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import WaveDivider from './WaveDivider';

describe('WaveDivider', () => {
  it('should render the wave divider element', () => {
    render(<WaveDivider />);

    const divider = screen.getByTestId('wave-divider');
    expect(divider).toBeInTheDocument();
  });

  it('should be hidden from assistive technology', () => {
    render(<WaveDivider />);

    const divider = screen.getByTestId('wave-divider');
    expect(divider).toHaveAttribute('aria-hidden');
  });

  it('should contain an SVG element', () => {
    render(<WaveDivider />);

    const divider = screen.getByTestId('wave-divider');
    const svg = divider.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should have overflow hidden styling', () => {
    render(<WaveDivider />);

    const divider = screen.getByTestId('wave-divider');
    expect(divider).toHaveClass('w-full', 'overflow-hidden');
  });
});
