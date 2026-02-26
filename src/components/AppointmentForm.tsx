import React, { useState } from 'react';
import { addAppointment } from '../lib/firestore';
import { generateBlockSlots } from '../utils/timeSlots';
import type { Appointment } from '../types';

export interface AppointmentFormProps {
  instructors: Array<{ id: string; name: string }>;
  clients: Array<{ id: string; name: string }>;
  selectedDate: string;
  onSuccess: (appointment: Appointment) => void;
  onCancel: () => void;
}

interface FormErrors {
  instructorId?: string;
  clientId?: string;
  startTime?: string;
}

const DURATION_OPTIONS = [
  { label: '20 minutes', blocks: 1 },
  { label: '40 minutes', blocks: 2 },
  { label: '60 minutes', blocks: 3 },
];

const timeSlots = generateBlockSlots('08:00', '20:00');

const AppointmentForm: React.FC<AppointmentFormProps> = ({ instructors, clients, selectedDate, onSuccess, onCancel }) => {
  const [instructorId, setInstructorId] = useState('');
  const [clientId, setClientId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [blockCount, setBlockCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!instructorId) newErrors.instructorId = 'Instructor is required';
    if (!clientId) newErrors.clientId = 'Client is required';
    if (!startTime) newErrors.startTime = 'Start time is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!validateForm()) return;

    setLoading(true);

    try {
      const instructor = instructors.find(i => i.id === instructorId);
      const client = clients.find(c => c.id === clientId);

      const appointmentId = await addAppointment({
        instructorId,
        instructorName: instructor?.name || '',
        clientId,
        clientName: client?.name || '',
        date: selectedDate,
        startTime,
        blockCount,
        type: 'individual',
      });

      const blocks: string[] = [];
      const [h, m] = startTime.split(':').map(Number);
      let mins = h * 60 + m;
      for (let i = 0; i < blockCount; i++) {
        const bH = Math.floor((mins % (24 * 60)) / 60);
        const bM = mins % 60;
        blocks.push(`${bH.toString().padStart(2, '0')}:${bM.toString().padStart(2, '0')}`);
        mins += 20;
      }
      const lastBlockMins = mins;
      const endTime = `${Math.floor(lastBlockMins / 60).toString().padStart(2, '0')}:${(lastBlockMins % 60).toString().padStart(2, '0')}`;

      const appointment: Appointment = {
        id: appointmentId,
        instructorId,
        instructorName: instructor?.name || '',
        clientId,
        clientName: client?.name || '',
        date: selectedDate,
        startTime,
        endTime,
        type: 'individual',
        blocks,
        status: 'scheduled',
        createdAt: {} as Appointment['createdAt'],
      };

      setSuccess(true);
      setInstructorId('');
      setClientId('');
      setStartTime('');
      setBlockCount(1);
      setErrors({});
      onSuccess(appointment);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Appointment</h2>

      <form onSubmit={handleSubmit} className="space-y-4" role="form" noValidate>
        <div>
          <label htmlFor="appointment-instructor" className="block text-sm font-medium text-gray-700 mb-2">
            Instructor
          </label>
          <select
            id="appointment-instructor"
            value={instructorId}
            onChange={(e) => setInstructorId(e.target.value)}
            className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.instructorId ? 'border-red-500' : 'border-gray-300'}`}
            disabled={loading}
          >
            <option value="">Select an instructor</option>
            {instructors.map(i => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
          {errors.instructorId && <p className="mt-1 text-sm text-red-600">{errors.instructorId}</p>}
        </div>

        <div>
          <label htmlFor="appointment-client" className="block text-sm font-medium text-gray-700 mb-2">
            Client
          </label>
          <select
            id="appointment-client"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.clientId ? 'border-red-500' : 'border-gray-300'}`}
            disabled={loading}
          >
            <option value="">Select a client</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.clientId && <p className="mt-1 text-sm text-red-600">{errors.clientId}</p>}
        </div>

        <div>
          <label htmlFor="appointment-time" className="block text-sm font-medium text-gray-700 mb-2">
            Start Time
          </label>
          <select
            id="appointment-time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.startTime ? 'border-red-500' : 'border-gray-300'}`}
            disabled={loading}
          >
            <option value="">Select a time</option>
            {timeSlots.map(slot => (
              <option key={slot} value={slot}>{slot}</option>
            ))}
          </select>
          {errors.startTime && <p className="mt-1 text-sm text-red-600">{errors.startTime}</p>}
        </div>

        <div>
          <label htmlFor="appointment-duration" className="block text-sm font-medium text-gray-700 mb-2">
            Duration
          </label>
          <select
            id="appointment-duration"
            value={blockCount}
            onChange={(e) => setBlockCount(Number(e.target.value))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            {DURATION_OPTIONS.map(opt => (
              <option key={opt.blocks} value={opt.blocks}>{opt.label}</option>
            ))}
          </select>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-600">Appointment added successfully!</p>
          </div>
        )}

        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Adding Appointment...' : 'Add Appointment'}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AppointmentForm;
