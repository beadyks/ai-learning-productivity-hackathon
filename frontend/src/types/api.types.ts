/**
 * API client type definitions
 * Covers HTTP requests, responses, and API configuration
 */

import { InteractionMode, ContentSource } from './message.types';

export interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  timeout?: number;
  cache?: boolean;
  retry?: RetryConfig;
}

export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryCondition?: (error: any) => boolean;
}

export interface APIResponse<T> {
  data: T;
  status: number;
  headers: Record<string, string>;
  cached: boolean;
}

export interface APIClient {
  // HTTP Methods
  get<T>(url: string, config?: RequestConfig): Promise<APIResponse<T>>;
  post<T>(url: string, data?: any, config?: RequestConfig): Promise<APIResponse<T>>;
  put<T>(url: string, data?: any, config?: RequestConfig): Promise<APIResponse<T>>;
  delete<T>(url: string, config?: RequestConfig): Promise<APIResponse<T>>;
  
  // Configuration
  setBaseURL(url: string): void;
  setAuthToken(token: string): void;
  clearAuthToken(): void;
  
  // Caching
  enableCache(ttl?: number): void;
  disableCache(): void;
  clearCache(): Promise<void>;
}

// API Request/Response Types

export interface ChatRequest {
  message: string;
  mode: InteractionMode;
  sessionId: string;
  language?: string;
}

export interface ChatResponse {
  text: string;
  sources?: ContentSource[];
  confidence?: number;
  mode: InteractionMode;
  timestamp: string;
}

export interface UploadPresignedUrlRequest {
  fileName: string;
  fileSize: number;
  contentType: string;
}

export interface UploadPresignedUrlResponse {
  url: string;
  documentId: string;
  expiresIn: number;
}

export interface UploadCompleteRequest {
  documentId: string;
  fileName: string;
  fileSize: number;
}

export interface UploadCompleteResponse {
  documentId: string;
  status: 'processing' | 'completed' | 'failed';
  message: string;
}

export interface ProgressRequest {
  userId: string;
}

export interface ProgressResponse {
  userId: string;
  totalSessions: number;
  completedTopics: number;
  totalTopics: number;
  currentStreak: number;
  longestStreak: number;
  weeklyProgress: DailyProgress[];
}

export interface DailyProgress {
  date: string;
  sessionsCompleted: number;
  minutesStudied: number;
  topicsCompleted: string[];
}

export interface StudyPlanRequest {
  goal: StudyGoal;
  startDate: string;
  timeConstraints: TimeConstraints;
}

export interface StudyGoal {
  description: string;
  targetDate: string;
  topics: string[];
  priority: 'high' | 'medium' | 'low';
}

export interface TimeConstraints {
  dailyMinutes: number;
  daysPerWeek: number;
  preferredTimes?: string[];
}

export interface StudyPlanResponse {
  planId: string;
  goal: StudyGoal;
  dailySessions: DailySession[];
  startDate: string;
  endDate: string;
  progress: number;
}

export interface DailySession {
  date: string;
  topics: string[];
  estimatedMinutes: number;
  completed: boolean;
}

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  details?: Record<string, any>;
}
