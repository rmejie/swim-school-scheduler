import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as firestoreUtils from './firestore';
import { getAppointmentBlocks } from '../utils/timeSlots';
import * as firestore from 'firebase/firestore';

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  collection: (_db: unknown, name: string) => name,
  addDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  updateDoc: vi.fn(),
  doc: vi.fn(),
  Timestamp: { now: () => ({ seconds: 0, nanoseconds: 0, toDate: () => new Date(), toMillis: () => 0, isEqual: () => true, toJSON: () => ({}) }) },
}));

// Mock db import
vi.mock('./firebase', () => ({ db: {} }));

const mockedAddDoc = firestore.addDoc as unknown as ReturnType<typeof vi.fn>;
const mockedGetDocs = firestore.getDocs as unknown as ReturnType<typeof vi.fn>;
const mockedUpdateDoc = firestore.updateDoc as unknown as ReturnType<typeof vi.fn>;

describe('firestore utilities', () => {
  const mockTimestamp = { seconds: 0, nanoseconds: 0, toDate: () => new Date(), toMillis: () => 0, isEqual: () => true, toJSON: () => ({}) };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetDocs.mockImplementation((col) => {
      if (col === 'appointments') {
        return Promise.resolve({
          docs: [
            { id: 'appt1', data: () => ({ date: '2024-07-01', instructorId: 'inst1', blocks: ['10:00'] }) },
            { id: 'appt2', data: () => ({ date: '2024-07-01', instructorId: 'inst2', blocks: ['11:00'] }) },
          ]
        });
      }
      if (col === 'clients') {
        return Promise.resolve({
          docs: [
            { id: 'client1', data: () => ({ name: 'John', email: 'j@e.com', phone: '555', createdAt: mockTimestamp }) }
          ]
        });
      }
      if (col === 'instructors') {
        return Promise.resolve({ docs: [
          { id: 'inst1', data: () => ({ name: 'Jane Doe', createdAt: mockTimestamp }) },
        ] });
      }
      return Promise.resolve({ docs: [] });
    });
  });

  it('addInstructor: should add instructor and return id', async () => {
    mockedAddDoc.mockResolvedValue({ id: 'inst1' });
    const result = await firestoreUtils.addInstructor({ name: 'Jane Doe' });
    expect(result).toBe('inst1');
    expect(mockedAddDoc).toHaveBeenCalled();
  });

  it('addInstructor: should handle errors', async () => {
    mockedAddDoc.mockRejectedValue(new Error('fail'));
    await expect(firestoreUtils.addInstructor({ name: 'Jane Doe' })).rejects.toThrow('fail');
  });

  it('getInstructors: should return array of instructors', async () => {
    const result = await firestoreUtils.getInstructors();
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].id).toBe('inst1');
  });

  it('getInstructors: should handle empty collection', async () => {
    mockedGetDocs.mockResolvedValue({ docs: [] });
    const result = await firestoreUtils.getInstructors();
    expect(result).toEqual([]);
  });

  it('addClient: should validate required fields and add client', async () => {
    mockedAddDoc.mockResolvedValue({ id: 'client1' });
    const result = await firestoreUtils.addClient({ name: 'John', email: 'j@e.com', phone: '555' });
    expect(result).toBe('client1');
  });

  it('addClient: should throw if required fields missing', async () => {
    await expect(firestoreUtils.addClient({ name: '', email: '' })).rejects.toThrow();
  });

  it('getClients: should return array of clients', async () => {
    const result = await firestoreUtils.getClients();
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].id).toBe('client1');
  });

  it('addAppointment: should prevent double booking using block logic', async () => {
    // Simulate existing appointments occupying blocks
    const startTime = '10:00';
    const blockCount = 2;
    const date = '2024-07-01';
    getAppointmentBlocks(startTime, blockCount);
    await expect(
      firestoreUtils.addAppointment({ instructorId: 'inst1', startTime, blockCount, date })
    ).rejects.toThrow('Double booking');
  });

  it('addAppointment: should add appointment if no conflict', async () => {
    // No need to spy on getAppointmentsByInstructor; real logic will use Firestore mock
    mockedAddDoc.mockResolvedValue({ id: 'appt3' });
    const result = await firestoreUtils.addAppointment({ instructorId: 'inst1', startTime: '12:00', blockCount: 2, date: '2024-07-01' });
    expect(result).toBe('appt3');
  });

  it('getAppointmentsByDate: should filter appointments by date', async () => {
    mockedGetDocs.mockResolvedValue({ docs: [
      { id: 'appt1', data: () => ({ date: '2024-07-01', instructorId: 'inst1' }) },
      { id: 'appt2', data: () => ({ date: '2024-07-02', instructorId: 'inst2' }) },
    ] });
    const result = await firestoreUtils.getAppointmentsByDate('2024-07-01');
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('appt1');
  });

  it('getAppointmentsByInstructor: should filter by instructor and date', async () => {
    const instructorId = 'inst1';
    const date = '2024-07-01';
    const result = await firestoreUtils.getAppointmentsByInstructor(instructorId, date);
    expect(result.length).toBe(1);
    expect(result[0].instructorId).toBe(instructorId);
    expect(result[0].date).toBe(date);
  });

  it('cancelAppointment: should update status to cancelled', async () => {
    mockedUpdateDoc.mockResolvedValue(undefined);
    await expect(firestoreUtils.cancelAppointment('appt1')).resolves.toBeUndefined();
    expect(mockedUpdateDoc).toHaveBeenCalled();
  });

  it('generateRecurringAppointments: should create weekly series', async () => {
    mockedGetDocs.mockImplementation((col) => {
      if (col === 'appointments') {
        return Promise.resolve({ docs: [] }); // No existing appointments, so no double booking
      }
      return Promise.resolve({ docs: [] });
    });
    mockedAddDoc.mockResolvedValue({ id: 'apptX' });
    const result = await firestoreUtils.generateRecurringAppointments({
      instructorId: 'inst1',
      startTime: '10:00',
      blockCount: 1,
      startDate: '2024-07-01',
      occurrences: 3,
    });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(3);
  });
}); 