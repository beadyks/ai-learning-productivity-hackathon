/**
 * MessageItem Component
 * Displays a single message with timestamp and metadata
 * Requirements: 7.1, 7.2
 */

import React from 'react';
import type { Message } from '../../types/message.types';
import { formatDistanceToNow } from '../../utils/dateUtils';

interface MessageItemProps {
  message: Message;
  isLatest?: boolean; // Reserved for future use
}

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  const isSystem = message.type === 'system';

  /**
   * Format timestamp for display
   * Requirement: 7.2 (timestamp display)
   */
  const formatTimestamp = (date: Date): string => {
    try {
      return formatDistanceToNow(new Date(date));
    } catch {
      return 'just now';
    }
  };

  /**
   * Get mode badge color
   * Requirement: 7.3 (mode visual indication)
   */
  const getModeColor = (mode: string): string => {
    switch (mode) {
      case 'tutor':
        return 'bg-blue-100 text-blue-800';
      case 'interviewer':
        return 'bg-purple-100 text-purple-800';
      case 'mentor':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  /**
   * System message (special styling)
   */
  if (isSystem) {
    return (
      <div className="flex justify-center py-2">
        <div className="bg-gray-100 text-gray-600 text-sm px-4 py-2 rounded-full">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
      role="article"
      aria-label={`${isUser ? 'Your' : 'Assistant'} message`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Message content */}
      <div className={`flex-1 max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Message bubble */}
        <div
          className={`rounded-lg px-4 py-3 ${
            isUser
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-900'
          }`}
        >
          {/* Mode badge for assistant messages */}
          {!isUser && (
            <div className="mb-2">
              <span className={`inline-block text-xs font-medium px-2 py-1 rounded ${getModeColor(message.mode)}`}>
                {message.mode.charAt(0).toUpperCase() + message.mode.slice(1)} Mode
              </span>
            </div>
          )}

          {/* Message text */}
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>

          {/* Metadata for assistant messages */}
          {!isUser && message.metadata && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              {/* Sources */}
              {message.metadata.sources && message.metadata.sources.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-gray-600 mb-1">Sources:</p>
                  <div className="space-y-1">
                    {message.metadata.sources.map((source, index) => (
                      <div key={index} className="text-xs text-gray-500 flex items-center">
                        <svg
                          className="w-3 h-3 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <span>
                          {source.documentName}
                          {source.pageNumber && ` (p. ${source.pageNumber})`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Confidence score */}
              {message.metadata.confidence !== undefined && (
                <div className="text-xs text-gray-500">
                  Confidence: {Math.round(message.metadata.confidence * 100)}%
                </div>
              )}

              {/* Cached indicator */}
              {message.metadata.cached && (
                <div className="text-xs text-gray-500 flex items-center mt-1">
                  <svg
                    className="w-3 h-3 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
                    />
                  </svg>
                  <span>Cached response</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div
          className={`text-xs text-gray-500 mt-1 px-1 ${isUser ? 'text-right' : 'text-left'}`}
        >
          {formatTimestamp(message.timestamp)}
        </div>
      </div>
    </div>
  );
};
