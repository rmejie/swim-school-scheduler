import { describe, it, expect } from 'vitest';
import {
  generateTimeSlots,
  getAvailableSlots,
  formatTimeDisplay,
  validateAppointmentTime,
  parseTimeString,
  generateBlockSlots,
  getAppointmentBlocks,
  checkBlockConflict,
  validateInstructorAvailability,
} from './timeSlots';

// Helper for test appointments
const booked = [
  { start: '10:00', end: '10:30' },
  { start: '12:15', end: '12:45' },
];

describe('generateTimeSlots', () => {
  it('should generate 15-minute increments from 8:00 to 20:00', () => {
    const slots = generateTimeSlots('08:00', '20:00', 15);
    expect(slots[0]).toBe('08:00');
    expect(slots[slots.length - 1]).toBe('20:00');
    expect(slots.length).toBe(49); // (12 hours * 4) + 1
  });
  it('should handle custom increments and edge cases', () => {
    expect(generateTimeSlots('23:00', '01:00', 30)).toEqual([
      '23:00', '23:30', '00:00', '00:30', '01:00',
    ]);
  });
});

describe('getAvailableSlots', () => {
  it('should exclude booked times with 5-minute buffer', () => {
    const slots = generateTimeSlots('10:00', '11:00', 15);
    const available = getAvailableSlots(slots, booked, 5);
    expect(available).not.toContain('10:00');
    expect(available).not.toContain('10:15');
    expect(available).toContain('10:45');
  });
  it('should handle no bookings', () => {
    const slots = generateTimeSlots('08:00', '09:00', 15);
    expect(getAvailableSlots(slots, [], 5)).toEqual(slots);
  });
});

describe('formatTimeDisplay', () => {
  it('should convert 24-hour to 12-hour format', () => {
    expect(formatTimeDisplay('13:15')).toBe('1:15 PM');
    expect(formatTimeDisplay('00:00')).toBe('12:00 AM');
    expect(formatTimeDisplay('12:00')).toBe('12:00 PM');
  });
  it('should handle invalid input gracefully', () => {
    expect(formatTimeDisplay('25:00')).toBe('Invalid time');
  });
});

describe('validateAppointmentTime', () => {
  it('should ensure time is within business hours and in the future', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0);
    expect(validateAppointmentTime(tomorrow, '08:00', '20:00')).toBe(true);
    const past = new Date(Date.now() - 60 * 60 * 1000);
    expect(validateAppointmentTime(past, '08:00', '20:00')).toBe(false);
  });
  it('should reject times outside business hours', () => {
    const date = new Date('2024-07-01T07:00:00');
    expect(validateAppointmentTime(date, '08:00', '20:00')).toBe(false);
  });
});

describe('parseTimeString', () => {
  it('should convert HH:MM to Date object (today)', () => {
    const d = parseTimeString('14:30');
    expect(d).toBeInstanceOf(Date);
    expect(d.getHours()).toBe(14);
    expect(d.getMinutes()).toBe(30);
  });
  it('should handle invalid formats', () => {
    expect(() => parseTimeString('bad')).toThrow();
    expect(() => parseTimeString('24:00')).toThrow();
  });
});

describe('generateBlockSlots', () => {
  it('should generate 20-minute blocks from 8:00 to 9:00', () => {
    expect(generateBlockSlots('08:00', '09:00')).toEqual([
      '08:00', '08:20', '08:40', '09:00',
    ]);
  });
  it('should generate blocks for a full day', () => {
    const slots = generateBlockSlots('08:00', '20:00');
    expect(slots[0]).toBe('08:00');
    expect(slots[slots.length - 1]).toBe('20:00');
    expect(slots.length).toBe(37); // (12 hours * 3) + 1
  });
});

describe('getAppointmentBlocks', () => {
  it('should return correct blocks for 1 block (20 minute) appointment', () => {
    expect(getAppointmentBlocks('10:00', 1)).toEqual(['10:00']);
  });
  it('should return correct blocks for 2 block (40 minute) appointment', () => {
    expect(getAppointmentBlocks('10:00', 2)).toEqual(['10:00', '10:20']);
    expect(getAppointmentBlocks('10:20', 2)).toEqual(['10:20', '10:40']);
  });
  it('should return correct blocks for 3 block (60 minute) appointment', () => {
    expect(getAppointmentBlocks('11:00', 3)).toEqual(['11:00', '11:20', '11:40']);
  });
  it('should allow back-to-back appointments without conflict', () => {
    // 10:00-10:20 and 10:20-10:40 should not conflict
    const appt1 = getAppointmentBlocks('10:00', 1); // ['10:00']
    const appt2 = getAppointmentBlocks('10:20', 1); // ['10:20']
    expect(checkBlockConflict(appt1, appt2)).toBe(false);
  });
  it('should detect conflicts when appointments overlap', () => {
    // 10:00-10:40 and 10:20-10:40 should conflict
    const appt1 = getAppointmentBlocks('10:00', 2); // ['10:00', '10:20']
    const appt2 = getAppointmentBlocks('10:20', 1); // ['10:20']
    expect(checkBlockConflict(appt1, appt2)).toBe(true);
  });
});

describe('checkBlockConflict', () => {
  it('should detect block conflicts when appointments overlap', () => {
    // 11:00-12:00 (60 min) vs 11:40-12:00 (20 min) - conflict at 11:40
    expect(checkBlockConflict(['11:00', '11:20', '11:40'], ['11:40'])).toBe(true);
    // 11:00-12:00 (60 min) vs 12:00-12:20 (20 min) - no conflict, back-to-back
    expect(checkBlockConflict(['11:00', '11:20', '11:40'], ['12:00'])).toBe(false);
    // 11:40-12:00 (20 min) vs 12:00-12:20 (20 min) - no conflict, back-to-back
    expect(checkBlockConflict(['11:40'], ['12:00'])).toBe(false);
  });
  it('should allow back-to-back appointments of same duration', () => {
    // 10:00-10:20 and 10:20-10:40 - no conflict
    expect(checkBlockConflict(['10:00'], ['10:20'])).toBe(false);
  });
  it('should detect conflicts when longer appointment overlaps shorter one', () => {
    // 10:00-11:00 (60 min) overlaps with 10:40-11:00 (20 min)
    expect(checkBlockConflict(['10:00', '10:20', '10:40'], ['10:40'])).toBe(true);
  });
});

describe('validateInstructorAvailability', () => {
  it('should validate all requested blocks are available', () => {
    // 10:00-10:40 requested but 10:00 is already occupied
    expect(validateInstructorAvailability(['10:00', '10:20'], ['09:40', '10:00'])).toBe(false);
    // 11:00-11:40 requested and all blocks available
    expect(validateInstructorAvailability(['11:00', '11:20'], ['10:00', '10:20'])).toBe(true);
    // 12:00-12:20 requested but 12:00 is occupied
    expect(validateInstructorAvailability(['12:00'], ['12:00', '12:20'])).toBe(false);
  });
  it('should allow back-to-back appointments', () => {
    // 10:00-10:20 and 10:20-10:40 can both exist
    expect(validateInstructorAvailability(['10:20'], ['10:00'])).toBe(true);
  });
}); 