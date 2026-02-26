import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import InstructorForm from './InstructorForm';
import * as firestoreUtils from '../lib/firestore';

// Mock data layer
vi.mock('../lib/firestore', () => ({
  addInstructor: vi.fn(),
}));

const mockedAddInstructor = firestoreUtils.addInstructor as unknown as ReturnType<typeof vi.fn>;

/**
 * InstructorForm Component Tests
 * 
 * Tests the instructor form component including:
 * - Form validation (name required, minimum length)
 * - Successful submission
 * - Loading states
 * - Error handling
 * - Form reset after submission
 */
describe('InstructorForm', () => {
  const defaultProps = {
    onSuccess: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderForm = (props = {}) => {
    return render(<InstructorForm {...defaultProps} {...props} />);
  };

  const fillAndSubmitForm = async (name: string) => {
    const nameInput = screen.getByLabelText(/instructor name/i);
    const submitButton = screen.getByRole('button', { name: /add instructor/i });

    await act(async () => {
      fireEvent.change(nameInput, { target: { value: name } });
      fireEvent.click(submitButton);
    });

    return { nameInput, submitButton };
  };

  it('should render form with name input and buttons', () => {
    renderForm();
    
    expect(screen.getByLabelText(/instructor name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add instructor/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('should validate that name is required', async () => {
    renderForm();
    
    await act(async () => {
      fireEvent.submit(screen.getByRole('form'));
    });

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });
  });

  it('should validate minimum name length', async () => {
    renderForm();
    
    await fillAndSubmitForm('A');

    await waitFor(() => {
      expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument();
    });
  });

  it('should submit form successfully with valid data', async () => {
    mockedAddInstructor.mockResolvedValue('inst123');
    renderForm();
    
    await fillAndSubmitForm('Jane Doe');

    await waitFor(() => {
      expect(mockedAddInstructor).toHaveBeenCalledWith({ name: 'Jane Doe' });
      expect(defaultProps.onSuccess).toHaveBeenCalledWith('inst123', 'Jane Doe');
    });
  });

  it('should show loading state during submission', async () => {
    mockedAddInstructor.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve('inst123'), 100)));
    renderForm();
    
    const { submitButton } = await fillAndSubmitForm('Jane Doe');

    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/adding instructor/i)).toBeInTheDocument();
  });

  it('should handle submission errors', async () => {
    const errorMessage = 'Failed to add instructor';
    mockedAddInstructor.mockRejectedValue(new Error(errorMessage));
    renderForm();
    
    await fillAndSubmitForm('Jane Doe');

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should call onCancel when cancel button is clicked', async () => {
    renderForm();
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    
    await act(async () => {
      fireEvent.click(cancelButton);
    });

    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('should reset form after successful submission', async () => {
    mockedAddInstructor.mockResolvedValue('inst123');
    renderForm();
    
    const { nameInput } = await fillAndSubmitForm('Jane Doe');

    await waitFor(() => {
      expect(nameInput).toHaveValue('');
    });
  });

  it('should not reset form on submission error', async () => {
    mockedAddInstructor.mockRejectedValue(new Error('Failed to add instructor'));
    renderForm();
    
    const { nameInput } = await fillAndSubmitForm('Jane Doe');

    await waitFor(() => {
      expect(nameInput).toHaveValue('Jane Doe');
    });
  });

  it('should have proper form accessibility', () => {
    renderForm();
    
    const nameInput = screen.getByLabelText(/instructor name/i);
    expect(nameInput).toHaveAttribute('type', 'text');
    expect(nameInput).toHaveAttribute('required');
    expect(nameInput).toHaveAttribute('minLength', '2');
  });

  it('should use swim school blue theme colors', () => {
    renderForm();
    
    const submitButton = screen.getByRole('button', { name: /add instructor/i });
    expect(submitButton).toHaveClass('bg-blue-600', 'hover:bg-blue-700');
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toHaveClass('border-blue-600', 'text-blue-600');
  });

  it('should show success message after successful submission', async () => {
    mockedAddInstructor.mockResolvedValue('inst123');
    renderForm();
    
    await fillAndSubmitForm('Jane Doe');

    await waitFor(() => {
      expect(screen.getByText(/instructor added successfully/i)).toBeInTheDocument();
    });
  });

  it('should clear error message when user starts typing again', async () => {
    renderForm();
    
    const nameInput = screen.getByLabelText(/instructor name/i);

    // Submit with invalid data
    await act(async () => {
      fireEvent.submit(screen.getByRole('form'));
    });
    
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });

    // Start typing valid data
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Jane' } });
    });
    
    await waitFor(() => {
      expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument();
    });
  });
}); 