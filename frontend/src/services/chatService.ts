/**
 * Chat Service
 * Handles chat API communication
 * Requirements: 7.1, 7.2, 13.1
 */

import { apiClient } from './apiClient';
import type { ChatRequest, ChatResponse } from '../types/api.types';
import type { InteractionMode } from '../types/message.types';

/**
 * Chat service for managing conversation API calls
 */
class ChatService {
  /**
   * Send a message to the AI assistant
   * Requirement: 7.1, 7.2
   */
  async sendMessage(
    message: string,
    mode: InteractionMode,
    sessionId: string,
    language?: string
  ): Promise<ChatResponse> {
    try {
      const request: ChatRequest = {
        message,
        mode,
        sessionId,
        language,
      };

      const response = await apiClient.post<ChatResponse>('/chat', request, {
        timeout: 60000, // 60 seconds for AI response
        retry: {
          maxRetries: 2,
          retryDelay: 1000,
          retryCondition: (error: any) => {
            // Retry on network errors or 5xx server errors
            return !error.response || (error.response.status >= 500 && error.response.status < 600);
          },
        },
      });

      return response.data;
    } catch (error) {
      // Transform error for user-friendly display
      // Requirement: 13.1
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('Failed to send message. Please try again.');
    }
  }

  /**
   * Get conversation history
   * Requirement: 7.5 (load messages for infinite scroll)
   */
  async getConversationHistory(
    sessionId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ChatResponse[]> {
    try {
      const response = await apiClient.get<ChatResponse[]>('/chat/history', {
        params: {
          sessionId,
          limit,
          offset,
        },
        cache: true, // Enable caching for history
      });

      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('Failed to load conversation history.');
    }
  }

  /**
   * Clear conversation history
   */
  async clearConversation(sessionId: string): Promise<void> {
    try {
      await apiClient.delete(`/chat/history/${sessionId}`);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('Failed to clear conversation.');
    }
  }

  /**
   * Get suggested questions based on context
   */
  async getSuggestedQuestions(
    sessionId: string,
    mode: InteractionMode
  ): Promise<string[]> {
    try {
      const response = await apiClient.get<{ questions: string[] }>('/chat/suggestions', {
        params: {
          sessionId,
          mode,
        },
        cache: true,
      });

      return response.data.questions;
    } catch (error) {
      // Fail silently for suggestions
      console.error('Failed to get suggested questions:', error);
      return [];
    }
  }
}

// Export singleton instance
export const chatService = new ChatService();
