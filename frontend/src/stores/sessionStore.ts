/**
 * Session Store - Zustand state management for conversation state
 * Manages message history, interaction modes, and conversation context
 * Requirements: 7.1, 7.2, 12.1
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  SessionState,
  SessionActions,
  Message,
  InteractionMode,
  ConversationContext,
} from '../types/message.types';

type SessionStore = SessionState & SessionActions;

/**
 * Generate a unique session ID
 */
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Session store for managing conversation state
 * Persists session data to localStorage for continuity across page reloads
 */
export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({
      // Initial state
      sessionId: generateSessionId(),
      mode: 'tutor',
      messages: [],
      isTyping: false,
      context: {
        recentQueries: [],
        relevantDocuments: [],
      },

      // Actions
      addMessage: (message: Message) =>
        set((state) => ({
          messages: [...state.messages, message],
          context: {
            ...state.context,
            recentQueries: [
              message.content,
              ...state.context.recentQueries.slice(0, 9), // Keep last 10 queries
            ],
          },
        })),

      setMode: (mode: InteractionMode) =>
        set({ mode }),

      setTyping: (isTyping: boolean) =>
        set({ isTyping }),

      clearMessages: () =>
        set({
          messages: [],
          sessionId: generateSessionId(),
          context: {
            recentQueries: [],
            relevantDocuments: [],
          },
        }),

      updateContext: (contextUpdate: Partial<ConversationContext>) =>
        set((state) => ({
          context: {
            ...state.context,
            ...contextUpdate,
          },
        })),
    }),
    {
      name: 'session-storage', // localStorage key
      partialize: (state) => ({
        // Persist everything except typing indicator
        sessionId: state.sessionId,
        mode: state.mode,
        messages: state.messages,
        context: state.context,
      }),
    }
  )
);
