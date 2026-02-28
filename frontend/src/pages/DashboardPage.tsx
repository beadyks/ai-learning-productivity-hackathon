import React from 'react';
import {
  ProgressOverview,
  StreakDisplay,
  WeeklyProgressChart,
  StudyPlanView,
  CreatePlanPrompt,
} from '../components/dashboard';
import { useDashboard } from '../hooks/useDashboard';

/**
 * DashboardPage Component
 * Mobile-first: single-column on mobile, 2-column grid on desktop
 * Requirements: 8.1, 8.2, 11.1, 11.2
 */
export const DashboardPage: React.FC = () => {
  const {
    progress,
    studyPlan,
    isLoadingProgress,
    isLoadingPlan,
    error,
    refreshProgress,
    refreshStudyPlan,
    createStudyPlan,
  } = useDashboard(true); // Enable real-time updates

  const [isCreatingPlan, setIsCreatingPlan] = React.useState(false);

  // Handle plan creation
  const handleCreatePlan = async (
    goal: any,
    dailyMinutes: number,
    daysPerWeek: number
  ) => {
    try {
      setIsCreatingPlan(true);
      await createStudyPlan(goal, dailyMinutes, daysPerWeek);
      // Refresh study plan after creation
      await refreshStudyPlan();
    } catch (error) {
      console.error('Failed to create study plan:', error);
    } finally {
      setIsCreatingPlan(false);
    }
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    await Promise.all([refreshProgress(), refreshStudyPlan()]);
  };

  return (
    <div className="h-full overflow-auto">
      {/* Header - Mobile-first responsive */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Study Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Track your learning progress and manage your study plan
              </p>
            </div>
            
            {/* Refresh Button - Touch optimized */}
            <button
              onClick={handleRefresh}
              className="inline-flex items-center justify-center px-4 py-2 min-h-touch border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              aria-label="Refresh dashboard data"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Mobile-first responsive */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error loading dashboard
                </h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Grid - Single column on mobile, 2 columns on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Left Column */}
          <div className="space-y-4 sm:space-y-6">
            {/* Progress Overview */}
            <ProgressOverview 
              progress={progress} 
              isLoading={isLoadingProgress} 
            />

            {/* Streak Display */}
            <StreakDisplay
              currentStreak={progress?.currentStreak || 0}
              longestStreak={progress?.longestStreak || 0}
              isLoading={isLoadingProgress}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-4 sm:space-y-6">
            {/* Weekly Progress Chart */}
            <WeeklyProgressChart
              weeklyProgress={progress?.weeklyProgress || []}
              isLoading={isLoadingProgress}
            />
          </div>
        </div>

        {/* Study Plan Section - Full Width */}
        <div className="mt-4 sm:mt-6">
          {studyPlan ? (
            <StudyPlanView 
              plan={studyPlan} 
              isLoading={isLoadingPlan} 
            />
          ) : (
            <CreatePlanPrompt 
              onCreatePlan={handleCreatePlan}
              isCreating={isCreatingPlan}
            />
          )}
        </div>

        {/* Real-time Update Indicator */}
        <div className="mt-4 sm:mt-6 text-center">
          <p className="text-xs text-gray-500">
            <span className="inline-flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              Dashboard updates automatically every 30 seconds
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
