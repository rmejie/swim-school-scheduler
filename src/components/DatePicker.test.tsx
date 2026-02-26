import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DatePicker from './DatePicker';

describe('DatePicker', () => {
  it('should render with the selected date', () => {
    render(<DatePicker selectedDate="2024-07-15" onChange={vi.fn()} />);

    const input = screen.getByLabelText(/date/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('2024-07-15');
  });

  it('should call onChange when date is changed', () => {
    const onChange = vi.fn();
    render(<DatePicker selectedDate="2024-07-15" onChange={onChange} />);

    const input = screen.getByLabelText(/date/i);
    fireEvent.change(input, { target: { value: '2024-07-20' } });

    expect(onChange).toHaveBeenCalledWith('2024-07-20');
  });

  it('should have accessible label', () => {
    render(<DatePicker selectedDate="2024-07-15" onChange={vi.fn()} />);

    const input = screen.getByLabelText(/date/i);
    expect(input).toHaveAttribute('type', 'date');
    expect(input).toHaveAttribute('id', 'schedule-date');
  });
});
