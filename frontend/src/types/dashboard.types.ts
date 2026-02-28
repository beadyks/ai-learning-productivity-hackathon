/**
 * Study dashboard type definitions
 * Covers progress tracking, study plans, and goal management
 */

import { DailyProgress, StudyGoal, DailySession } from './api.types';

export type CompletionStatus = 'not_started' | 'in_progress' | 'completed';

export interface ProgressData {
  userId: string;
  totalSessions: number;
  completedTopics: number;
  totalTopics: number;
  currentStreak: number;
  longestStreak: number;
  weeklyProgress: DailyProgress[];
}

export interface StudyPlan {
  planId: string;
  goal: StudyGoal;
  dailySessions: DailySession[];
  startDate: Date;
  endDate: Date;
  progress: number;
}

export interface PlanChanges {
  goal?: Partial<StudyGoal>;
  dailySessions?: DailySession[];
  endDate?: Date;
}

export interface StudyDashboard {
  // Data Fetching
  loadProgress(): Promise<ProgressData>;
  loadStudyPlan(): Promise<StudyPlan | null>;
  
  // Progress Updates
  updateTopicProgress(topicId: string, status: CompletionStatus): Promise<void>;
  
  // Plan Management
  createStudyPlan(goal: StudyGoal): Promise<StudyPlan>;
  modifyStudyPlan(planId: string, changes: PlanChanges): Promise<StudyPlan>;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlockedAt: Date;
  icon: string;
}

export interface StreakData {
  current: number;
  longest: number;
  lastActiveDate: Date;
}
