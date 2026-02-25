/**
 * Generates an array of time slots in HH:MM format.
 *
 * @param start - Start time in HH:MM (24-hour)
 * @param end - End time in HH:MM (24-hour)
 * @param increment - Minutes between slots
 * @returns Array of time slot strings
 *
 * @example
 * generateTimeSlots('08:00', '11:00', 15) // ['08:00', '08:20', '08:40', '09:00', '09:20', '09:40', '10:00', '10:40', '11:00']
 */
export function generateTimeSlots(start: string, end: string, increment: number): string[] {
  const slots: string[] = [];
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const startMins = sh * 60 + sm;
  let endMins = eh * 60 + em;
  if (endMins < startMins) endMins += 24 * 60;
  for (let mins = startMins; mins <= endMins; mins += increment) {
    const h = Math.floor((mins % (24 * 60)) / 60);
    const m = mins % 60;
    slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
  }
  return slots;
}

/**
 * Returns available slots, excluding those overlapping with bookings (with buffer).
 *
 * @param slots - Array of slot strings
 * @param bookings - Array of { start, end } objects
 * @param buffer - Buffer in minutes
 * @returns Array of available slot strings
 *
 * @example
 * getAvailableSlots(['10:00','10:15','10:30'], [{start:'10:00',end:'10:30'}], 5)
 */
export function getAvailableSlots(slots: string[], bookings: { start: string; end: string }[], buffer: number): string[] {
  return slots.filter(slot => {
    return !bookings.some(b =>
      checkTimeOverlap(slot, slot, b.start, b.end, buffer)
    );
  });
}

/**
 * Checks if two time ranges overlap, applying a buffer only after the end of each appointment.
 * The next appointment cannot start until after the previous appointment's buffer.
 * Handles overnight (spanning midnight).
 *
 * @param startA - Start time of first range (HH:MM)
 * @param endA - End time of first range (HH:MM)
 * @param startB - Start time of second range (HH:MM)
 * @param endB - End time of second range (HH:MM)
 * @param buffer - Buffer in minutes (applied only after each appointment)
 * @returns True if ranges overlap (including buffer after each)
 *
 * @example
 * checkTimeOverlap('13:00','13:15','13:20','13:35',5) // false
 */
export function checkTimeOverlap(startA: string, endA: string, startB: string, endB: string, buffer: number): boolean {
  const toMins = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const sA = toMins(startA);
  const eA = toMins(endA) + buffer;
  const sB = toMins(startB);
  const eB = toMins(endB);

  // Helper to check overlap for a single day
  const overlap = (aStart: number, aEnd: number, bStart: number, bEnd: number) =>
    aStart < bEnd && bStart < aEnd;

  // Handle overnight for both ranges
  const ranges = (s: number, e: number) => e < s ? [[s, 1440], [0, e]] : [[s, e]];
  const aRanges = ranges(sA, eA);
  const bRanges = ranges(sB, eB);

  // Check all combinations of split ranges
  for (const [aStart, aEnd] of aRanges) {
    for (const [bStart, bEnd] of bRanges) {
      if (overlap(aStart, aEnd, bStart, bEnd)) return true;
    }
  }
  return false;
}

/**
 * Formats a 24-hour time string as 12-hour AM/PM.
 *
 * @param time - Time in HH:MM
 * @returns Formatted time string
 *
 * @example
 * formatTimeDisplay('13:15') // '1:15 PM'
 */
