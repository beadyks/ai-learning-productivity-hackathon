/**
 * LearningArena Component
 * Main chat interface for AI interactions
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 12.1, 12.5, 2.1, 2.2, 2.3, 3.1, 3.2, 13.1
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSessionStore } from '../../stores/sessionStore';
import { useVoiceStore } from '../../stores/voiceStore';
import { useVoiceEngine } from '../../hooks/useVoiceEngine';
import { chatService } from '../../services/chatService';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ModeSelector } from './ModeSelector';
import { VoiceControls } from './VoiceControls';
import type { Message, InteractionMode } from '../../types/message.types';

interface LearningArenaProps {
  className?: string;
}

export const LearningArena: React.FC<LearningArenaProps> = ({ className = '' }) => {
  const {
    sessionId,
    mode,
    messages,
    isTyping,
    addMessage,
    setMode,
    setTyping,
  } = useSessionStore();

  const { voiceEnabled } = useVoiceStore();
  const { speak, stopSpeaking } = useVoiceEngine();

  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  /**
   * Generate unique message ID
   */
  const generateMessageId = (): string => {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  };

  /**
   * Handle sending a message
   * Requirements: 7.1, 7.2 (send and display messages)
   */
  const handleSendMessage = useCallback(
    async (content: string) => {
      // Clear any previous errors
      setError(null);

      // Stop any ongoing speech
      if (voiceEnabled) {
        stopSpeaking();
      }

      // Create and add user message
      // Requirement: 7.1 (display message immediately)
      const userMessage: Message = {
        id: generateMessageId(),
        content,
        type: 'text',
        mode,
        timestamp: new Date(),
        sender: 'user',
      };
      addMessage(userMessage);

      // Show typing indicator
      // Requirement: 7.4 (typing indicator)
      setTyping(true);

      try {
        // Send message to backend
        // Requirement: 7.1, 7.2, 13.1
        const response = await chatService.sendMessage(content, mode, sessionId);

        // Create and add assistant message
        // Requirement: 7.2 (display AI response with distinction)
        const assistantMessage: Message = {
          id: generateMessageId(),
          content: response.text,
          type: 'text',
          mode: response.mode,
          timestamp: new Date(response.timestamp),
          sender: 'assistant',
          metadata: {
            sources: response.sources,
            confidence: response.confidence,
          },
        };
        addMessage(assistantMessage);

        // Speak response if voice is enabled
        // Requirements: 3.1, 3.2 (voice output)
        if (voiceEnabled) {
          try {
            await speak(response.text);
          } catch (voiceError) {
            console.error('Voice synthesis error:', voiceError);
            // Don't show error to user, just fail silently for voice
          }
        }
      } catch (error) {
        // Handle error
        // Requirement: 13.1 (error handling)
        const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
        setError(errorMessage);

        // Add error message to conversation
        const errorMsg: Message = {
          id: generateMessageId(),
          content: `Error: ${errorMessage}. Please try again.`,
          type: 'system',
          mode,
          timestamp: new Date(),
          sender: 'assistant',
        };
        addMessage(errorMsg);
      } finally {
        // Hide typing indicator
        setTyping(false);
      }
    },
    [mode, sessionId, voiceEnabled, addMessage, setTyping, speak, stopSpeaking]
  );

  /**
   * Handle mode change
   * Requirements: 12.1, 12.5 (mode switching with context preservation)
   */
  const handleModeChange = useCallback(
    (newMode: InteractionMode) => {
      // Stop any ongoing speech
      if (voiceEnabled) {
        stopSpeaking();
      }

      // Update mode
      setMode(newMode);

      // Add system message about mode change
      // Requirement: 12.5 (mode change notification)
      const modeChangeMessage: Message = {
        id: generateMessageId(),
        content: `Switched to ${newMode.charAt(0).toUpperCase() + newMode.slice(1)} mode`,
        type: 'system',
        mode: newMode,
        timestamp: new Date(),
        sender: 'assistant',
      };
      addMessage(modeChangeMessage);
    },
    [voiceEnabled, setMode, addMessage, stopSpeaking]
  );

  /**
   * Load more messages for infinite scroll
   * Requirement: 7.5 (infinite scroll)
   */
  const handleLoadMore = useCallback(async () => {
    try {
      const offset = messages.length;
      const history = await chatService.getConversationHistory(sessionId, 20, offset);
      
      if (history.length === 0) {
        setHasMore(false);
      } else {
        // Convert history to messages and add to store
        // Note: In a real implementation, you'd need to handle this properly
        setHasMore(history.length === 20);
      }
    } catch (error) {
      console.error('Failed to load more messages:', error);
    }
  }, [sessionId, messages.length]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      // Stop any ongoing speech when component unmounts
      if (voiceEnabled) {
        stopSpeaking();
      }
    };
  }, [voiceEnabled, stopSpeaking]);

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Header with mode selector and voice controls - Desktop optimized */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Learning Arena</h1>
            <VoiceControls />
          </div>
          <ModeSelector currentMode={mode} onModeChange={handleModeChange} disabled={isTyping} />
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex-shrink-0 bg-red-50 border-b border-red-200 px-4 sm:px-6 py-3">
          <div className="max-w-4xl mx-auto flex items-start">
            <svg
              className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5"
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
            <div className="flex-1">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800 ml-2 min-h-touch min-w-touch flex items-center justify-center"
              aria-label="Dismiss error"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Message list - Constrained width on desktop */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-4xl mx-auto">
          <MessageList
            messages={messages}
            isTyping={isTyping}
            onLoadMore={handleLoadMore}
            hasMore={hasMore}
          />
        </div>
      </div>

      {/* Message input - Constrained width on desktop */}
      <div className="flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <MessageInput onSend={handleSendMessage} disabled={isTyping} />
        </div>
      </div>
    </div>
  );
};
