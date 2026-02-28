/**
 * useVoiceEngine Hook - React hook for voice engine integration
 * Provides easy access to voice recognition and synthesis with state management
 * Optimized for minimal re-renders and low latency
 * Requirements: 2.1, 2.2, 3.1, 3.2, 4.1, 4.2, 4.3, 4.4, 4.5, 14.4
 */

import { useEffect, useCallback, useRef } from 'react';
import { voiceEngine } from '../services/voiceEngine';
import { useVoiceStore } from '../stores/voiceStore';
import type { SpeechOptions, TranscriptResult } from '../types/voice.types';
import type { LanguageCode } from '../types/user.types';

/**
 * Hook for using the voice engine with integrated state management
 * Optimized to reduce unnecessary re-renders
 */
export const useVoiceEngine = () => {
  const {
    isListening,
    isSpeaking,
    language,
    selectedVoice,
    interimTranscript,
    finalTranscript,
    error,
    setListening,
    setSpeaking,
    setLanguage: setStoreLanguage,
    setInterimTranscript,
    setFinalTranscript,
    setError,
  } = useVoiceStore();

  // Use refs to avoid recreating callbacks on every render - Requirement 14.4
  const setListeningRef = useRef(setListening);
  const setSpeakingRef = useRef(setSpeaking);
  const setInterimTranscriptRef = useRef(setInterimTranscript);
  const setFinalTranscriptRef = useRef(setFinalTranscript);
  const setErrorRef = useRef(setError);

  // Update refs when functions change
  useEffect(() => {
    setListeningRef.current = setListening;
    setSpeakingRef.current = setSpeaking;
    setInterimTranscriptRef.current = setInterimTranscript;
    setFinalTranscriptRef.current = setFinalTranscript;
    setErrorRef.current = setError;
  }, [setListening, setSpeaking, setInterimTranscript, setFinalTranscript, setError]);

  // Set up transcript callback - only once
  useEffect(() => {
    voiceEngine.onTranscript((result: TranscriptResult) => {
      if (result.isFinal) {
        setFinalTranscriptRef.current(result.transcript);
        setInterimTranscriptRef.current('');
      } else {
        setInterimTranscriptRef.current(result.transcript);
      }
    });

    voiceEngine.onError((errorMessage: string) => {
      setErrorRef.current(errorMessage);
      setListeningRef.current(false);
      setSpeakingRef.current(false);
    });
  }, []); // Empty deps - only set up once

  // Start listening for speech input
  const startListening = useCallback(
    async (lang?: LanguageCode) => {
      const targetLanguage = lang || language;
      try {
        setError(undefined);
        await voiceEngine.startListening(targetLanguage);
        setListening(true);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to start listening';
        setError(errorMessage);
        setListening(false);
      }
    },
    [language, setError, setListening]
  );

  // Stop listening
  const stopListening = useCallback(() => {
    voiceEngine.stopListening();
    setListening(false);
  }, [setListening]);

  // Speak text
  const speak = useCallback(
    async (text: string, options?: SpeechOptions) => {
      try {
        setError(undefined);
        setSpeaking(true);

        const speechOptions: SpeechOptions = {
          language: options?.language || language,
          voice: options?.voice || selectedVoice,
          rate: options?.rate,
          pitch: options?.pitch,
          volume: options?.volume,
        };

        await voiceEngine.speak(text, speechOptions);
        setSpeaking(false);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to speak';
        setError(errorMessage);
        setSpeaking(false);
      }
    },
    [language, selectedVoice, setError, setSpeaking]
  );

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    voiceEngine.stopSpeaking();
    setSpeaking(false);
  }, [setSpeaking]);

  // Pause speaking
  const pauseSpeaking = useCallback(() => {
    voiceEngine.pauseSpeaking();
  }, []);

  // Resume speaking
  const resumeSpeaking = useCallback(() => {
    voiceEngine.resumeSpeaking();
  }, []);

  // Set language
  const setLanguage = useCallback(
    (lang: LanguageCode) => {
      setStoreLanguage(lang);
      voiceEngine.setLanguage(lang);
    },
    [setStoreLanguage]
  );

  // Get available voices
  const getAvailableVoices = useCallback(() => {
    return voiceEngine.getAvailableVoices();
  }, []);

  // Get voices for current language
  const getVoicesForLanguage = useCallback(
    (lang?: LanguageCode) => {
      return voiceEngine.getVoicesForLanguage(lang || language);
    },
    [language]
  );

  // Set voice
  const setVoice = useCallback(
    (voiceURI: string) => {
      voiceEngine.setVoice(voiceURI);
      useVoiceStore.setState({ selectedVoice: voiceURI });
    },
    []
  );

  // Get best voice for language
  const getBestVoiceForLanguage = useCallback(
    (lang?: LanguageCode) => {
      return voiceEngine.getBestVoiceForLanguage(lang || language);
    },
    [language]
  );

  // Check feature support
  const isRecognitionSupported = voiceEngine.isSpeechRecognitionSupported();
  const isSynthesisSupported = voiceEngine.isSpeechSynthesisSupported();
  const featureSupport = voiceEngine.getFeatureSupport();

  // Clear error
  const clearError = useCallback(() => {
    setError(undefined);
  }, [setError]);

  // Clear transcripts
  const clearTranscripts = useCallback(() => {
    setInterimTranscript('');
    setFinalTranscript('');
  }, [setInterimTranscript, setFinalTranscript]);

  return {
    // State
    isListening,
    isSpeaking,
    language,
    selectedVoice,
    interimTranscript,
    finalTranscript,
    error,

    // Speech Recognition
    startListening,
    stopListening,

    // Speech Synthesis
    speak,
    stopSpeaking,
    pauseSpeaking,
    resumeSpeaking,

    // Configuration
    setLanguage,
    getAvailableVoices,
    getVoicesForLanguage,
    setVoice,
    getBestVoiceForLanguage,

    // Feature Detection
    isRecognitionSupported,
    isSynthesisSupported,
    featureSupport,

    // Utilities
    clearError,
    clearTranscripts,
  };
};

