/**
 * TypingIndicator Component
 * Animated typing indicator for AI responses
 * Requirement: 7.4
 */

import React from 'react';

interface TypingIndicatorProps {
  visible?: boolean;
  className?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  visible = true,
  className = '',
}) => {
  if (!visible) return null;

  return (
    <div className={`flex items-start space-x-3 ${className}`} role="status" aria-live="polite" aria-label="AI assistant is typing">
      {/* AI Avatar */}
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

      {/* Typing animation */}
      <div className="flex-1">
        <div className="bg-gray-100 rounded-lg px-4 py-3 inline-block">
          <div className="flex space-x-1">
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: '0ms', animationDuration: '1s' }}
              aria-hidden="true"
            />
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: '150ms', animationDuration: '1s' }}
              aria-hidden="true"
            />
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: '300ms', animationDuration: '1s' }}
              aria-hidden="true"
            />
          </div>
        </div>
        <span className="sr-only">AI assistant is typing</span>
      </div>
    </div>
  );
};
