/**
 * Dashboard Hook
 * Provides dashboard data with real-time updates
 */

import { useState, useEffect, useCallback } from 'react';
import { ProgressData, StudyPlan, CompletionStatus } from '../types/dashboard.types';
import { StudyGoal } from '../types/api.types';
import { dashboardService } from '../services/dashboardService';
import { useUserStore } from '../stores/userStore';

interface UseDashboardReturn {
  progress: ProgressData | null;
  studyPlan: StudyPlan | null;
  isLoadingProgress: boolean;
  isLoadingPlan: boolean;
  error: string | null;
  refreshProgress: () => Promise<void>;
  refreshStudyPlan: () => Promise<void>;
  createStudyPlan: (goal: StudyGoal, dailyMinutes: number, daysPerWeek: number) => Promise<void>;
  updateTopicProgress: (topicId: string, status: CompletionStatus) => Promise<void>;
}

export const useDashboard = (enableRealTimeUpdates: boolean = true): UseDashboardReturn => {
  const { user } = useUserStore();
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch progress data
  const refreshProgress = useCallback(async () => {
    if (!user?.userId) return;

    try {
      setIsLoadingProgress(true);
      setError(null);
      const data = await dashboardService.getProgress(user.userId);
      setProgress(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load progress';
      setError(errorMessage);
      console.error('Error loading progress:', err);
    } finally {
      setIsLoadingProgress(false);
    }
  }, [user?.userId]);

  // Fetch study plan
  const refreshStudyPlan = useCallback(async () => {
    if (!user?.userId) return;

    try {
      setIsLoadingPlan(true);
      setError(null);
      const plan = await dashboardService.getStudyPlan(user.userId);
      setStudyPlan(plan);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load study plan';
      setError(errorMessage);
      console.error('Error loading study plan:', err);
    } finally {
      setIsLoadingPlan(false);
    }
  }, [user?.userId]);

  // Create study plan
  const createStudyPlan = useCallback(
    async (goal: StudyGoal, dailyMinutes: number, daysPerWeek: number) => {
      if (!user?.userId) {
        throw new Error('User not authenticated');
      }

      try {
        setError(null);
        const plan = await dashboardService.createStudyPlan(
          user.userId,
          goal,
          dailyMinutes,
          daysPerWeek
        );
        setStudyPlan(plan);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create study plan';
        setError(errorMessage);
        throw err;
      }
    },
    [user?.userId]
  );

  // Update topic progress
  const updateTopicProgress = useCallback(
    async (topicId: string, status: CompletionStatus) => {
      if (!user?.userId) {
        throw new Error('User not authenticated');
      }

      try {
        setError(null);
        await dashboardService.updateTopicProgress(user.userId, topicId, status);
        // Progress will be updated via polling or we can manually refresh
        await refreshProgress();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update progress';
        setError(errorMessage);
        throw err;
      }
    },
    [user?.userId, refreshProgress]
  );

  // Initial data load
  useEffect(() => {
    if (user?.userId) {
      refreshProgress();
      refreshStudyPlan();
    }
  }, [user?.userId, refreshProgress, refreshStudyPlan]);

  // Set up real-time updates via polling
  useEffect(() => {
    if (!enableRealTimeUpdates || !user?.userId) return;

    // Callback for progress updates
    const handleProgressUpdate = (data: ProgressData) => {
      setProgress(data);
    };

    // Start polling
    dashboardService.startProgressPolling(user.userId, handleProgressUpdate);

    // Cleanup
    return () => {
      dashboardService.stopProgressPolling(handleProgressUpdate);
    };
  }, [enableRealTimeUpdates, user?.userId]);

  return {
    progress,
    studyPlan,
    isLoadingProgress,
    isLoadingPlan,
    error,
    refreshProgress,
    refreshStudyPlan,
    createStudyPlan,
    updateTopicProgress,
  };
};
