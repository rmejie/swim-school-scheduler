import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AppointmentsTable from './AppointmentsTable';
import type { LessonRow } from './AppointmentsTable';

describe('AppointmentsTable', () => {
  const sampleLessons: LessonRow[] = [
    { time: '10:00 AM', studentName: 'Alice Smith', instructor: 'Jane Doe', level: 3, poolZone: 'Lane 1' },
    { time: '11:00 AM', studentName: 'Bob Johnson', instructor: 'Mike Chen', level: 'Beginner', poolZone: 'Lane 2' },
  ];

  it('should render table headers', () => {
    render(<AppointmentsTable lessons={[]} />);

    expect(screen.getByText('Time')).toBeInTheDocument();
    expect(screen.getByText('Student Name')).toBeInTheDocument();
    expect(screen.getByText('Instructor')).toBeInTheDocument();
    expect(screen.getByText('Level')).toBeInTheDocument();
    expect(screen.getByText('Pool Zone')).toBeInTheDocument();
  });

  it('should display empty state when no lessons exist', () => {
    render(<AppointmentsTable lessons={[]} />);

    expect(screen.getByText(/no lessons today/i)).toBeInTheDocument();
  });

  it('should render lesson rows with all fields', () => {
    render(<AppointmentsTable lessons={sampleLessons} />);

    expect(screen.getByText('10:00 AM')).toBeInTheDocument();
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Lane 1')).toBeInTheDocument();

    expect(screen.getByText('11:00 AM')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    expect(screen.getByText('Mike Chen')).toBeInTheDocument();
    expect(screen.getByText('Beginner')).toBeInTheDocument();
    expect(screen.getByText('Lane 2')).toBeInTheDocument();
  });

  it('should handle rows with missing optional fields', () => {
    const partial: LessonRow[] = [{ time: '09:00 AM' }];
    render(<AppointmentsTable lessons={partial} />);

    expect(screen.getByText('09:00 AM')).toBeInTheDocument();
    expect(screen.queryByText(/no lessons today/i)).not.toBeInTheDocument();
  });

  it('should have proper card styling', () => {
    const { container } = render(<AppointmentsTable lessons={sampleLessons} />);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('bg-white', 'rounded-lg', 'shadow-md');
  });

  it('should render single lesson correctly', () => {
    render(<AppointmentsTable lessons={[sampleLessons[0]]} />);

    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
  });
});
