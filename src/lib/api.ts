/**
 * HTTP client for the backend API.
 *
 * Uses relative URLs so the frontend works whether served from
 * the same FastAPI server or a separate Vite dev server with a proxy.
 */

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

/* ── Instructors ─────────────────────────────────────────── */

interface ApiInstructor {
  id: number;
  name: string;
  created_at: string;
}

export async function apiAddInstructor(data: { name: string }): Promise<string> {
  const row = await request<ApiInstructor>('/api/instructors', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return String(row.id);
}

export async function apiGetInstructors(): Promise<Array<{ id: string; name: string; createdAt: string }>> {
  const rows = await request<ApiInstructor[]>('/api/instructors');
  return rows.map(r => ({ id: String(r.id), name: r.name, createdAt: r.created_at }));
}

/* ── Clients ─────────────────────────────────────────────── */

interface ApiClient {
  id: number;
  name: string;
  email: string;
  phone: string;
  created_at: string;
}

export async function apiAddClient(data: { name: string; email: string; phone?: string }): Promise<string> {
  const row = await request<ApiClient>('/api/clients', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return String(row.id);
}

export async function apiGetClients(): Promise<Array<{ id: string; name: string; email: string; phone: string; createdAt: string }>> {
  const rows = await request<ApiClient[]>('/api/clients');
  return rows.map(r => ({ id: String(r.id), name: r.name, email: r.email, phone: r.phone, createdAt: r.created_at }));
}

/* ── Appointments ────────────────────────────────────────── */

interface ApiAppointment {
  id: number;
  instructor_id: number;
  instructor_name: string;
  client_id: number;
  client_name: string;
  date: string;
  start_time: string;
  end_time: string;
  appointment_type: string;
  blocks: string[];
  recurring_id: string | null;
  status: string;
  created_at: string;
}

function mapAppointment(a: ApiAppointment) {
  return {
    id: String(a.id),
    instructorId: String(a.instructor_id),
    instructorName: a.instructor_name,
    clientId: String(a.client_id),
    clientName: a.client_name,
    date: a.date,
    startTime: a.start_time,
    endTime: a.end_time,
    type: a.appointment_type as 'individual' | 'recurring',
    blocks: a.blocks,
    recurringId: a.recurring_id ?? undefined,
    status: a.status as 'scheduled' | 'cancelled',
    createdAt: a.created_at,
  };
}

export async function apiAddAppointment(data: {
  instructorId: string;
  instructorName?: string;
  clientId: string;
  clientName?: string;
  startTime: string;
  blockCount: number;
  date: string;
  type?: string;
}) {
  const body = {
    instructor_id: Number(data.instructorId),
    instructor_name: data.instructorName || '',
    client_id: Number(data.clientId),
    client_name: data.clientName || '',
    start_time: data.startTime,
    block_count: data.blockCount,
    date: data.date,
    appointment_type: data.type || 'individual',
  };
  const row = await request<ApiAppointment>('/api/appointments', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return mapAppointment(row);
}

export async function apiGetAppointmentsByDate(date: string) {
  const rows = await request<ApiAppointment[]>(`/api/appointments?date=${date}`);
  return rows.map(mapAppointment);
}

export async function apiCancelAppointment(id: string): Promise<void> {
  await request(`/api/appointments/${id}/cancel`, { method: 'PATCH' });
}
