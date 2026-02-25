import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoaderSwimmer from './LoaderSwimmer';

describe('LoaderSwimmer', () => {
  it('should render loading indicator when loading is true', () => {
    render(<LoaderSwimmer loading={true} />);

    const loader = screen.getByTestId('loader-swimmer');
    expect(loader).toBeInTheDocument();
    expect(loader).toHaveAttribute('aria-live', 'polite');
  });

  it('should not render anything when loading is false', () => {
    render(<LoaderSwimmer loading={false} />);

    expect(screen.queryByTestId('loader-swimmer')).not.toBeInTheDocument();
  });

  it('should display loading text', () => {
    render(<LoaderSwimmer loading={true} />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should have pulse animation class', () => {
    render(<LoaderSwimmer loading={true} />);

    const animatedEl = screen.getByText(/loading/i);
    expect(animatedEl).toHaveClass('animate-pulse');
  });

  it('should use sky-500 color scheme', () => {
    render(<LoaderSwimmer loading={true} />);

    const animatedEl = screen.getByText(/loading/i);
    expect(animatedEl).toHaveClass('text-sky-500');
  });
});
