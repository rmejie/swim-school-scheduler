import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from './Sidebar';

describe('Sidebar', () => {
  it('renders all nav items with correct labels', () => {
    render(<Sidebar activeItem="Dashboard" />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Schedule')).toBeInTheDocument();
    expect(screen.getByText('Students')).toBeInTheDocument();
    expect(screen.getByText('Instructors')).toBeInTheDocument();
    expect(screen.getByText('Billing')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
  });

  it('expands and collapses Reports submenu', () => {
    render(<Sidebar activeItem="Dashboard" />);
    const reports = screen.getByText('Reports');
    fireEvent.click(reports);
    expect(screen.getByText('Attendance')).toBeInTheDocument();
    expect(screen.getByText('Performance')).toBeInTheDocument();
  });

  // Add more tests for collapse/expand, active item, accessibility, responsiveness
}); 