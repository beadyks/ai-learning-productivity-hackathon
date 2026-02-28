import React, { useState } from 'react';
import { StudyPlan } from '../../types/dashboard.types';

interface StudyPlanViewProps {
  plan: StudyPlan;
  isLoading?: boolean;
}

export const StudyPlanView: React.FC<StudyPlanViewProps> = ({
  plan,
  isLoading = false,
}) => {
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Get upcoming sessions (today and future)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const upcomingSessions = plan.dailySessions
    .filter(session => {
      const sessionDate = new Date(session.date);
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate >= today;
    })
    .slice(0, 7); // Show next 7 sessions

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    date.setHours(0, 0, 0, 0);
    
    if (date.getTime() === today.getTime()) {
      return 'Today';
    } else if (date.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else {
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      };
      return date.toLocaleDateString('en-US', options);
    }
  };

  // Check if session is today
  const isToday = (dateString: string): boolean => {
    const sessionDate = new Date(dateString);
    const today = new Date();
    sessionDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return sessionDate.getTime() === today.getTime();
  };

  // Toggle session expansion
  const toggleSession = (date: string) => {
    setExpandedSession(expandedSession === date ? null : date);
  };

  // Calculate overall progress
  const totalSessions = plan.dailySessions.length;
  const completedSessions = plan.dailySessions.filter(s => s.completed).length;
  const progressPercentage = totalSessions > 0
    ? Math.round((completedSessions / totalSessions) * 100)
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          Study Plan
        </h2>
        <span className="text-sm text-gray-600">
          {completedSessions}/{totalSessions} sessions
        </span>
      </div>

      {/* Plan Goal */}
      <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-3">
            <svg
              className="w-6 h-6 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-800 mb-1">
              Goal: {plan.goal.description}
            </h3>
            <div className="flex items-center text-xs text-gray-600">
              <span className="mr-3">
                📅 Target: {new Date(plan.goal.targetDate).toLocaleDateString()}
              </span>
              <span className={`px-2 py-1 rounded-full font-medium ${
                plan.goal.priority === 'high'
                  ? 'bg-red-100 text-red-700'
                  : plan.goal.priority === 'medium'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {plan.goal.priority} priority
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-600">Overall Progress</span>
            <span className="text-xs font-semibold text-indigo-600">
              {progressPercentage}%
            </span>
          </div>
          <div className="w-full bg-white rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
              role="progressbar"
              aria-valuenow={progressPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
            ></div>
          </div>
        </div>
      </div>

      {/* Upcoming Sessions */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Upcoming Sessions
        </h3>
        
        {upcomingSessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No upcoming sessions scheduled</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingSessions.map((session) => {
              const isExpanded = expandedSession === session.date;
              const isTodaySession = isToday(session.date);

              return (
                <div
                  key={session.date}
                  className={`border rounded-lg transition-all ${
                    isTodaySession
                      ? 'border-indigo-300 bg-indigo-50'
                      : session.completed
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  {/* Session Header */}
                  <button
                    onClick={() => toggleSession(session.date)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-opacity-50 transition-colors"
                    aria-expanded={isExpanded}
                  >
                    <div className="flex items-center flex-1">
                      {/* Checkbox */}
                      <div className="mr-3">
                        {session.completed ? (
                          <div className="w-5 h-5 bg-green-500 rounded flex items-center justify-center">
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-5 h-5 border-2 border-gray-300 rounded"></div>
                        )}
                      </div>

                      {/* Date and Info */}
                      <div className="text-left">
                        <div className="flex items-center">
                          <span className={`text-sm font-medium ${
                            isTodaySession ? 'text-indigo-900' : 'text-gray-800'
                          }`}>
                            {formatDate(session.date)}
                          </span>
                          {isTodaySession && (
                            <span className="ml-2 px-2 py-0.5 bg-indigo-600 text-white text-xs font-semibold rounded-full">
                              Today
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-600 mt-0.5">
                          {session.topics.length} {session.topics.length === 1 ? 'topic' : 'topics'} • {session.estimatedMinutes} min
                        </div>
                      </div>
                    </div>

                    {/* Expand Icon */}
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        isExpanded ? 'transform rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 pb-3 border-t border-gray-200">
                      <div className="pt-3">
                        <p className="text-xs font-semibold text-gray-700 mb-2">
                          Topics to cover:
                        </p>
                        <ul className="space-y-1">
                          {session.topics.map((topic, index) => (
                            <li
                              key={index}
                              className="flex items-start text-sm text-gray-700"
                            >
                              <span className="mr-2 text-indigo-500">•</span>
                              <span>{topic}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* View All Link */}
      {plan.dailySessions.length > upcomingSessions.length && (
        <div className="mt-4 text-center">
          <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            View all {plan.dailySessions.length} sessions →
          </button>
        </div>
      )}
    </div>
  );
};
