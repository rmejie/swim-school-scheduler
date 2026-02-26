import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import AppointmentForm from './AppointmentForm';
import * as firestoreUtils from '../lib/firestore';

vi.mock('../lib/firestore', () => ({
  addAppointment: vi.fn(),
}));

const mockedAddAppointment = firestoreUtils.addAppointment as unknown as ReturnType<typeof vi.fn>;

describe('AppointmentForm', () => {
  const instructors = [
    { id: 'inst1', name: 'Sarah Johnson' },
    { id: 'inst2', name: 'Mike Chen' },
  ];

  const clients = [
    { id: 'client1', name: 'John Smith' },
    { id: 'client2', name: 'Jane Doe' },
  ];

  const defaultProps = {
    instructors,
    clients,
    selectedDate: '2024-07-15',
    onSuccess: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderForm = (props = {}) => {
    return render(<AppointmentForm {...defaultProps} {...props} />);
  };

  const fillForm = async (instructor: string, client: string, time: string, duration?: string) => {
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/instructor/i), { target: { value: instructor } });
      fireEvent.change(screen.getByLabelText(/client/i), { target: { value: client } });
      fireEvent.change(screen.getByLabelText(/start time/i), { target: { value: time } });
      if (duration) {
        fireEvent.change(screen.getByLabelText(/duration/i), { target: { value: duration } });
      }
    });
  };

  it('should render all form fields', () => {
    renderForm();

    expect(screen.getByLabelText(/instructor/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/client/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/start time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/duration/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add appointment/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('should populate instructor dropdown', () => {
    renderForm();

    const select = screen.getByLabelText(/instructor/i);
    expect(select).toContainHTML('Sarah Johnson');
    expect(select).toContainHTML('Mike Chen');
  });

  it('should populate client dropdown', () => {
    renderForm();

    const select = screen.getByLabelText(/client/i);
    expect(select).toContainHTML('John Smith');
    expect(select).toContainHTML('Jane Doe');
  });

  it('should validate instructor is required', async () => {
    renderForm();

    await act(async () => {
      fireEvent.submit(screen.getByRole('form'));
    });

    await waitFor(() => {
      expect(screen.getByText(/instructor is required/i)).toBeInTheDocument();
    });
  });

  it('should validate client is required', async () => {
    renderForm();

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/instructor/i), { target: { value: 'inst1' } });
      fireEvent.submit(screen.getByRole('form'));
    });

    await waitFor(() => {
      expect(screen.getByText(/client is required/i)).toBeInTheDocument();
    });
  });

  it('should validate start time is required', async () => {
    renderForm();

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/instructor/i), { target: { value: 'inst1' } });
      fireEvent.change(screen.getByLabelText(/client/i), { target: { value: 'client1' } });
      fireEvent.submit(screen.getByRole('form'));
    });

    await waitFor(() => {
      expect(screen.getByText(/start time is required/i)).toBeInTheDocument();
    });
  });

  it('should submit form successfully with valid data', async () => {
    mockedAddAppointment.mockResolvedValue('appt123');
    renderForm();

    await fillForm('inst1', 'client1', '10:00');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /add appointment/i }));
    });

    await waitFor(() => {
      expect(mockedAddAppointment).toHaveBeenCalledWith(expect.objectContaining({
        instructorId: 'inst1',
        clientId: 'client1',
        startTime: '10:00',
        date: '2024-07-15',
        blockCount: 1,
      }));
      expect(defaultProps.onSuccess).toHaveBeenCalledWith(expect.objectContaining({
        id: 'appt123',
        instructorId: 'inst1',
        clientName: 'John Smith',
      }));
    });
  });

  it('should show loading state during submission', async () => {
    mockedAddAppointment.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve('appt123'), 100)));
    renderForm();

    await fillForm('inst1', 'client1', '10:00');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /add appointment/i }));
    });

    expect(screen.getByText(/adding appointment/i)).toBeInTheDocument();
  });

  it('should handle double booking error', async () => {
    mockedAddAppointment.mockRejectedValue(new Error('Double booking'));
    renderForm();

    await fillForm('inst1', 'client1', '10:00');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /add appointment/i }));
    });

    await waitFor(() => {
      expect(screen.getByText('Double booking')).toBeInTheDocument();
    });
  });

  it('should call onCancel when cancel button is clicked', async () => {
    renderForm();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    });

    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('should reset form after successful submission', async () => {
    mockedAddAppointment.mockResolvedValue('appt123');
    renderForm();

    await fillForm('inst1', 'client1', '10:00');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /add appointment/i }));
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/instructor/i)).toHaveValue('');
      expect(screen.getByLabelText(/client/i)).toHaveValue('');
      expect(screen.getByLabelText(/start time/i)).toHaveValue('');
    });
  });
});
