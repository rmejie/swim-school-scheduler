import type { Timestamp } from 'firebase/firestore';

/**
 * Represents a swim instructor.
 *
 * @property id - Unique identifier for the instructor
 * @property name - Full name of the instructor
 * @property createdAt - Firestore Timestamp when the instructor was created
 *
 * @example
 * const instructor: Instructor = {
 *   id: 'inst1',
 *   name: 'Jane Doe',
 *   createdAt: Timestamp.now(),
 * };
 */
export interface Instructor {
  id: string;
  name: string;
  createdAt: Timestamp;
}

/**
 * Represents a swim school client.
 *
 * @property id - Unique identifier for the client
 * @property name - Full name of the client
 * @property email - Email address of the client
 * @property phone - Phone number of the client
 * @property createdAt - Firestore Timestamp when the client was created
 *
 * @example
 * const client: Client = {
 *   id: 'client1',
 *   name: 'John Smith',
 *   email: 'john@example.com',
 *   phone: '555-1234',
 *   createdAt: Timestamp.now(),
 * };
 */
export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: Timestamp;
}

/**
 * Represents a swim lesson appointment.
 *
 * @property id - Unique identifier for the appointment
 * @property instructorId - ID of the assigned instructor
 * @property instructorName - Name of the assigned instructor
 * @property clientId - ID of the client
 * @property clientName - Name of the client
 * @property date - Appointment date in YYYY-MM-DD format
 * @property startTime - Start time in HH:MM (24-hour) format
 * @property endTime - End time in HH:MM (24-hour) format
 * @property type - 'individual' or 'recurring'
 * @property recurringId - (Optional) ID for recurring series
 * @property blocks - (Optional) Array of 20-minute block start times occupied by this appointment
 * @property status - 'scheduled' or 'cancelled'
 * @property createdAt - Firestore Timestamp when the appointment was created
 *
 * @example
 * const appointment: Appointment = {
 *   id: 'appt1',
 *   instructorId: 'inst1',
 *   instructorName: 'Jane Doe',
 *   clientId: 'client1',
 *   clientName: 'John Smith',
 *   date: '2024-07-01',
 *   startTime: '10:00',
 *   endTime: '10:30',
 *   type: 'individual',
 *   status: 'scheduled',
 *   createdAt: Timestamp.now(),
 * };
 */
export interface Appointment {
  id: string;
  instructorId: string;
  instructorName: string;
  clientId: string;
  clientName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  type: 'individual' | 'recurring';
  recurringId?: string;
  blocks?: string[];
  status: 'scheduled' | 'cancelled';
  createdAt: Timestamp;
} 