export function formatTimeDisplay(time: string): string {
  const [h, m] = time.split(':').map(Number);
  if (isNaN(h) || isNaN(m) || h > 23 || m > 59) return 'Invalid time';
  const hour = h % 12 === 0 ? 12 : h % 12;
  const ampm = h < 12 ? 'AM' : 'PM';
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

/**
 * Validates that a date is within business hours and in the future.
 *
 * @param date - Date object
 * @param open - Opening time (HH:MM)
 * @param close - Closing time (HH:MM)
 * @returns True if valid
 *
 * @example
 * validateAppointmentTime(new Date('2024-07-01T09:00:00'), '08:00', '20:00') // true
 */
export function validateAppointmentTime(date: Date, open: string, close: string): boolean {
  const now = new Date();
  if (date <= now) return false;
  const h = date.getHours();
  const m = date.getMinutes();
  const mins = h * 60 + m;
  const [oh, om] = open.split(':').map(Number);
  const [ch, cm] = close.split(':').map(Number);
  const openMins = oh * 60 + om;
  let closeMins = ch * 60 + cm;
  if (closeMins < openMins) closeMins += 24 * 60;
  return mins >= openMins && mins <= closeMins;
}

/**
 * Parses a time string (HH:MM) into a Date object (today).
 *
 * @param time - Time string
 * @returns Date object
 * @throws If format is invalid
 *
 * @example
 * parseTimeString('14:30') // Date with today at 14:30
 */
export function parseTimeString(time: string): Date {
  const [h, m] = time.split(':').map(Number);
  if (
    typeof h !== 'number' || typeof m !== 'number' ||
    isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59
  ) throw new Error('Invalid time format');
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

/**
 * Generates 20-minute block slots for a day, starting at :00, :20, or :40.
 *
 * @param start - Start time in HH:MM (default '08:00')
 * @param end - End time in HH:MM (default '20:00')
 * @returns Array of block start times (e.g., ['08:00', '08:20', ...])
 *
 * @example
 * generateBlockSlots('08:00', '09:00') // ['08:00', '08:20', '08:40', '09:00']
 */
export function generateBlockSlots(start: string = '08:00', end: string = '20:00'): string[] {
  const slots: string[] = [];
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;
  for (let mins = startMins; mins <= endMins; mins += 20) {
    const h = Math.floor((mins % (24 * 60)) / 60);
    const m = mins % 60;
    slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
  }
  return slots;
}

/**
 * Returns the block start times occupied by an appointment.
 * All blocks within the appointment duration are reserved.
 * No buffer time - appointments can be back-to-back.
 *
 * @param start - Appointment start time (HH:MM)
 * @param blockCount - Number of consecutive blocks (1 = 20min, 2 = 40min, 3 = 60min)
 * @returns Array of block start times that are occupied
 *
 * @example
 * getAppointmentBlocks('10:00', 1) // ['10:00'] - 20 minute appointment
 * getAppointmentBlocks('10:00', 2) // ['10:00', '10:20'] - 40 minute appointment
 * getAppointmentBlocks('10:00', 3) // ['10:00', '10:20', '10:40'] - 60 minute appointment
 */
export function getAppointmentBlocks(start: string, blockCount: number): string[] {
  const blocks: string[] = [];
  const [h, m] = start.split(':').map(Number);
  let mins = h * 60 + m;
  for (let i = 0; i < blockCount; i++) {
    const blockH = Math.floor((mins % (24 * 60)) / 60);
    const blockM = mins % 60;
    blocks.push(`${blockH.toString().padStart(2, '0')}:${blockM.toString().padStart(2, '0')}`);
    mins += 20;
  }
  return blocks;
}

/**
 * Checks if two appointments conflict based on reserved blocks.
 *
 * @param blocksA - Array of block start times for appointment A
 * @param blocksB - Array of block start times for appointment B
 * @returns True if any block overlaps
 *
 * @example
 * checkBlockConflict(['10:00', '10:20'], ['10:20', '10:40']) // true
 */
export function checkBlockConflict(blocksA: string[], blocksB: string[]): boolean {
  return blocksA.some(block => blocksB.includes(block));
}

/**
 * Validates instructor availability for a set of requested blocks.
 *
 * @param requestedBlocks - Array of requested block start times
 * @param occupiedBlocks - Array of all occupied block start times for the instructor
 * @returns True if all requested blocks are available
 *
 * @example
 * validateInstructorAvailability(['10:00', '10:20'], ['09:40', '10:00']) // false
 */
export function validateInstructorAvailability(requestedBlocks: string[], occupiedBlocks: string[]): boolean {
  return requestedBlocks.every(block => !occupiedBlocks.includes(block));
} 