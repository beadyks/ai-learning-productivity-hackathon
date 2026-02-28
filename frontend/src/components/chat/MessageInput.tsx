/**
 * MessageInput Component
 * Text input with voice button for sending messages
 * Includes keyboard viewport adjustment to keep input visible
 * Requirements: 2.1, 7.1, 11.5
 */

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useVoiceEngine } from '../../hooks/useVoiceEngine';
import { useKeyboardViewport } from '../../hooks/useKeyboardViewport';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  disabled = false,
  placeholder = 'Type your message or use voice...',
  maxLength = 2000,
}) => {
  const [message, setMessage] = useState('');
  const [showCharCount, setShowCharCount] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    isListening,
    isRecognitionSupported,
    startListening,
    stopListening,
    finalTranscript,
    clearTranscripts,
    error: voiceError,
    clearError,
  } = useVoiceEngine();

  // Keyboard viewport adjustment
  // Requirement: 11.5 (adjust viewport to keep inputs visible)
  const { scrollToFocusedElement } = useKeyboardViewport({
    onKeyboardShow: () => {
      setKeyboardVisible(true);
    },
    onKeyboardHide: () => {
      setKeyboardVisible(false);
    },
    autoScroll: true,
    scrollOffset: 20,
  });

  // Scroll input into view when keyboard becomes visible
  useEffect(() => {
    if (keyboardVisible) {
      setTimeout(() => {
        scrollToFocusedElement();
      }, 100);
    }
  }, [keyboardVisible, scrollToFocusedElement]);

  /**
   * Auto-resize textarea based on content
   */
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  /**
   * Handle voice transcript
   * Requirement: 2.1 (voice input)
   */
  useEffect(() => {
    if (finalTranscript) {
      setMessage((prev) => {
        const newMessage = prev ? `${prev} ${finalTranscript}` : finalTranscript;
        return newMessage.slice(0, maxLength);
      });
      clearTranscripts();
    }
  }, [finalTranscript, clearTranscripts, maxLength]);

  /**
   * Handle message input change
   * Requirement: 7.1 (text input)
   */
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setMessage(value);
    }
  };

  /**
   * Handle send button click
   * Requirement: 7.1 (send message)
   */
  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      onSend(trimmedMessage);
      setMessage('');
      setShowCharCount(false);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  /**
   * Handle Enter key press (send message)
   * Shift+Enter for new line
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /**
   * Toggle voice input
   * Requirement: 2.1 (voice input button)
   */
  const handleVoiceToggle = async () => {
    if (isListening) {
      stopListening();
    } else {
      clearError();
      await startListening();
    }
  };

  /**
   * Show character count when approaching limit
   */
  useEffect(() => {
    setShowCharCount(message.length > maxLength * 0.8);
  }, [message.length, maxLength]);

  const isMessageValid = message.trim().length > 0;
  const charactersRemaining = maxLength - message.length;

  return (
    <div 
      ref={containerRef}
      className={`border-t border-gray-200 bg-white px-4 py-4 transition-all ${
        keyboardVisible ? 'pb-safe-bottom' : ''
      }`}
      role="region"
      aria-label="Message input area"
    >
      {/* Voice error display */}
      {voiceError && (
        <div 
          className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
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
            <p className="text-sm text-red-800">{voiceError}</p>
          </div>
          <button
            onClick={clearError}
            className="text-red-600 hover:text-red-800 ml-2 min-h-touch min-w-touch flex items-center justify-center"
            aria-label="Dismiss voice error message"
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
      )}

      {/* Input container */}
      <div className="flex items-end space-x-2">
        {/* Voice button - Touch optimized */}
        {isRecognitionSupported && (
          <button
            onClick={handleVoiceToggle}
            disabled={disabled}
            className={`flex-shrink-0 p-3 min-h-touch min-w-touch rounded-full transition-colors flex items-center justify-center ${
              isListening
                ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-label={isListening ? 'Stop voice recording' : 'Start voice recording'}
            aria-pressed={isListening}
            title={isListening ? 'Stop listening' : 'Start voice input'}
          >
            {isListening ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            )}
          </button>
        )}

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            rows={1}
            className="w-full px-4 py-3 pr-12 min-h-touch border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-base"
            style={{ maxHeight: '150px' }}
            aria-label="Type your message here"
            aria-describedby={showCharCount ? 'char-count' : undefined}
          />

          {/* Character count */}
          {showCharCount && (
            <div
              id="char-count"
              className={`absolute bottom-2 right-2 text-xs ${
                charactersRemaining < 100 ? 'text-red-600' : 'text-gray-500'
              }`}
              aria-live="polite"
              aria-label={`${charactersRemaining} characters remaining`}
            >
              {charactersRemaining}
            </div>
          )}
        </div>

        {/* Send button - Touch optimized */}
        <button
          onClick={handleSend}
          disabled={disabled || !isMessageValid}
          className="flex-shrink-0 p-3 min-h-touch min-w-touch bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600 flex items-center justify-center"
          aria-label="Send message"
          aria-disabled={disabled || !isMessageValid}
          title="Send message (Enter)"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>
      </div>

      {/* Listening indicator */}
      {isListening && (
        <div 
          className="mt-2 flex items-center text-sm text-red-600"
          role="status"
          aria-live="polite"
          aria-label="Voice recording in progress"
        >
          <div className="w-2 h-2 bg-red-600 rounded-full mr-2 animate-pulse" aria-hidden="true" />
          <span>Listening...</span>
        </div>
      )}

      {/* Helper text */}
      <div className="mt-2 text-xs text-gray-500">
        Press Enter to send, Shift+Enter for new line
        {isRecognitionSupported && ' • Click microphone to use voice input'}
      </div>
    </div>
  );
};
