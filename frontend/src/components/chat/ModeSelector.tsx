/**
 * ModeSelector Component
 * Allows switching between Tutor, Interviewer, and Mentor modes
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

import React, { useState } from 'react';
import type { InteractionMode } from '../../types/message.types';

interface ModeSelectorProps {
  currentMode: InteractionMode;
  onModeChange: (mode: InteractionMode) => void;
  disabled?: boolean;
}

interface ModeInfo {
  id: InteractionMode;
  name: string;
  description: string;
  icon: JSX.Element;
  color: string;
  bgColor: string;
  borderColor: string;
}

const modes: ModeInfo[] = [
  {
    id: 'tutor',
    name: 'Tutor',
    description: 'Get step-by-step explanations and learn concepts thoroughly',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    ),
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-500',
  },
  {
    id: 'interviewer',
    name: 'Interviewer',
    description: 'Practice with interview-style questions and get evaluated',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
      </svg>
    ),
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-500',
  },
  {
    id: 'mentor',
    name: 'Mentor',
    description: 'Get career guidance, motivation, and long-term advice',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-500',
  },
];

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  currentMode,
  onModeChange,
  disabled = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  const currentModeInfo = modes.find((m) => m.id === currentMode)!; // Will always find a match

  /**
   * Handle mode change
   * Requirements: 12.1, 12.5 (mode switching with context preservation)
   */
  const handleModeChange = (mode: InteractionMode) => {
    if (mode !== currentMode && !disabled) {
      onModeChange(mode);
      setIsExpanded(false);
      
      // Show notification
      // Requirement: 12.5 (mode change notification)
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    }
  };

  return (
    <div className="relative">
      {/* Mode change notification */}
      {showNotification && (
        <div 
          className="absolute top-0 left-0 right-0 -mt-16 mx-4 p-3 bg-indigo-600 text-white rounded-lg shadow-lg animate-slide-down z-50"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm font-medium">
              Switched to {currentModeInfo.name} mode
            </span>
          </div>
        </div>
      )}

      {/* Current mode display / Toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-4 py-3 ${currentModeInfo.bgColor} ${currentModeInfo.borderColor} border-2 rounded-lg transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
        aria-label={`Current mode: ${currentModeInfo.name}. Click to change mode.`}
        aria-expanded={isExpanded}
        aria-haspopup="true"
        aria-controls="mode-selector-menu"
      >
        <div className="flex items-center space-x-3">
          <div className={currentModeInfo.color} aria-hidden="true">{currentModeInfo.icon}</div>
          <div className="text-left">
            <div className={`font-semibold ${currentModeInfo.color}`}>
              {currentModeInfo.name} Mode
            </div>
            <div className="text-xs text-gray-600 hidden sm:block">
              {currentModeInfo.description}
            </div>
          </div>
        </div>
        <svg
          className={`w-5 h-5 ${currentModeInfo.color} transition-transform ${
            isExpanded ? 'transform rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Mode options dropdown */}
      {isExpanded && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsExpanded(false)}
            aria-hidden="true"
          />

          {/* Dropdown */}
          <div 
            id="mode-selector-menu"
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-20 overflow-hidden"
            role="menu"
            aria-label="Select interaction mode"
          >
            {modes.map((mode) => {
              const isSelected = mode.id === currentMode;
              
              return (
                <button
                  key={mode.id}
                  onClick={() => handleModeChange(mode.id)}
                  disabled={disabled || isSelected}
                  role="menuitemradio"
                  aria-checked={isSelected}
                  className={`w-full flex items-start space-x-3 px-4 py-3 text-left transition-colors ${
                    isSelected
                      ? `${mode.bgColor} cursor-default`
                      : 'hover:bg-gray-50 cursor-pointer'
                  } disabled:cursor-not-allowed border-b border-gray-100 last:border-b-0`}
                  aria-label={`${mode.name} mode: ${mode.description}`}
                >
                  <div className={mode.color} aria-hidden="true">{mode.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-semibold ${mode.color}`}>{mode.name}</span>
                      {isSelected && (
                        <svg
                          className={`w-5 h-5 ${mode.color}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-label="Currently selected"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{mode.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
