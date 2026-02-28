/**
 * Dashboard Service
 * Handles API calls for progress tracking and study plans
 * Implements polling for real-time updates
 */

import { ProgressData, StudyPlan, CompletionStatus } from '../types/dashboard.types';
import {
  ProgressResponse,
  StudyPlanRequest,
  StudyPlanResponse,
  StudyGoal,
} from '../types/api.types';

class DashboardService {
  private baseURL: string;
  private pollingInterval: number = 30000; // 30 seconds
  private progressPollingTimer: NodeJS.Timeout | null = null;
  private progressCallbacks: Set<(data: ProgressData) => void> = new Set();

  constructor(baseURL: string = import.meta.env.VITE_API_BASE_URL || '') {
    this.baseURL = baseURL || '';
  }

  /**
   * Fetch user progress data
   */
  async getProgress(userId: string): Promise<ProgressData> {
    try {
      const response = await fetch(`${this.baseURL}/api/progress/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch progress: ${response.statusText}`);
      }

      const data: ProgressResponse = await response.json();
      return this.transformProgressResponse(data);
    } catch (error) {
      console.error('Error fetching progress:', error);
      throw error;
    }
  }

  /**
   * Fetch user study plan
   */
  async getStudyPlan(userId: string): Promise<StudyPlan | null> {
    try {
      const response = await fetch(`${this.baseURL}/api/study-plan/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
      });

      if (response.status === 404) {
        return null; // No plan exists
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch study plan: ${response.statusText}`);
      }

      const data: StudyPlanResponse = await response.json();
      return this.transformStudyPlanResponse(data);
    } catch (error) {
      console.error('Error fetching study plan:', error);
      throw error;
    }
  }

  /**
   * Create a new study plan
   */
  async createStudyPlan(
    userId: string,
    goal: StudyGoal,
    dailyMinutes: number,
    daysPerWeek: number
  ): Promise<StudyPlan> {
    try {
      const request: StudyPlanRequest = {
        goal,
        startDate: new Date().toISOString().split('T')[0] || '',
        timeConstraints: {
          dailyMinutes,
          daysPerWeek,
        },
      };

      const response = await fetch(`${this.baseURL}/api/study-plan/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Failed to create study plan: ${response.statusText}`);
      }

      const data: StudyPlanResponse = await response.json();
      return this.transformStudyPlanResponse(data);
    } catch (error) {
      console.error('Error creating study plan:', error);
      throw error;
    }
  }

  /**
   * Update topic progress
   */
  async updateTopicProgress(
    userId: string,
    topicId: string,
    status: CompletionStatus
  ): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseURL}/api/progress/${userId}/topic/${topicId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.getAuthToken()}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update topic progress: ${response.statusText}`);
      }

      // Trigger progress update for all listeners
      this.notifyProgressUpdate(userId);
    } catch (error) {
      console.error('Error updating topic progress:', error);
      throw error;
    }
  }

  /**
   * Start polling for progress updates
   */
  startProgressPolling(userId: string, callback: (data: ProgressData) => void): void {
    // Add callback to set
    this.progressCallbacks.add(callback);

    // Start polling if not already started
    if (!this.progressPollingTimer) {
      this.progressPollingTimer = setInterval(async () => {
        try {
          const progress = await this.getProgress(userId);
          // Notify all callbacks
          this.progressCallbacks.forEach(cb => cb(progress));
        } catch (error) {
          console.error('Error polling progress:', error);
        }
      }, this.pollingInterval);
    }

    // Fetch initial data
    this.getProgress(userId)
      .then(progress => callback(progress))
      .catch(error => console.error('Error fetching initial progress:', error));
  }

  /**
   * Stop polling for progress updates
   */
  stopProgressPolling(callback?: (data: ProgressData) => void): void {
    if (callback) {
      this.progressCallbacks.delete(callback);
    } else {
      this.progressCallbacks.clear();
    }

    // Stop polling if no more callbacks
    if (this.progressCallbacks.size === 0 && this.progressPollingTimer) {
      clearInterval(this.progressPollingTimer);
      this.progressPollingTimer = null;
    }
  }

  /**
   * Manually trigger progress update notification
   */
  private async notifyProgressUpdate(userId: string): Promise<void> {
    try {
      const progress = await this.getProgress(userId);
      this.progressCallbacks.forEach(cb => cb(progress));
    } catch (error) {
      console.error('Error notifying progress update:', error);
    }
  }

  /**
   * Transform API response to internal format
   */
  private transformProgressResponse(response: ProgressResponse): ProgressData {
    return {
      userId: response.userId,
      totalSessions: response.totalSessions,
      completedTopics: response.completedTopics,
      totalTopics: response.totalTopics,
      currentStreak: response.currentStreak,
      longestStreak: response.longestStreak,
      weeklyProgress: response.weeklyProgress,
    };
  }

  /**
   * Transform study plan API response to internal format
   */
  private transformStudyPlanResponse(response: StudyPlanResponse): StudyPlan {
    return {
      planId: response.planId,
      goal: response.goal,
      dailySessions: response.dailySessions,
      startDate: new Date(response.startDate),
      endDate: new Date(response.endDate),
      progress: response.progress,
    };
  }

  /**
   * Get authentication token from storage
   */
  private getAuthToken(): string {
    // This should be replaced with actual token retrieval from auth service
    return localStorage.getItem('authToken') || '';
  }

  /**
   * Set polling interval (for testing or configuration)
   */
  setPollingInterval(intervalMs: number): void {
    this.pollingInterval = intervalMs;
    
    // Restart polling if active
    if (this.progressPollingTimer) {
      clearInterval(this.progressPollingTimer);
      this.progressPollingTimer = null;
      // Polling will restart on next startProgressPolling call
    }
  }
}

// Export singleton instance
export const dashboardService = new DashboardService();
export default dashboardService;
