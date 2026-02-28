/**
 * VoiceControls Component - UI controls for voice interaction
 * Demonstrates usage of the voice engine
 * Requirements: 2.1, 2.2, 3.1, 3.2, 4.1, 4.2
 */

import React, { useEffect, useState } from 'react';
import { useVoiceEngine } from '../../hooks/useVoiceEngine';
import type { LanguageCode } from '../../types/user.types';

export const VoiceControls: React.FC = () => {
  const {
    isListening,
    isSpeaking,
    language,
    interimTranscript,
    finalTranscript,
    error,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    setLanguage,
    getAvailableVoices,
    setVoice,
    isRecognitionSupported,
    isSynthesisSupported,
    clearError,
    clearTranscripts,
  } = useVoiceEngine();

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [testText, setTestText] = useState('Hello! This is a test of the voice engine.');

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = getAvailableVoices();
      setVoices(availableVoices);
    };

    // Voices may load asynchronously
    loadVoices();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [getAvailableVoices]);

  const handleStartListening = async () => {
    try {
      await startListening();
    } catch (err) {
      console.error('Failed to start listening:', err);
    }
  };

  const handleSpeak = async () => {
    try {
      await speak(testText);
    } catch (err) {
      console.error('Failed to speak:', err);
    }
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as LanguageCode);
  };

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setVoice(e.target.value);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <h2 className="text-2xl font-bold">Voice Engine Controls</h2>

      {/* Feature Support Status */}
      <div className="bg-gray-100 p-4 rounded">
        <h3 className="font-semibold mb-2">Feature Support</h3>
        <div className="space-y-1 text-sm">
          <div>
            Speech Recognition:{' '}
            <span className={isRecognitionSupported ? 'text-green-600' : 'text-red-600'}>
              {isRecognitionSupported ? '✓ Supported' : '✗ Not Supported'}
            </span>
          </div>
          <div>
            Speech Synthesis:{' '}
            <span className={isSynthesisSupported ? 'text-green-600' : 'text-red-600'}>
              {isSynthesisSupported ? '✓ Supported' : '✗ Not Supported'}
            </span>
          </div>
          <div>Available Voices: {voices.length}</div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <button
            onClick={clearError}
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>
      )}

      {/* Language Selection */}
      <div>
        <label className="block text-sm font-medium mb-1">Language</label>
        <select
          value={language}
          onChange={handleLanguageChange}
          className="w-full p-2 border rounded"
        >
          <option value="en-IN">English (India)</option>
          <option value="hi-IN">Hindi (India)</option>
          <option value="en-US">English (US)</option>
        </select>
      </div>

      {/* Voice Selection */}
      {voices.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-1">Voice</label>
          <select
            onChange={handleVoiceChange}
            className="w-full p-2 border rounded"
          >
            <option value="">Default Voice</option>
            {voices.map((voice) => (
              <option key={voice.voiceURI} value={voice.voiceURI}>
                {voice.name} ({voice.lang}) {voice.localService ? '(Local)' : '(Network)'}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Speech Recognition Controls */}
      {isRecognitionSupported && (
        <div className="space-y-2">
          <h3 className="font-semibold">Speech Recognition</h3>
          <div className="flex gap-2">
            <button
              onClick={handleStartListening}
              disabled={isListening}
              className={`px-4 py-2 rounded ${
                isListening
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isListening ? '🎤 Listening...' : 'Start Listening'}
            </button>
            <button
              onClick={stopListening}
              disabled={!isListening}
              className={`px-4 py-2 rounded ${
                !isListening
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              Stop Listening
            </button>
            <button
              onClick={clearTranscripts}
              className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600"
            >
              Clear
            </button>
          </div>

          {/* Transcripts */}
          <div className="space-y-2">
            {interimTranscript && (
              <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                <div className="text-xs text-gray-600">Interim:</div>
                <div className="italic text-gray-700">{interimTranscript}</div>
              </div>
            )}
            {finalTranscript && (
              <div className="p-2 bg-green-50 border border-green-200 rounded">
                <div className="text-xs text-gray-600">Final:</div>
                <div className="font-medium">{finalTranscript}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Speech Synthesis Controls */}
      {isSynthesisSupported && (
        <div className="space-y-2">
          <h3 className="font-semibold">Speech Synthesis</h3>
          <textarea
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            className="w-full p-2 border rounded"
            rows={3}
            placeholder="Enter text to speak..."
          />
          <div className="flex gap-2">
            <button
              onClick={handleSpeak}
              disabled={isSpeaking}
              className={`px-4 py-2 rounded ${
                isSpeaking
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {isSpeaking ? '🔊 Speaking...' : 'Speak'}
            </button>
            <button
              onClick={stopSpeaking}
              disabled={!isSpeaking}
              className={`px-4 py-2 rounded ${
                !isSpeaking
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              Stop
            </button>
          </div>
        </div>
      )}

      {/* No Support Message */}
      {!isRecognitionSupported && !isSynthesisSupported && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <strong className="font-bold">Browser Not Supported</strong>
          <p className="text-sm mt-1">
            Your browser does not support the Web Speech API. Please use a modern browser like
            Chrome, Edge, or Safari.
          </p>
        </div>
      )}
    </div>
  );
};

