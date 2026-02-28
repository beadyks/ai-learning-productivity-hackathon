# Dashboard Components

This directory contains all components related to the Study Dashboard feature, which displays learning progress, streaks, weekly charts, and study plans.

## Components

### ProgressOverview
Displays overall learning progress including:
- Completion percentage with visual progress bar
- Total sessions completed
- Topics completed vs total topics
- Motivational messages based on progress

**Props:**
- `progress: ProgressData | null` - Progress data to display
- `isLoading?: boolean` - Loading state

### StreakDisplay
Shows learning streak information:
- Current streak with fire icon
- Longest streak with star icon
- Motivational messages based on streak length
- Tips and goals for maintaining streaks

**Props:**
- `currentStreak: number` - Current consecutive days
- `longestStreak: number` - Best streak achieved
- `isLoading?: boolean` - Loading state

### WeeklyProgressChart
Interactive bar chart showing last 7 days of activity:
- Sessions completed per day
- Minutes studied per day
- Topics completed per day
- Hover tooltips with detailed information
- Summary statistics

**Props:**
- `weeklyProgress: DailyProgress[]` - Array of daily progress data
- `isLoading?: boolean` - Loading state

### StudyPlanView
Displays study plan with upcoming sessions:
- Plan goal and target date
- Overall progress bar
- Upcoming sessions (next 7 days)
- Expandable session details
- Topic lists with time allocations
- Completion checkboxes

**Props:**
- `plan: StudyPlan` - Study plan data
- `onTopicComplete?: (sessionDate: string, topicIndex: number) => void` - Callback for topic completion
- `isLoading?: boolean` - Loading state

### CreatePlanPrompt
Form for creating a new study plan:
- Goal description input
- Topics input (comma-separated)
- Target date picker
- Priority selector
- Time constraints (daily minutes, days per week)
- Form validation
- Loading states

**Props:**
- `onCreatePlan: (goal: StudyGoal, dailyMinutes: number, daysPerWeek: number) => Promise<void>` - Callback for plan creation
- `isCreating?: boolean` - Creating state

## Usage Example

```tsx
import { 
  ProgressOverview, 
  StreakDisplay, 
  WeeklyProgressChart,
  StudyPlanView,
  CreatePlanPrompt 
} from '../components/dashboard';
import { useDashboard } from '../hooks/useDashboard';

function DashboardPage() {
  const {
    progress,
    studyPlan,
    isLoadingProgress,
    isLoadingPlan,
    createStudyPlan,
  } = useDashboard(true); // Enable real-time updates

  return (
    <div className="space-y-6">
      <ProgressOverview 
        progress={progress} 
        isLoading={isLoadingProgress} 
      />
      
      <StreakDisplay
        currentStreak={progress?.currentStreak || 0}
        longestStreak={progress?.longestStreak || 0}
        isLoading={isLoadingProgress}
      />
      
      <WeeklyProgressChart
        weeklyProgress={progress?.weeklyProgress || []}
        isLoading={isLoadingProgress}
      />
      
      {studyPlan ? (
        <StudyPlanView 
          plan={studyPlan} 
          isLoading={isLoadingPlan} 
        />
      ) : (
        <CreatePlanPrompt 
          onCreatePlan={createStudyPlan} 
        />
      )}
    </div>
  );
}
```

## Features

### Real-Time Updates
The dashboard supports real-time progress updates via polling:
- Automatic refresh every 30 seconds
- Manual refresh capability
- Optimistic UI updates

### Responsive Design
All components are mobile-first and responsive:
- Single-column layout on mobile
- Multi-column grid on desktop
- Touch-friendly interactions
- Accessible keyboard navigation

### Accessibility
Components follow WCAG guidelines:
- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader friendly
- Sufficient color contrast
- Focus indicators

### Loading States
All components support loading states with skeleton screens for better UX.

### Error Handling
Components gracefully handle missing or invalid data with appropriate fallback UI.

## Related Files

- **Hook**: `src/hooks/useDashboard.ts` - Custom hook for dashboard data and real-time updates
- **Service**: `src/services/dashboardService.ts` - API service for dashboard endpoints
- **Types**: `src/types/dashboard.types.ts` - TypeScript type definitions
- **Page**: `src/pages/DashboardPage.tsx` - Main dashboard page component
