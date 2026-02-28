import React from 'react';

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  isLoading?: boolean;
}

export const StreakDisplay: React.FC<StreakDisplayProps> = ({
  currentStreak,
  longestStreak,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  // Motivational messages based on streak
  const getMotivationalMessage = (streak: number): string => {
    if (streak === 0) {
      return "Start your learning streak today! 🌟";
    } else if (streak === 1) {
      return "Great start! Come back tomorrow to keep it going! 🔥";
    } else if (streak < 7) {
      return `${streak} days strong! You're building a great habit! 💪`;
    } else if (streak < 30) {
      return `${streak} day streak! You're on fire! 🔥`;
    } else if (streak < 100) {
      return `${streak} days! You're a learning champion! 🏆`;
    } else {
      return `${streak} days! Absolutely incredible dedication! 🌟`;
    }
  };

  const isNewRecord = currentStreak > 0 && currentStreak === longestStreak;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        Learning Streak
      </h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Current Streak */}
        <div className="relative">
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 text-center">
            <div className="flex justify-center mb-3">
              <div className="relative">
                <svg
                  className="w-16 h-16 text-orange-500"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 2c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2s-2-.9-2-2V4c0-1.1.9-2 2-2zm0 16c-2.2 0-4-1.8-4-4 0-1.5.8-2.8 2-3.5V9c0-.6.4-1 1-1h2c.6 0 1 .4 1 1v1.5c1.2.7 2 2 2 3.5 0 2.2-1.8 4-4 4zm7-7h2c1.1 0 2 .9 2 2s-.9 2-2 2h-2c-1.1 0-2-.9-2-2s.9-2 2-2zM5 11H3c-1.1 0-2 .9-2 2s.9 2 2 2h2c1.1 0 2-.9 2-2s-.9-2-2-2zm11.5-6.5l1.4-1.4c.8-.8 2-.8 2.8 0 .8.8.8 2 0 2.8l-1.4 1.4c-.8.8-2 .8-2.8 0-.8-.8-.8-2 0-2.8zm-11 0c.8-.8 2-.8 2.8 0 .8.8.8 2 0 2.8L6.9 8.7c-.8.8-2 .8-2.8 0-.8-.8-.8-2 0-2.8l1.4-1.4z" />
                </svg>
                {currentStreak > 0 && (
                  <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {currentStreak}
                  </div>
                )}
              </div>
            </div>
            <p className="text-sm text-orange-600 font-medium mb-1">
              Current Streak
            </p>
            <p className="text-3xl font-bold text-orange-900">
              {currentStreak}
              <span className="text-lg text-orange-600 ml-1">
                {currentStreak === 1 ? 'day' : 'days'}
              </span>
            </p>
            {isNewRecord && (
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  🏆 New Record!
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Longest Streak */}
        <div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 text-center">
            <div className="flex justify-center mb-3">
              <svg
                className="w-16 h-16 text-purple-500"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </div>
            <p className="text-sm text-purple-600 font-medium mb-1">
              Best Streak
            </p>
            <p className="text-3xl font-bold text-purple-900">
              {longestStreak}
              <span className="text-lg text-purple-600 ml-1">
                {longestStreak === 1 ? 'day' : 'days'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Motivational Message */}
      <div className="bg-gradient-to-r from-orange-50 to-purple-50 rounded-lg p-4 border border-orange-100">
        <p className="text-center text-sm font-medium text-gray-800">
          {getMotivationalMessage(currentStreak)}
        </p>
      </div>

      {/* Streak Tips */}
      {currentStreak === 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-xs text-blue-800">
            <span className="font-semibold">💡 Tip:</span> Complete at least one learning session each day to build your streak!
          </p>
        </div>
      )}

      {currentStreak > 0 && currentStreak < longestStreak && (
        <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-100">
          <p className="text-xs text-purple-800">
            <span className="font-semibold">🎯 Goal:</span> {longestStreak - currentStreak} more {longestStreak - currentStreak === 1 ? 'day' : 'days'} to match your best streak!
          </p>
        </div>
      )}
    </div>
  );
};
