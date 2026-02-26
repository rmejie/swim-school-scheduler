/**
 * Data access layer for the swim school scheduler.
 *
 * In production and dev, all calls go to the Python backend API.
 * In Vitest unit tests, this module is mocked (see src/test/setup.ts),
 * so the real API is never called during tests.
 */

import type { Instructor, Client, Appointment } from '../types';
import {
  apiAddInstructor, apiGetInstructors,
  apiAddClient, apiGetClients,
  apiAddAppointment, apiGetAppointmentsByDate, apiCancelAppointment,
} from './api';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Adds a new instructor.
 * @param data - Instructor data (name required, min 2 chars)
 * @returns The new instructor's ID
 */
export async function addInstructor(data: { name: string }): Promise<string> {
  if (!data.name || data.name.length < 2) throw new Error('Name required');
  return apiAddInstructor(data);
}

/**
 * Gets all instructors.
 * @returns Array of Instructor objects
 */
export async function getInstructors(): Promise<Instructor[]> {
  const rows = await apiGetInstructors();
  return rows.map(r => ({ ...r }));
}

/**
 * Adds a new client.
 * @param data - Client data (name, email required)
 * @returns The new client's ID
 */
export async function addClient(data: Partial<Client>): Promise<string> {
  if (!data.name || !data.email) throw new Error('Name and email required');
  if (!EMAIL_REGEX.test(data.email)) throw new Error('Invalid email format');
  return apiAddClient({ name: data.name, email: data.email, phone: data.phone });
}

/**
 * Gets all clients.
 * @returns Array of Client objects
 */
export async function getClients(): Promise<Client[]> {
  const rows = await apiGetClients();
  return rows.map(r => ({ ...r }));
}

/**
 * Adds an appointment, preventing double booking via the backend.
 * @param data - Appointment data (instructorId, startTime, blockCount, date required)
 * @returns The new appointment's ID
 */
export async function addAppointment(
  data: {
    instructorId: string; instructorName?: string;
    clientId?: string; clientName?: string;
    startTime: string; blockCount: number;
    date: string; type?: string;
  },
): Promise<string> {
  const result = await apiAddAppointment({
    ...data,
    clientId: data.clientId || '',
  });
  return result.id;
}

/**
 * Gets all appointments for a given date.
 * @param date - Date string (YYYY-MM-DD)
 * @returns Array of Appointment objects
 */
export async function getAppointmentsByDate(date: string): Promise<Appointment[]> {
  const rows = await apiGetAppointmentsByDate(date);
  return rows.map(r => ({ ...r }));
}

/**
 * Cancels an appointment by updating its status.
 * @param id - Appointment ID
 */
export async function cancelAppointment(id: string): Promise<void> {
  return apiCancelAppointment(id);
}

/**
 * Generates a weekly recurring appointment series.
 * @param data - Recurring appointment data
 * @returns Array of created appointment IDs
 */
export async function generateRecurringAppointments(data: {
  instructorId: string; startTime: string; blockCount: number;
  startDate: string; occurrences: number;
}): Promise<string[]> {
  const ids: string[] = [];
  const date = new Date(data.startDate);
  for (let i = 0; i < data.occurrences; i++) {
    const id = await addAppointment({
      instructorId: data.instructorId,
      startTime: data.startTime,
      blockCount: data.blockCount,
      date: date.toISOString().slice(0, 10),
    });
    ids.push(id);
    date.setDate(date.getDate() + 7);
  }
  return ids;
}
