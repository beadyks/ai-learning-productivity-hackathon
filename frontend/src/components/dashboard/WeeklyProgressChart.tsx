import React, { useState } from 'react';
import { DailyProgress } from '../../types/api.types';

interface WeeklyProgressChartProps {
  weeklyProgress: DailyProgress[];
  isLoading?: boolean;
}

export const WeeklyProgressChart: React.FC<WeeklyProgressChartProps> = ({
  weeklyProgress,
  isLoading = false,
}) => {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-48 bg-gray-200 rounded"></div>
      </div>
    );
  }

  // Ensure we have 7 days of data (fill with empty days if needed)
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const last7Days: DailyProgress[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split('T')[0] || '';
    
    const existingData = weeklyProgress.find(d => d.date === dateString);
    last7Days.push(existingData || {
      date: dateString,
      sessionsCompleted: 0,
      minutesStudied: 0,
      topicsCompleted: [],
    });
  }

  // Calculate max values for scaling
  const maxSessions = Math.max(...last7Days.map(d => d.sessionsCompleted), 1);

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const dayOfWeek = daysOfWeek[date.getDay()];
    const dayOfMonth = date.getDate();
    return `${dayOfWeek} ${dayOfMonth}`;
  };

  // Check if date is today
  const isToday = (dateString: string): boolean => {
    const date = new Date(dateString);
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        Weekly Progress
      </h2>

      {/* Chart */}
      <div className="relative">
        {/* Y-axis labels */}
        <div className="flex items-end justify-between mb-2 h-48">
          {last7Days.map((day, index) => {
            const heightPercentage = maxSessions > 0
              ? (day.sessionsCompleted / maxSessions) * 100
              : 0;
            const isHovered = hoveredDay === index;

            return (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center justify-end px-1 relative"
                onMouseEnter={() => setHoveredDay(index)}
                onMouseLeave={() => setHoveredDay(null)}
              >
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute bottom-full mb-2 bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg z-10 whitespace-nowrap">
                    <div className="font-semibold mb-1">{formatDate(day.date)}</div>
                    <div>Sessions: {day.sessionsCompleted}</div>
                    <div>Minutes: {day.minutesStudied}</div>
                    <div>Topics: {day.topicsCompleted.length}</div>
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div className="border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                )}

                {/* Bar */}
                <div
                  className={`w-full rounded-t-lg transition-all duration-300 ${
                    day.sessionsCompleted > 0
                      ? isHovered
                        ? 'bg-gradient-to-t from-indigo-600 to-purple-600'
                        : 'bg-gradient-to-t from-indigo-500 to-purple-500'
                      : 'bg-gray-200'
                  } ${isHovered ? 'opacity-100' : 'opacity-90'}`}
                  style={{
                    height: `${Math.max(heightPercentage, day.sessionsCompleted > 0 ? 8 : 4)}%`,
                    minHeight: day.sessionsCompleted > 0 ? '8px' : '4px',
                  }}
                  role="img"
                  aria-label={`${formatDate(day.date)}: ${day.sessionsCompleted} sessions, ${day.minutesStudied} minutes`}
                ></div>

                {/* Session count on bar */}
                {day.sessionsCompleted > 0 && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full mb-1">
                    <span className="text-xs font-semibold text-indigo-600">
                      {day.sessionsCompleted}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* X-axis */}
        <div className="flex justify-between border-t border-gray-200 pt-2">
          {last7Days.map((day) => {
            const isTodayDate = isToday(day.date);
            return (
              <div
                key={day.date}
                className="flex-1 text-center"
              >
                <div
                  className={`text-xs ${
                    isTodayDate
                      ? 'font-bold text-indigo-600'
                      : 'text-gray-600'
                  }`}
                >
                  {formatDate(day.date).split(' ')[0]}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {formatDate(day.date).split(' ')[1]}
                </div>
                {isTodayDate && (
                  <div className="mt-1">
                    <span className="inline-block w-2 h-2 bg-indigo-600 rounded-full"></span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-600 font-medium mb-1">
            Total Sessions
          </p>
          <p className="text-lg font-bold text-blue-900">
            {last7Days.reduce((sum, day) => sum + day.sessionsCompleted, 0)}
          </p>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <p className="text-xs text-green-600 font-medium mb-1">
            Total Minutes
          </p>
          <p className="text-lg font-bold text-green-900">
            {last7Days.reduce((sum, day) => sum + day.minutesStudied, 0)}
          </p>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <p className="text-xs text-purple-600 font-medium mb-1">
            Active Days
          </p>
          <p className="text-lg font-bold text-purple-900">
            {last7Days.filter(day => day.sessionsCompleted > 0).length}/7
          </p>
        </div>
      </div>

      {/* Encouragement */}
      {last7Days.every(day => day.sessionsCompleted === 0) && (
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
          <p className="text-sm text-yellow-800 text-center">
            Start your learning journey this week! 📚
          </p>
        </div>
      )}
    </div>
  );
};
