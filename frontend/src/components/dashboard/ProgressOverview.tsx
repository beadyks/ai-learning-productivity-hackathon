import React from 'react';
import { ProgressData } from '../../types/dashboard.types';

interface ProgressOverviewProps {
  progress: ProgressData | null;
  isLoading?: boolean;
}

export const ProgressOverview: React.FC<ProgressOverviewProps> = ({ 
  progress, 
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Learning Progress
        </h2>
        <p className="text-gray-600">
          No progress data available yet. Start learning to see your progress!
        </p>
      </div>
    );
  }

  const completionPercentage = progress.totalTopics > 0
    ? Math.round((progress.completedTopics / progress.totalTopics) * 100)
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6" role="region" aria-labelledby="progress-heading">
      <h2 id="progress-heading" className="text-xl font-semibold text-gray-800 mb-6">
        Learning Progress
      </h2>

      {/* Completion Percentage */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Overall Completion
          </span>
          <span className="text-sm font-bold text-indigo-600" aria-label={`${completionPercentage} percent complete`}>
            {completionPercentage}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden" role="progressbar" aria-valuenow={completionPercentage} aria-valuemin={0} aria-valuemax={100} aria-label={`Overall completion progress`}>
          <div
            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4" role="list" aria-label="Learning statistics">
        {/* Total Sessions */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4" role="listitem">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium mb-1">
                Total Sessions
              </p>
              <p className="text-2xl font-bold text-blue-900" aria-label={`${progress.totalSessions} total learning sessions`}>
                {progress.totalSessions}
              </p>
            </div>
            <div className="text-blue-500" aria-hidden="true">
              <svg
                className="w-10 h-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Completed Topics */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4" role="listitem">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium mb-1">
                Topics Completed
              </p>
              <p className="text-2xl font-bold text-green-900" aria-label={`${progress.completedTopics} out of ${progress.totalTopics} topics completed`}>
                {progress.completedTopics}
                <span className="text-sm text-green-600 font-normal">
                  /{progress.totalTopics}
                </span>
              </p>
            </div>
            <div className="text-green-500" aria-hidden="true">
              <svg
                className="w-10 h-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Motivational Message */}
      {completionPercentage > 0 && (
        <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100" role="status" aria-live="polite">
          <p className="text-sm text-indigo-800">
            {completionPercentage === 100 ? (
              <span className="font-medium">🎉 Amazing! You've completed all topics!</span>
            ) : completionPercentage >= 75 ? (
              <span>You're almost there! Keep up the great work! 💪</span>
            ) : completionPercentage >= 50 ? (
              <span>Great progress! You're halfway through! 🚀</span>
            ) : completionPercentage >= 25 ? (
              <span>Good start! Keep the momentum going! 📚</span>
            ) : (
              <span>Every journey begins with a single step. You've got this! ✨</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
};
