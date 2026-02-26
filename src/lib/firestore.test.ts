import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as firestoreUtils from './firestore';

vi.mock('./api', () => ({
  apiAddInstructor: vi.fn(),
  apiGetInstructors: vi.fn(),
  apiAddClient: vi.fn(),
  apiGetClients: vi.fn(),
  apiAddAppointment: vi.fn(),
  apiGetAppointmentsByDate: vi.fn(),
  apiCancelAppointment: vi.fn(),
}));

import {
  apiAddInstructor, apiGetInstructors,
  apiAddClient, apiGetClients,
  apiAddAppointment, apiGetAppointmentsByDate, apiCancelAppointment,
} from './api';

const mockedAddInstructor = apiAddInstructor as unknown as ReturnType<typeof vi.fn>;
const mockedGetInstructors = apiGetInstructors as unknown as ReturnType<typeof vi.fn>;
const mockedAddClient = apiAddClient as unknown as ReturnType<typeof vi.fn>;
const mockedGetClients = apiGetClients as unknown as ReturnType<typeof vi.fn>;
const mockedAddAppointment = apiAddAppointment as unknown as ReturnType<typeof vi.fn>;
const mockedGetAppointmentsByDate = apiGetAppointmentsByDate as unknown as ReturnType<typeof vi.fn>;
const mockedCancelAppointment = apiCancelAppointment as unknown as ReturnType<typeof vi.fn>;

describe('firestore (API-backed) utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('addInstructor: should call the API and return id', async () => {
    mockedAddInstructor.mockResolvedValue('inst1');
    const result = await firestoreUtils.addInstructor({ name: 'Jane Doe' });
    expect(result).toBe('inst1');
    expect(mockedAddInstructor).toHaveBeenCalledWith({ name: 'Jane Doe' });
  });

  it('addInstructor: should reject short names before calling API', async () => {
    await expect(firestoreUtils.addInstructor({ name: 'J' })).rejects.toThrow('Name required');
    expect(mockedAddInstructor).not.toHaveBeenCalled();
  });

  it('addInstructor: should propagate API errors', async () => {
    mockedAddInstructor.mockRejectedValue(new Error('Network error'));
    await expect(firestoreUtils.addInstructor({ name: 'Jane Doe' })).rejects.toThrow('Network error');
  });

  it('getInstructors: should return array of instructors', async () => {
    mockedGetInstructors.mockResolvedValue([
      { id: '1', name: 'Jane Doe', createdAt: '2024-01-01T00:00:00Z' },
    ]);
    const result = await firestoreUtils.getInstructors();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
    expect(result[0].name).toBe('Jane Doe');
  });

  it('getInstructors: should handle empty list', async () => {
    mockedGetInstructors.mockResolvedValue([]);
    const result = await firestoreUtils.getInstructors();
    expect(result).toEqual([]);
  });

  it('addClient: should validate and call the API', async () => {
    mockedAddClient.mockResolvedValue('c1');
    const result = await firestoreUtils.addClient({ name: 'John', email: 'j@e.com', phone: '555' });
    expect(result).toBe('c1');
    expect(mockedAddClient).toHaveBeenCalledWith({ name: 'John', email: 'j@e.com', phone: '555' });
  });

  it('addClient: should throw if required fields missing', async () => {
    await expect(firestoreUtils.addClient({ name: '', email: '' })).rejects.toThrow('Name and email required');
    expect(mockedAddClient).not.toHaveBeenCalled();
  });

  it('addClient: should throw on invalid email', async () => {
    await expect(firestoreUtils.addClient({ name: 'John', email: 'not-email' })).rejects.toThrow('Invalid email format');
    expect(mockedAddClient).not.toHaveBeenCalled();
  });

  it('getClients: should return array of clients', async () => {
    mockedGetClients.mockResolvedValue([
      { id: '1', name: 'John', email: 'j@e.com', phone: '555', createdAt: '2024-01-01T00:00:00Z' },
    ]);
    const result = await firestoreUtils.getClients();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('John');
  });

  it('addAppointment: should call the API and return the id', async () => {
    mockedAddAppointment.mockResolvedValue({ id: 'appt1' });
    const result = await firestoreUtils.addAppointment({
      instructorId: 'inst1', startTime: '10:00', blockCount: 2, date: '2024-07-01',
    });
    expect(result).toBe('appt1');
  });

  it('addAppointment: should propagate double-booking errors', async () => {
    mockedAddAppointment.mockRejectedValue(new Error('Double booking'));
    await expect(
      firestoreUtils.addAppointment({ instructorId: 'inst1', startTime: '10:00', blockCount: 2, date: '2024-07-01' }),
    ).rejects.toThrow('Double booking');
  });

  it('getAppointmentsByDate: should return filtered appointments', async () => {
    mockedGetAppointmentsByDate.mockResolvedValue([
      { id: 'a1', instructorId: 'inst1', instructorName: 'A', clientId: 'c1', clientName: 'B', date: '2024-07-01', startTime: '10:00', endTime: '10:20', type: 'individual', blocks: ['10:00'], status: 'scheduled', createdAt: '2024-01-01T00:00:00Z' },
    ]);
    const result = await firestoreUtils.getAppointmentsByDate('2024-07-01');
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2024-07-01');
  });

  it('cancelAppointment: should call the API', async () => {
    mockedCancelAppointment.mockResolvedValue(undefined);
    await expect(firestoreUtils.cancelAppointment('appt1')).resolves.toBeUndefined();
    expect(mockedCancelAppointment).toHaveBeenCalledWith('appt1');
  });

  it('generateRecurringAppointments: should create weekly series', async () => {
    let callCount = 0;
    mockedAddAppointment.mockImplementation(() => {
      callCount++;
      return Promise.resolve({ id: `appt${callCount}` });
    });
    const result = await firestoreUtils.generateRecurringAppointments({
      instructorId: 'inst1',
      startTime: '10:00',
      blockCount: 1,
      startDate: '2024-07-01',
      occurrences: 3,
    });
    expect(result).toEqual(['appt1', 'appt2', 'appt3']);
    expect(mockedAddAppointment).toHaveBeenCalledTimes(3);
  });
});
