import React, { useState } from 'react';
import { addInstructor } from '../lib/firestore';

/**
 * Props for the InstructorForm component
 * 
 * @property onSuccess - Callback with the new instructor's ID and trimmed name
 * @property onCancel - Callback when the form is dismissed
 * 
 * @example
 * ```tsx
 * <InstructorForm 
 *   onSuccess={(id, name) => {
 *     setInstructors(prev => [...prev, { id, name }]);
 *     setShowForm(false);
 *   }}
 *   onCancel={() => setShowForm(false)}
 * />
 * ```
 */
export interface InstructorFormProps {
  onSuccess: (instructorId: string, name: string) => void;
  onCancel: () => void;
}

/**
 * Form validation errors
 */
interface FormErrors {
  name?: string;
}

/**
 * Instructor form component for adding new swim instructors.
 * 
 * Features:
 * - Form validation (name required, minimum 2 characters)
 * - Loading states during submission
 * - Error handling and display
 * - Success feedback
 * - Form reset after successful submission
 * - Responsive design with swim school theme
 * 
 * @param props - InstructorForm component props
 * @returns JSX element representing the instructor form
 * 
 * @example
 * ```tsx
 * <InstructorForm 
 *   onSuccess={(id) => {
 *     setInstructors(prev => [...prev, { id, name: 'Jane Doe' }]);
 *     setShowForm(false);
 *   }}
 *   onCancel={() => setShowForm(false)}
 * />
 * ```
 */
const InstructorForm: React.FC<InstructorFormProps> = ({ onSuccess, onCancel }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  /**
   * Validates the form data
   * @returns true if valid, false otherwise
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handles form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous states
    setError(null);
    setSuccess(false);

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const trimmedName = name.trim();
      const instructorId = await addInstructor({ name: trimmedName });
      setSuccess(true);
      setName('');
      setErrors({});
      onSuccess(instructorId, trimmedName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add instructor');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles input changes and clears validation errors
   */
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    
    // Clear name error if user starts typing
    if (errors.name && newName.trim().length >= 2) {
      setErrors(prev => ({ ...prev, name: undefined }));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Instructor</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4" role="form">
        {/* Name Input */}
        <div>
          <label htmlFor="instructor-name" className="block text-sm font-medium text-gray-700 mb-2">
            Instructor Name
          </label>
          <input
            id="instructor-name"
            type="text"
            value={name}
            onChange={handleNameChange}
            required
            minLength={2}
            className={`
              w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
              ${errors.name ? 'border-red-500' : 'border-gray-300'}
            `}
            placeholder="Enter instructor name"
            disabled={loading}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-600">Instructor added successfully!</p>
          </div>
        )}

        {/* Form Buttons */}
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className={`
              flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg
              transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {loading ? 'Adding Instructor...' : 'Add Instructor'}
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className={`
              flex-1 border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium py-2 px-4 rounded-lg
              transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default InstructorForm; 