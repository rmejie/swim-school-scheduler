import React from 'react';
import type { Appointment } from '../types';
import { formatTimeDisplay } from '../utils/timeSlots';

export interface AppointmentListProps {
  appointments: Appointment[];
  loading: boolean;
  onCancel: (id: string) => void;
}

const AppointmentList: React.FC<AppointmentListProps> = ({ appointments, loading, onCancel }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500">Loading appointments...</p>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500">No appointments for this date.</p>
      </div>
    );
  }

  const sorted = [...appointments].sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructor</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sorted.map((appt) => {
            const isCancelled = appt.status === 'cancelled';
            const duration = appt.blocks ? appt.blocks.length * 20 : 0;
            return (
              <tr key={appt.id} className={isCancelled ? 'bg-gray-50 text-gray-400 line-through' : ''}>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{formatTimeDisplay(appt.startTime)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{appt.clientName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{appt.instructorName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{duration} min</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${isCancelled ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {appt.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {!isCancelled && (
                    <button
                      onClick={() => onCancel(appt.id)}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AppointmentList;
