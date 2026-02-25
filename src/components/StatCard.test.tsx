import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatCard from './StatCard';

describe('StatCard', () => {
  it('should render label and numeric value', () => {
    render(<StatCard label="Total Students" value={42} />);

    expect(screen.getByText('Total Students')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('should render label and string value', () => {
    render(<StatCard label="Status" value="Active" />);

    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should render zero value correctly', () => {
    render(<StatCard label="Cancelled" value={0} />);

    expect(screen.getByText('Cancelled')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should use swim school blue theme for value', () => {
    const { container } = render(<StatCard label="Test" value={10} />);

    const valueEl = screen.getByText('10');
    expect(valueEl).toHaveClass('text-blue-600');

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('bg-white', 'rounded-lg', 'shadow-md');
  });

  it('should have hover shadow transition', () => {
    const { container } = render(<StatCard label="Test" value={5} />);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('hover:shadow-lg', 'transition-shadow');
  });
});
