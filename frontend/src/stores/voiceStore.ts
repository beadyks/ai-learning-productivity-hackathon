/**
 * Voice Store - Zustand state management for voice interaction state
 * Manages speech recognition, text-to-speech, and language preferences
 * Requirements: 2.1, 2.2, 3.1, 4.1
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { VoiceState, VoiceActions } from '../types/voice.types';
import type { LanguageCode } from '../types/user.types';

type VoiceStore = VoiceState & VoiceActions;

/**
 * Voice store for managing voice interaction state
 * Persists language and voice preferences to localStorage
 */
export const useVoiceStore = create<VoiceStore>()(
  persist(
    (set) => ({
      // Initial state
      isListening: false,
      isSpeaking: false,
      language: 'en-IN',
      selectedVoice: undefined,
      interimTranscript: '',
      finalTranscript: '',
      error: undefined,
      voiceEnabled: true, // Voice output enabled by default

      // Actions
      setListening: (isListening: boolean) =>
        set({ isListening }),

      setSpeaking: (isSpeaking: boolean) =>
        set({ isSpeaking }),

      setLanguage: (language: LanguageCode) =>
        set({ language }),

      setInterimTranscript: (transcript: string) =>
        set({ interimTranscript: transcript }),

      setFinalTranscript: (transcript: string) =>
        set({
          finalTranscript: transcript,
          interimTranscript: '', // Clear interim when final is set
        }),

      setError: (error?: string) =>
        set({ error }),

      setVoiceEnabled: (voiceEnabled: boolean) =>
        set({ voiceEnabled }),
    }),
    {
      name: 'voice-storage', // localStorage key
      partialize: (state) => ({
        // Only persist preferences, not transient state
        language: state.language,
        selectedVoice: state.selectedVoice,
        voiceEnabled: state.voiceEnabled,
      }),
    }
  )
);
