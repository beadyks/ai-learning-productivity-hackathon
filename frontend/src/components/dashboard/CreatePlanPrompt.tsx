import React, { useState } from 'react';
import { StudyGoal } from '../../types/api.types';

interface CreatePlanPromptProps {
  onCreatePlan: (goal: StudyGoal, dailyMinutes: number, daysPerWeek: number) => Promise<void>;
  isCreating?: boolean;
}

export const CreatePlanPrompt: React.FC<CreatePlanPromptProps> = ({
  onCreatePlan,
  isCreating = false,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    targetDate: '',
    topics: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    dailyMinutes: 30,
    daysPerWeek: 5,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Goal description is required';
    }

    if (!formData.targetDate) {
      newErrors.targetDate = 'Target date is required';
    } else {
      const targetDate = new Date(formData.targetDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (targetDate < today) {
        newErrors.targetDate = 'Target date must be in the future';
      }
    }

    if (!formData.topics.trim()) {
      newErrors.topics = 'At least one topic is required';
    }

    if (formData.dailyMinutes < 10) {
      newErrors.dailyMinutes = 'Minimum 10 minutes per day';
    } else if (formData.dailyMinutes > 480) {
      newErrors.dailyMinutes = 'Maximum 8 hours per day';
    }

    if (formData.daysPerWeek < 1) {
      newErrors.daysPerWeek = 'At least 1 day per week';
    } else if (formData.daysPerWeek > 7) {
      newErrors.daysPerWeek = 'Maximum 7 days per week';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const goal: StudyGoal = {
        description: formData.description.trim(),
        targetDate: formData.targetDate,
        topics: formData.topics
          .split(',')
          .map(t => t.trim())
          .filter(t => t.length > 0),
        priority: formData.priority,
      };

      await onCreatePlan(goal, formData.dailyMinutes, formData.daysPerWeek);
      
      // Reset form
      setFormData({
        description: '',
        targetDate: '',
        topics: '',
        priority: 'medium',
        dailyMinutes: 30,
        daysPerWeek: 5,
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error creating plan:', error);
    }
  };

  // Handle input change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Get minimum date (tomorrow)
  const getMinDate = (): string => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0] || '';
  };

  if (!showForm) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            No Study Plan Yet
          </h3>
          <p className="text-gray-600 mb-6">
            Create a personalized study plan to organize your learning journey and track your progress effectively.
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create Study Plan
        </button>

        <div className="mt-6 grid grid-cols-3 gap-4 text-left">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-blue-600 mb-1">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-xs text-gray-700 font-medium">Organized Schedule</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-green-600 mb-1">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-xs text-gray-700 font-medium">Daily Goals</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="text-purple-600 mb-1">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <p className="text-xs text-gray-700 font-medium">Track Progress</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-800">
          Create Your Study Plan
        </h3>
        <button
          onClick={() => setShowForm(false)}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Close form"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Goal Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            What do you want to achieve? *
          </label>
          <input
            type="text"
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="e.g., Master React and TypeScript"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isCreating}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        {/* Topics */}
        <div>
          <label htmlFor="topics" className="block text-sm font-medium text-gray-700 mb-1">
            Topics to cover (comma-separated) *
          </label>
          <textarea
            id="topics"
            name="topics"
            value={formData.topics}
            onChange={handleChange}
            placeholder="e.g., React Hooks, TypeScript Basics, State Management"
            rows={3}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
              errors.topics ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isCreating}
          />
          {errors.topics && (
            <p className="mt-1 text-sm text-red-600">{errors.topics}</p>
          )}
        </div>

        {/* Target Date and Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="targetDate" className="block text-sm font-medium text-gray-700 mb-1">
              Target Date *
            </label>
            <input
              type="date"
              id="targetDate"
              name="targetDate"
              value={formData.targetDate}
              onChange={handleChange}
              min={getMinDate()}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                errors.targetDate ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isCreating}
            />
            {errors.targetDate && (
              <p className="mt-1 text-sm text-red-600">{errors.targetDate}</p>
            )}
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={isCreating}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        {/* Time Constraints */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="dailyMinutes" className="block text-sm font-medium text-gray-700 mb-1">
              Daily Study Time (minutes) *
            </label>
            <input
              type="number"
              id="dailyMinutes"
              name="dailyMinutes"
              value={formData.dailyMinutes}
              onChange={handleChange}
              min="10"
              max="480"
              step="5"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                errors.dailyMinutes ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isCreating}
            />
            {errors.dailyMinutes && (
              <p className="mt-1 text-sm text-red-600">{errors.dailyMinutes}</p>
            )}
          </div>

          <div>
            <label htmlFor="daysPerWeek" className="block text-sm font-medium text-gray-700 mb-1">
              Days per Week *
            </label>
            <input
              type="number"
              id="daysPerWeek"
              name="daysPerWeek"
              value={formData.daysPerWeek}
              onChange={handleChange}
              min="1"
              max="7"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                errors.daysPerWeek ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isCreating}
            />
            {errors.daysPerWeek && (
              <p className="mt-1 text-sm text-red-600">{errors.daysPerWeek}</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isCreating}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isCreating}
            className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </span>
            ) : (
              'Create Plan'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
