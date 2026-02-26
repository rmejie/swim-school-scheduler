import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AppointmentList from './AppointmentList';
import type { Appointment } from '../types';

const makeAppointment = (overrides: Partial<Appointment> = {}): Appointment => ({
  id: 'appt1',
  instructorId: 'inst1',
  instructorName: 'Sarah Johnson',
  clientId: 'client1',
  clientName: 'John Smith',
  date: '2024-07-15',
  startTime: '10:00',
  endTime: '10:40',
  type: 'individual',
  blocks: ['10:00', '10:20'],
  status: 'scheduled',
  createdAt: '2024-07-15T00:00:00Z',
  ...overrides,
});

describe('AppointmentList', () => {
  const defaultProps = {
    appointments: [] as Appointment[],
    loading: false,
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading state', () => {
    render(<AppointmentList {...defaultProps} loading={true} />);
    expect(screen.getByText(/loading appointments/i)).toBeInTheDocument();
  });

  it('should show empty state when no appointments', () => {
    render(<AppointmentList {...defaultProps} />);
    expect(screen.getByText(/no appointments for this date/i)).toBeInTheDocument();
  });

  it('should display appointment rows', () => {
    const appointments = [
      makeAppointment(),
      makeAppointment({ id: 'appt2', clientName: 'Jane Doe', startTime: '11:00', endTime: '11:20', blocks: ['11:00'] }),
    ];
    render(<AppointmentList {...defaultProps} appointments={appointments} />);

    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getAllByText('Sarah Johnson')).toHaveLength(2);
  });

  it('should format time in AM/PM', () => {
    const appointments = [makeAppointment({ startTime: '14:00' })];
    render(<AppointmentList {...defaultProps} appointments={appointments} />);

    expect(screen.getByText('2:00 PM')).toBeInTheDocument();
  });

  it('should show cancel button only for scheduled appointments', () => {
    const appointments = [
      makeAppointment(),
      makeAppointment({ id: 'appt2', status: 'cancelled', startTime: '11:00' }),
    ];
    render(<AppointmentList {...defaultProps} appointments={appointments} />);

    const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
    expect(cancelButtons).toHaveLength(1);
  });

  it('should call onCancel with appointment id', () => {
    const onCancel = vi.fn();
    const appointments = [makeAppointment()];
    render(<AppointmentList {...defaultProps} appointments={appointments} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledWith('appt1');
  });

  it('should sort appointments by start time', () => {
    const appointments = [
      makeAppointment({ id: 'appt2', startTime: '14:00', clientName: 'Late Client' }),
      makeAppointment({ id: 'appt1', startTime: '09:00', clientName: 'Early Client' }),
    ];
    render(<AppointmentList {...defaultProps} appointments={appointments} />);

    const rows = screen.getAllByRole('row');
    // First data row (index 1, after header) should be Early Client
    expect(rows[1]).toHaveTextContent('Early Client');
    expect(rows[2]).toHaveTextContent('Late Client');
  });

  it('should display duration from blocks', () => {
    const appointments = [makeAppointment({ blocks: ['10:00', '10:20', '10:40'] })];
    render(<AppointmentList {...defaultProps} appointments={appointments} />);

    expect(screen.getByText('60 min')).toBeInTheDocument();
  });
});
