/**
 * Represents a swim instructor.
 *
 * @property id - Unique identifier for the instructor
 * @property name - Full name of the instructor
 * @property createdAt - ISO 8601 timestamp string
 */
export interface Instructor {
  id: string;
  name: string;
  createdAt: string;
}

/**
 * Represents a swim school client.
 *
 * @property id - Unique identifier for the client
 * @property name - Full name of the client
 * @property email - Email address of the client
 * @property phone - Phone number of the client
 * @property createdAt - ISO 8601 timestamp string
 */
export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
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
 * @property blocks - (Optional) Array of 20-minute block start times
 * @property status - 'scheduled' or 'cancelled'
 * @property createdAt - ISO 8601 timestamp string
 */
export interface Appointment {
  id: string;
  instructorId: string;
  instructorName: string;
  clientId: string;
  clientName: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'individual' | 'recurring';
  recurringId?: string;
  blocks?: string[];
  status: 'scheduled' | 'cancelled';
  createdAt: string;
}
