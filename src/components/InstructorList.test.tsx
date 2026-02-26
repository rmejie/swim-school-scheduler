import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import InstructorList from './InstructorList';
import * as firestoreUtils from '../lib/firestore';
import type { Instructor } from '../types';

// Mock data layer
vi.mock('../lib/firestore', () => ({
  getInstructors: vi.fn(),
}));

const mockedGetInstructors = firestoreUtils.getInstructors as unknown as ReturnType<typeof vi.fn>;

describe('InstructorList', () => {
  const mockInstructors: Instructor[] = [
    { id: 'inst1', name: 'Jane Doe', createdAt: '2024-01-01T00:00:00Z' },
    { id: 'inst2', name: 'John Smith', createdAt: '2024-01-01T00:00:00Z' },
    { id: 'inst3', name: 'Sarah Johnson', createdAt: '2024-01-01T00:00:00Z' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display loading state while fetching instructors', async () => {
    mockedGetInstructors.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<InstructorList />);
    
    expect(screen.getByText(/loading instructors/i)).toBeInTheDocument();
  });

  it('should fetch and display list of instructors', async () => {
    mockedGetInstructors.mockResolvedValue(mockInstructors);
    
    render(<InstructorList />);
    
    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
    });
    
    expect(mockedGetInstructors).toHaveBeenCalledTimes(1);
  });

  it('should display empty state when no instructors exist', async () => {
    mockedGetInstructors.mockResolvedValue([]);
    
    render(<InstructorList />);
    
    await waitFor(() => {
      expect(screen.getByText(/no instructors/i)).toBeInTheDocument();
    });
  });

  it('should display error message when fetch fails', async () => {
    const errorMessage = 'Failed to load instructors';
    mockedGetInstructors.mockRejectedValue(new Error(errorMessage));
    
    render(<InstructorList />);
    
    await waitFor(() => {
      expect(screen.getByText(new RegExp(errorMessage, 'i'))).toBeInTheDocument();
    });
  });

  it('should display instructors in a styled list format', async () => {
    mockedGetInstructors.mockResolvedValue(mockInstructors);
    
    render(<InstructorList />);
    
    await waitFor(() => {
      const instructorItems = screen.getAllByText(/jane doe|john smith|sarah johnson/i);
      expect(instructorItems.length).toBeGreaterThan(0);
    });
    
    // Check that list items have proper styling classes
    const listContainer = screen.getByRole('list') || screen.getByTestId('instructor-list');
    expect(listContainer).toBeInTheDocument();
  });

  it('should handle single instructor display', async () => {
    mockedGetInstructors.mockResolvedValue([mockInstructors[0]]);
    
    render(<InstructorList />);
    
    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.queryByText('John Smith')).not.toBeInTheDocument();
    });
  });

  it('should call getInstructors on mount', async () => {
    mockedGetInstructors.mockResolvedValue([]);
    
    render(<InstructorList />);
    
    await waitFor(() => {
      expect(mockedGetInstructors).toHaveBeenCalledTimes(1);
    });
  });

  it('should display instructor names with proper styling', async () => {
    mockedGetInstructors.mockResolvedValue(mockInstructors);
    
    render(<InstructorList />);
    
    await waitFor(() => {
      const janeDoe = screen.getByText('Jane Doe');
      expect(janeDoe).toBeInTheDocument();
      // Check that the list container has proper styling
      const listContainer = screen.getByTestId('instructor-list');
      expect(listContainer).toHaveClass('bg-white', 'rounded-lg', 'shadow-md');
    });
  });
});

