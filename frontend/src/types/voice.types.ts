/**
 * Voice engine type definitions
 * Covers speech recognition, text-to-speech, and voice state management
 */

import { LanguageCode } from './user.types';

export interface SpeechOptions {
  language: LanguageCode;
  voice?: string;
  rate?: number; // 0.1 to 10
  pitch?: number; // 0 to 2
  volume?: number; // 0 to 1
}

export interface TranscriptResult {
  transcript: string;
  isFinal: boolean;
  confidence: number;
}

export interface VoiceState {
  isListening: boolean;
  isSpeaking: boolean;
  language: LanguageCode;
  selectedVoice?: string;
  interimTranscript: string;
  finalTranscript: string;
  error?: string;
  voiceEnabled: boolean;
}

export interface VoiceActions {
  setListening: (isListening: boolean) => void;
  setSpeaking: (isSpeaking: boolean) => void;
  setLanguage: (language: LanguageCode) => void;
  setInterimTranscript: (transcript: string) => void;
  setFinalTranscript: (transcript: string) => void;
  setError: (error?: string) => void;
  setVoiceEnabled: (voiceEnabled: boolean) => void;
}

export interface VoiceEngine {
  // Speech Recognition
  startListening(language: LanguageCode): Promise<void>;
  stopListening(): void;
  isListening(): boolean;
  
  // Speech Synthesis
  speak(text: string, options?: SpeechOptions): Promise<void>;
  stopSpeaking(): void;
  pauseSpeaking(): void;
  resumeSpeaking(): void;
  isSpeaking(): boolean;
  
  // Configuration
  setLanguage(language: LanguageCode): void;
  getAvailableVoices(): SpeechSynthesisVoice[];
  setVoice(voiceURI: string): void;
  
  // Feature Detection
  isSpeechRecognitionSupported(): boolean;
  isSpeechSynthesisSupported(): boolean;
}
