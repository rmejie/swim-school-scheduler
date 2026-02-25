import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DashboardLayout from './DashboardLayout';

describe('DashboardLayout', () => {
  it('should render children content', () => {
    render(
      <DashboardLayout>
        <div data-testid="dashboard-content">Dashboard Content</div>
      </DashboardLayout>
    );

    expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
    expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
  });

  it('should render the TopNav component', () => {
    render(
      <DashboardLayout>
        <p>Content</p>
      </DashboardLayout>
    );

    expect(screen.getByTestId('topnav')).toBeInTheDocument();
  });

  it('should render the Sidebar component', () => {
    render(
      <DashboardLayout>
        <p>Content</p>
      </DashboardLayout>
    );

    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('should render a main content area', () => {
    render(
      <DashboardLayout>
        <p>Content</p>
      </DashboardLayout>
    );

    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass('flex-1', 'p-4');
  });

  it('should toggle sidebar collapse when toggle button is clicked', () => {
    render(
      <DashboardLayout>
        <p>Content</p>
      </DashboardLayout>
    );

    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar).toHaveClass('w-64');

    const toggleButton = screen.getByLabelText(/collapse sidebar/i);
    fireEvent.click(toggleButton);

    expect(sidebar).toHaveClass('w-16');
  });

  it('should expand sidebar back when toggled again', () => {
    render(
      <DashboardLayout>
        <p>Content</p>
      </DashboardLayout>
    );

    const toggleButton = screen.getByLabelText(/collapse sidebar/i);
    fireEvent.click(toggleButton);

    const expandButton = screen.getByLabelText(/expand sidebar/i);
    fireEvent.click(expandButton);

    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar).toHaveClass('w-64');
  });
});
