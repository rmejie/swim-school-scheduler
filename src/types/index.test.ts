import { describe, it, expect } from 'vitest';
import type { Instructor, Client, Appointment } from './index';

import type { Timestamp } from 'firebase/firestore';

// Mock Firestore Timestamp for type checking
function mockTimestamp(): Timestamp {
  return {
    seconds: 0,
    nanoseconds: 0,
    toDate: () => new Date(),
    toMillis: () => 0,
    isEqual: () => true,
    toJSON: () => ({ seconds: 0, nanoseconds: 0, type: 'timestamp' }),
    valueOf: () => '',
  } as unknown as Timestamp;
}

describe('Instructor interface', () => {
  it('should require id, name, and createdAt fields', () => {
    const instructor: Instructor = {
      id: 'inst1',
      name: 'Jane Doe',
      createdAt: mockTimestamp(),
    };
    expect(instructor.id).toBeTypeOf('string');
    expect(instructor.name).toBeTypeOf('string');
    expect(instructor.createdAt).toBeDefined();
  });
});

describe('Client interface', () => {
  it('should require id, name, email, phone, and createdAt fields', () => {
    const client: Client = {
      id: 'client1',
      name: 'John Smith',
      email: 'john@example.com',
      phone: '555-1234',
      createdAt: mockTimestamp(),
    };
    expect(client.id).toBeTypeOf('string');
    expect(client.name).toBeTypeOf('string');
    expect(client.email).toBeTypeOf('string');
    expect(client.phone).toBeTypeOf('string');
    expect(client.createdAt).toBeDefined();
  });
});

describe('Appointment interface', () => {
  it('should handle both individual and recurring types', () => {
    const individual: Appointment = {
      id: 'appt1',
      instructorId: 'inst1',
      instructorName: 'Jane Doe',
      clientId: 'client1',
      clientName: 'John Smith',
      date: '2024-07-01',
      startTime: '10:00',
      endTime: '10:30',
      type: 'individual',
      status: 'scheduled',
      createdAt: mockTimestamp(),
    };
    const recurring: Appointment = {
      ...individual,
      id: 'appt2',
      type: 'recurring',
      recurringId: 'rec1',
    };
    expect(individual.type).toBe('individual');
    expect(recurring.type).toBe('recurring');
    expect(recurring.recurringId).toBeTypeOf('string');
  });

  it('should use Firestore Timestamp for createdAt and properly type date fields', () => {
    const appt: Appointment = {
      id: 'appt3',
      instructorId: 'inst1',
      instructorName: 'Jane Doe',
      clientId: 'client1',
      clientName: 'John Smith',
      date: '2024-07-01',
      startTime: '11:00',
      endTime: '11:30',
      type: 'individual',
      status: 'scheduled',
      createdAt: mockTimestamp(),
    };
    expect(appt.createdAt).toBeDefined();
    expect(typeof appt.date).toBe('string');
    expect(typeof appt.startTime).toBe('string');
    expect(typeof appt.endTime).toBe('string');
  });
}); 