import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ClientForm from './ClientForm';
import * as firestoreUtils from '../lib/firestore';

vi.mock('../lib/firestore', () => ({
  addClient: vi.fn(),
}));

const mockedAddClient = firestoreUtils.addClient as unknown as ReturnType<typeof vi.fn>;

describe('ClientForm', () => {
  const defaultProps = {
    onSuccess: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderForm = (props = {}) => {
    return render(<ClientForm {...defaultProps} {...props} />);
  };

  const fillAndSubmitForm = async (name: string, email: string, phone = '') => {
    const nameInput = screen.getByLabelText(/client name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /add client/i });

    await act(async () => {
      fireEvent.change(nameInput, { target: { value: name } });
      fireEvent.change(emailInput, { target: { value: email } });
      if (phone) {
        const phoneInput = screen.getByLabelText(/phone/i);
        fireEvent.change(phoneInput, { target: { value: phone } });
      }
      fireEvent.click(submitButton);
    });

    return { nameInput, emailInput, submitButton };
  };

  it('should render form with name, email, phone inputs and buttons', () => {
    renderForm();

    expect(screen.getByLabelText(/client name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add client/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('should validate that name is required', async () => {
    renderForm();

    const emailInput = screen.getByLabelText(/email address/i);
    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.submit(screen.getByRole('form'));
    });

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });
  });

  it('should validate minimum name length', async () => {
    renderForm();

    await fillAndSubmitForm('A', 'test@example.com');

    await waitFor(() => {
      expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument();
    });
  });

  it('should validate that email is required', async () => {
    renderForm();

    const nameInput = screen.getByLabelText(/client name/i);
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
      fireEvent.submit(screen.getByRole('form'));
    });

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
  });

  it('should validate email format', async () => {
    renderForm();

    await fillAndSubmitForm('Jane Doe', 'not-an-email');

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
    });
  });

  it('should submit form successfully with valid data', async () => {
    mockedAddClient.mockResolvedValue('client123');
    renderForm();

    await fillAndSubmitForm('Jane Doe', 'jane@example.com', '555-1234');

    await waitFor(() => {
      expect(mockedAddClient).toHaveBeenCalledWith({
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '555-1234',
      });
      expect(defaultProps.onSuccess).toHaveBeenCalledWith('client123', 'Jane Doe');
    });
  });

  it('should show loading state during submission', async () => {
    mockedAddClient.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve('client123'), 100)));
    renderForm();

    const { submitButton } = await fillAndSubmitForm('Jane Doe', 'jane@example.com');

    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/adding client/i)).toBeInTheDocument();
  });

  it('should handle submission errors', async () => {
    const errorMessage = 'Failed to add client';
    mockedAddClient.mockRejectedValue(new Error(errorMessage));
    renderForm();

    await fillAndSubmitForm('Jane Doe', 'jane@example.com');

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
    mockedAddClient.mockResolvedValue('client123');
    renderForm();

    const { nameInput, emailInput } = await fillAndSubmitForm('Jane Doe', 'jane@example.com');

    await waitFor(() => {
      expect(nameInput).toHaveValue('');
      expect(emailInput).toHaveValue('');
    });
  });

  it('should not reset form on submission error', async () => {
    mockedAddClient.mockRejectedValue(new Error('Failed'));
    renderForm();

    const { nameInput, emailInput } = await fillAndSubmitForm('Jane Doe', 'jane@example.com');

    await waitFor(() => {
      expect(nameInput).toHaveValue('Jane Doe');
      expect(emailInput).toHaveValue('jane@example.com');
    });
  });

  it('should have proper form accessibility', () => {
    renderForm();

    const nameInput = screen.getByLabelText(/client name/i);
    expect(nameInput).toHaveAttribute('type', 'text');
    expect(nameInput).toHaveAttribute('required');
    expect(nameInput).toHaveAttribute('minLength', '2');

    const emailInput = screen.getByLabelText(/email address/i);
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('required');
  });

  it('should show success message after successful submission', async () => {
    mockedAddClient.mockResolvedValue('client123');
    renderForm();

    await fillAndSubmitForm('Jane Doe', 'jane@example.com');

    await waitFor(() => {
      expect(screen.getByText(/client added successfully/i)).toBeInTheDocument();
    });
  });

  it('should clear name error when user types valid name', async () => {
    renderForm();

    await act(async () => {
      fireEvent.submit(screen.getByRole('form'));
    });

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/client name/i), { target: { value: 'Jane' } });
    });

    await waitFor(() => {
      expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument();
    });
  });
});
