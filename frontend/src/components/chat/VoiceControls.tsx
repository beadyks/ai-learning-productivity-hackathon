/**
 * VoiceControls Component
 * Voice output controls for chat interface
 * Requirements: 2.1, 2.2, 2.3, 3.1, 3.2
 */

import React from 'react';
import { useVoiceEngine } from '../../hooks/useVoiceEngine';
import { useVoiceStore } from '../../stores/voiceStore';

interface VoiceControlsProps {
  className?: string;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({ className = '' }) => {
  const {
    isSpeaking,
    isSynthesisSupported,
    stopSpeaking,
    pauseSpeaking,
    resumeSpeaking,
  } = useVoiceEngine();

  const { voiceEnabled, setVoiceEnabled } = useVoiceStore();

  if (!isSynthesisSupported) {
    return null;
  }

  /**
   * Toggle voice output
   * Requirement: 3.1, 3.2 (voice output controls)
   */
  const handleToggleVoice = () => {
    if (isSpeaking) {
      stopSpeaking();
    }
    setVoiceEnabled(!voiceEnabled);
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`} role="toolbar" aria-label="Voice output controls">
      {/* Voice output toggle */}
      <button
        onClick={handleToggleVoice}
        className={`p-2 rounded-lg transition-colors ${
          voiceEnabled
            ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        aria-label={voiceEnabled ? 'Disable voice output' : 'Enable voice output'}
        aria-pressed={voiceEnabled}
        title={voiceEnabled ? 'Voice output enabled' : 'Voice output disabled'}
      >
        {voiceEnabled ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
            />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
            />
          </svg>
        )}
      </button>

      {/* Playback controls (only show when speaking) */}
      {isSpeaking && voiceEnabled && (
        <div role="group" aria-label="Voice playback controls">
          <button
            onClick={pauseSpeaking}
            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            aria-label="Pause speech playback"
            title="Pause"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>

          <button
            onClick={resumeSpeaking}
            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            aria-label="Resume speech playback"
            title="Resume"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>

          <button
            onClick={stopSpeaking}
            className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
            aria-label="Stop speech playback"
            title="Stop"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          </button>
        </div>
      )}

      {/* Speaking indicator */}
      {isSpeaking && voiceEnabled && (
        <div 
          className="flex items-center text-sm text-indigo-600"
          role="status"
          aria-live="polite"
          aria-label="Voice playback in progress"
        >
          <div className="flex space-x-1 mr-2" aria-hidden="true">
            <div className="w-1 h-3 bg-indigo-600 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
            <div className="w-1 h-4 bg-indigo-600 rounded-full animate-pulse" style={{ animationDelay: '100ms' }} />
            <div className="w-1 h-3 bg-indigo-600 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
          </div>
          <span>Speaking...</span>
        </div>
      )}
    </div>
  );
};
