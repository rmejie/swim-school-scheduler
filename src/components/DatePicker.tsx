import React from 'react';

export interface DatePickerProps {
  selectedDate: string;
  onChange: (date: string) => void;
}

const DatePicker: React.FC<DatePickerProps> = ({ selectedDate, onChange }) => {
  return (
    <div className="flex items-center space-x-3">
      <label htmlFor="schedule-date" className="text-sm font-medium text-gray-700">
        Date
      </label>
      <input
        id="schedule-date"
        type="date"
        value={selectedDate}
        onChange={(e) => onChange(e.target.value)}
        className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
};

export default DatePicker;
