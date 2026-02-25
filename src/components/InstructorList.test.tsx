import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import InstructorList from './InstructorList';
import * as firestoreUtils from '../lib/firestore';
import type { Instructor } from '../types';

// Mock Firebase utilities
vi.mock('../lib/firestore', () => ({
  getInstructors: vi.fn(),
}));

const mockedGetInstructors = firestoreUtils.getInstructors as unknown as ReturnType<typeof vi.fn>;

/**
 * InstructorList Component Tests
 * 
 * Tests the instructor list component including:
 * - Data fetching from Firebase
 * - Loading states
 * - Empty state when no instructors exist
 * - Proper data display in list format
 * - Error handling
 */
describe('InstructorList', () => {
  const mockTimestamp = {
    seconds: 0,
    nanoseconds: 0,
    toDate: () => new Date(),
    toMillis: () => 0,
    isEqual: () => true,
    toJSON: () => ({}),
  };

  const mockInstructors = [
    { id: 'inst1', name: 'Jane Doe', createdAt: mockTimestamp },
    { id: 'inst2', name: 'John Smith', createdAt: mockTimestamp },
    { id: 'inst3', name: 'Sarah Johnson', createdAt: mockTimestamp },
  ] as unknown as Instructor[];

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

