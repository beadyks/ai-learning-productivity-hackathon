/**
 * MessageList Component
 * Displays conversation messages with infinite scroll
 * Requirements: 7.1, 7.2, 7.5
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { Message } from '../../types/message.types';
import { MessageItem } from './MessageItem';

interface MessageListProps {
  messages: Message[];
  isTyping?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isTyping = false,
  onLoadMore,
  hasMore = false,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  /**
   * Scroll to bottom of message list
   * Requirement: 7.1 (display messages immediately)
   */
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  /**
   * Check if user is near bottom of scroll
   */
  const isNearBottom = useCallback(() => {
    if (!containerRef.current) return true;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    return distanceFromBottom < 100; // Within 100px of bottom
  }, []);

  /**
   * Handle scroll event for infinite scroll
   * Requirement: 7.5 (infinite scroll)
   */
  const handleScroll = useCallback(() => {
    if (!containerRef.current || !onLoadMore || !hasMore || isLoadingMore) return;

    const { scrollTop } = containerRef.current;
    
    // Check if scrolled to top (load more messages)
    if (scrollTop === 0) {
      setIsLoadingMore(true);
      onLoadMore();
      // Reset loading state after a delay
      setTimeout(() => setIsLoadingMore(false), 500);
    }

    // Update auto-scroll behavior based on scroll position
    setShouldAutoScroll(isNearBottom());
  }, [onLoadMore, hasMore, isLoadingMore, isNearBottom]);

  /**
   * Auto-scroll to bottom when new messages arrive
   * Requirement: 7.1 (display messages immediately)
   */
  useEffect(() => {
    if (shouldAutoScroll && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, shouldAutoScroll, scrollToBottom]);

  /**
   * Scroll to bottom when typing indicator appears
   */
  useEffect(() => {
    if (isTyping && shouldAutoScroll) {
      scrollToBottom();
    }
  }, [isTyping, shouldAutoScroll, scrollToBottom]);

  /**
   * Initial scroll to bottom on mount
   */
  useEffect(() => {
    scrollToBottom('auto');
  }, [scrollToBottom]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
      role="log"
      aria-live="polite"
      aria-atomic="false"
      aria-label="Conversation messages"
      aria-relevant="additions"
    >
      {/* Loading indicator for infinite scroll */}
      {isLoadingMore && (
        <div className="flex justify-center py-2" role="status" aria-label="Loading more messages">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" aria-hidden="true" />
          <span className="sr-only">Loading more messages</span>
        </div>
      )}

      {/* Empty state */}
      {messages.length === 0 && !isTyping && (
        <div className="flex flex-col items-center justify-center h-full text-center px-4" role="status">
          <div className="text-gray-400 mb-2">
            <svg
              className="w-16 h-16 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            Start a conversation
          </h3>
          <p className="text-sm text-gray-500 max-w-sm">
            Ask a question or use the microphone to speak with your AI learning assistant
          </p>
        </div>
      )}

      {/* Message list */}
      {messages.map((message, index) => (
        <MessageItem
          key={message.id}
          message={message}
          isLatest={index === messages.length - 1}
        />
      ))}

      {/* Typing indicator */}
      {isTyping && (
        <div className="flex items-start space-x-3" role="status" aria-live="polite" aria-label="AI assistant is typing">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <div className="bg-gray-100 rounded-lg px-4 py-3 inline-block">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} aria-hidden="true" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} aria-hidden="true" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} aria-hidden="true" />
              </div>
            </div>
            <span className="sr-only">AI assistant is typing</span>
          </div>
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
};
