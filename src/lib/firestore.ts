import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Instructor, Client, Appointment } from '../types';
import { getAppointmentBlocks, checkBlockConflict } from '../utils/timeSlots';

/**
 * Adds a new instructor to Firestore.
 * @param data - Instructor data (name required)
 * @returns The new instructor's ID
 * @throws Error if add fails
 */
// Fallback/mock for addInstructor in the browser demo
function browserAddInstructor(data: { name: string }): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!data.name || data.name.length < 2) return reject(new Error('Name required'));
    setTimeout(() => resolve('demo-' + Math.random().toString(36).slice(2, 8)), 800);
  });
}

// Use real Firestore in browser when explicitly enabled via env flag or always in test (no window)
const useRealFirestoreInBrowser = import.meta.env?.VITE_USE_FIRESTORE === 'true';

export async function addInstructor(data: { name: string }): Promise<string> {
  // In browser runtime, use mock unless explicitly enabled. In tests, always use real.
  const isTest = import.meta.env?.MODE === 'test';
  if (typeof window !== 'undefined' && !useRealFirestoreInBrowser && !isTest) {
    return browserAddInstructor(data);
  }
  if (!data.name || data.name.length < 2) throw new Error('Name required');
  const docRef = await addDoc(collection(db, 'instructors'), {
    name: data.name,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

/**
 * Gets all instructors from Firestore.
 * @returns Array of Instructor objects
 */
export async function getInstructors(): Promise<Instructor[]> {
  const snap = await getDocs(collection(db, 'instructors'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Instructor[];
}

// Fallback/mock for addClient in the browser demo
const browserClients: Array<{ id: string; name: string; email: string; phone: string }> = [];

function browserAddClient(data: Partial<Client>): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!data.name || data.name.length < 2) return reject(new Error('Name required'));
    if (!data.email) return reject(new Error('Email required'));
    const id = 'demo-' + Math.random().toString(36).slice(2, 8);
    browserClients.push({ id, name: data.name, email: data.email, phone: data.phone || '' });
    setTimeout(() => resolve(id), 800);
  });
}

function browserGetClients(): Promise<Client[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(browserClients.map(c => ({ ...c, createdAt: {} as Client['createdAt'] }))), 300);
  });
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Adds a new client to Firestore.
 * @param data - Client data (name, email required)
 * @returns The new client's ID
 * @throws Error if validation fails
 */
export async function addClient(data: Partial<Client>): Promise<string> {
  if (!data.name || !data.email) throw new Error('Name and email required');
  if (!EMAIL_REGEX.test(data.email)) throw new Error('Invalid email format');
  const isTest = import.meta.env?.MODE === 'test';
  if (typeof window !== 'undefined' && !useRealFirestoreInBrowser && !isTest) {
    return browserAddClient(data);
  }
  const docRef = await addDoc(collection(db, 'clients'), {
    name: data.name,
    email: data.email,
    phone: data.phone || '',
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

/**
 * Gets all clients from Firestore.
 * @returns Array of Client objects
 */
export async function getClients(): Promise<Client[]> {
  const isTest = import.meta.env?.MODE === 'test';
  if (typeof window !== 'undefined' && !useRealFirestoreInBrowser && !isTest) {
    return browserGetClients();
  }
  const snap = await getDocs(collection(db, 'clients'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Client[];
}

/**
 * Adds an appointment, preventing double booking using block logic.
 * @param data - Appointment data (must include instructorId, startTime, blockCount)
 * @returns The new appointment's ID
 * @throws Error if double booking detected
 */
export async function addAppointment(data: Partial<Appointment> & { instructorId: string; startTime: string; blockCount: number; date: string }): Promise<string> {
  const existing = await getAppointmentsByInstructor(data.instructorId, data.date);
  const requestedBlocks = getAppointmentBlocks(data.startTime, data.blockCount);
  for (const appt of existing) {
    if (appt.blocks && checkBlockConflict(requestedBlocks, appt.blocks)) {
      throw new Error('Double booking');
    }
  }
  const docRef = await addDoc(collection(db, 'appointments'), {
    ...data,
    blocks: requestedBlocks,
    createdAt: Timestamp.now(),
    status: 'scheduled',
  });
  return docRef.id;
}

/**
 * Gets all appointments for a given date.
 * @param date - Date string (YYYY-MM-DD)
 * @returns Array of Appointment objects
 */
export async function getAppointmentsByDate(date: string): Promise<Appointment[]> {
  const snap = await getDocs(collection(db, 'appointments'));
  const all = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Appointment[];
  return all.filter(a => a.date === date);
}

/**
 * Gets all appointments for an instructor on a given date.
 * @param instructorId - Instructor ID
 * @param date - Date string (YYYY-MM-DD)
 * @returns Array of Appointment objects
 */
export async function getAppointmentsByInstructor(instructorId: string, date: string): Promise<Appointment[]> {
  const snap = await getDocs(collection(db, 'appointments'));
  const all = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Appointment[];
  return all.filter(a => a.instructorId === instructorId && a.date === date);
}

/**
 * Cancels an appointment by updating its status.
 * @param id - Appointment ID
 * @returns void
 */
export async function cancelAppointment(id: string): Promise<void> {
  await updateDoc(doc(db, 'appointments', id), { status: 'cancelled' });
}

/**
 * Generates a weekly recurring appointment series.
 * @param data - Recurring appointment data (startDate, occurrences, etc.)
 * @returns Array of created appointment IDs
 */
export async function generateRecurringAppointments(data: { instructorId: string; startTime: string; blockCount: number; startDate: string; occurrences: number }): Promise<string[]> {
  const ids: string[] = [];
  const date = new Date(data.startDate);
  for (let i = 0; i < data.occurrences; i++) {
    const apptData = {
      instructorId: data.instructorId,
      startTime: data.startTime,
      blockCount: data.blockCount,
      date: date.toISOString().slice(0, 10),
    };
    const id = await addAppointment(apptData);
    ids.push(id);
    date.setDate(date.getDate() + 7);
  }
  return ids;
} 