import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TopNav from './TopNav';

describe('TopNav', () => {
  it('should render the top navigation bar', () => {
    render(<TopNav />);

    const header = screen.getByTestId('topnav');
    expect(header).toBeInTheDocument();
    expect(header).toHaveAttribute('role', 'banner');
  });

  it('should display the brand name', () => {
    render(<TopNav />);

    expect(screen.getByText('Southwest Aquatics')).toBeInTheDocument();
  });

  it('should display the logo image with alt text', () => {
    render(<TopNav />);

    const logo = screen.getByAltText('Southwest Aquatics logo');
    expect(logo).toBeInTheDocument();
    expect(logo.tagName).toBe('IMG');
  });

  it('should render the Schedule Lesson button', () => {
    render(<TopNav />);

    const button = screen.getByRole('button', { name: /schedule lesson/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('text-white');
  });

  it('should render the Notifications button', () => {
    render(<TopNav />);

    const button = screen.getByRole('button', { name: /notifications/i });
    expect(button).toBeInTheDocument();
  });

  it('should have accessible notification label', () => {
    render(<TopNav />);

    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('should have proper styling', () => {
    render(<TopNav />);

    const header = screen.getByTestId('topnav');
    expect(header).toHaveClass('bg-white', 'shadow');
  });
});
