/**
 * Browser Voice Engine - Zero-cost voice processing using Web Speech API
 * Implements speech recognition and text-to-speech using browser-native APIs
 * Optimized for low latency and minimal processing overhead
 * Requirements: 2.1, 2.2, 3.1, 3.2, 4.1, 4.2, 4.3, 4.4, 4.5, 14.4
 */

import type {
  VoiceEngine,
  SpeechOptions,
  TranscriptResult,
} from '../types/voice.types';
import type { LanguageCode } from '../types/user.types';

/**
 * Browser-based Voice Engine implementation using Web Speech API
 * Provides zero-cost speech recognition and synthesis with optimized latency
 */
export class BrowserVoiceEngine implements VoiceEngine {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis;
  private onTranscriptCallback?: (result: TranscriptResult) => void;
  private onErrorCallback?: (error: string) => void;
  private currentLanguage: LanguageCode = 'en-IN';
  private selectedVoiceURI?: string;
  private listening = false;
  private speaking = false;
  private voicesCache: SpeechSynthesisVoice[] = [];
  private voicesCacheTime = 0;
  private readonly VOICE_CACHE_TTL = 60000; // Cache voices for 1 minute
  private transcriptBuffer: string = ''; // Buffer for optimizing transcript updates
  private transcriptDebounceTimer: number | null = null;
  private readonly TRANSCRIPT_DEBOUNCE_MS = 50; // Debounce interim results

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.recognition = this.initializeSpeechRecognition();
    
    // Pre-load voices cache - Requirement 14.4
    this.preloadVoices();
  }

  /**
   * Pre-load voices to reduce latency on first use
   * Requirement 14.4
   */
  private preloadVoices(): void {
    // Voices may not be immediately available
    if (this.synthesis.getVoices().length > 0) {
      this.voicesCache = this.synthesis.getVoices();
      this.voicesCacheTime = Date.now();
    } else {
      // Wait for voices to load
      this.synthesis.addEventListener('voiceschanged', () => {
        this.voicesCache = this.synthesis.getVoices();
        this.voicesCacheTime = Date.now();
      }, { once: true });
    }
  }

  /**
   * Get cached voices or refresh if stale
   * Requirement 14.4
   */
  private getCachedVoices(): SpeechSynthesisVoice[] {
    const now = Date.now();
    if (this.voicesCache.length === 0 || now - this.voicesCacheTime > this.VOICE_CACHE_TTL) {
      this.voicesCache = this.synthesis.getVoices();
      this.voicesCacheTime = now;
    }
    return this.voicesCache;
  }

  /**
   * Initialize Web Speech API for speech recognition
   * Supports both standard and webkit-prefixed implementations
   */
  private initializeSpeechRecognition(): SpeechRecognition | null {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      console.warn('Speech Recognition API not supported in this browser');
      return null;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    // Handle recognition results - Optimized for low latency (Requirement 14.4)
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1];
      if (!result || !result[0]) {
        return;
      }
      
      const transcript = result[0].transcript;
      const isFinal = result.isFinal;
      const confidence = result[0].confidence;

      // For final results, send immediately without debouncing
      if (isFinal) {
        // Clear any pending debounced updates
        if (this.transcriptDebounceTimer !== null) {
          clearTimeout(this.transcriptDebounceTimer);
          this.transcriptDebounceTimer = null;
        }
        
        this.onTranscriptCallback?.({
          transcript,
          isFinal,
          confidence,
        });
      } else {
        // Debounce interim results to reduce processing overhead
        this.transcriptBuffer = transcript;
        
        if (this.transcriptDebounceTimer !== null) {
          clearTimeout(this.transcriptDebounceTimer);
        }
        
        this.transcriptDebounceTimer = window.setTimeout(() => {
          this.onTranscriptCallback?.({
            transcript: this.transcriptBuffer,
            isFinal: false,
            confidence,
          });
          this.transcriptDebounceTimer = null;
        }, this.TRANSCRIPT_DEBOUNCE_MS);
      }
    };

    // Handle recognition errors
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errorMessage = this.getRecognitionErrorMessage(event.error);
      this.onErrorCallback?.(errorMessage);
      this.listening = false;
    };

    // Handle recognition end
    recognition.onend = () => {
      this.listening = false;
    };

    return recognition;
  }

  /**
   * Convert Web Speech API error codes to user-friendly messages
   */
  private getRecognitionErrorMessage(error: string): string {
    const errorMessages: Record<string, string> = {
      'no-speech': 'No speech detected. Please try speaking again.',
      'audio-capture': 'Microphone not accessible. Please check permissions.',
      'not-allowed': 'Microphone permission denied. Please grant access.',
      'network': 'Network error. Please check your connection.',
      'aborted': 'Speech recognition was aborted.',
      'bad-grammar': 'Speech recognition grammar error.',
      'language-not-supported': 'Selected language is not supported.',
    };

    return (
      errorMessages[error] ||
      `Speech recognition error: ${error}. Please try again.`
    );
  }

  /**
   * Convert synthesis error to user-friendly message
   */
  private getSynthesisErrorMessage(error: SpeechSynthesisErrorEvent): string {
    const errorMessages: Record<string, string> = {
      canceled: 'Speech was canceled.',
      interrupted: 'Speech was interrupted.',
      'audio-busy': 'Audio system is busy. Please try again.',
      'audio-hardware': 'Audio hardware error. Please check your speakers.',
      network: 'Network error during speech synthesis.',
      'synthesis-unavailable': 'Speech synthesis is not available.',
      'synthesis-failed': 'Speech synthesis failed.',
      'language-unavailable': 'Selected language voice is not available.',
      'voice-unavailable': 'Selected voice is not available.',
      'text-too-long': 'Text is too long for speech synthesis.',
      'invalid-argument': 'Invalid speech synthesis argument.',
    };

    return (
      errorMessages[error.error] ||
      `Speech synthesis error: ${error.error}. Please try again.`
    );
  }

  /**
   * Set callback for transcript results
   */
  public onTranscript(callback: (result: TranscriptResult) => void): void {
    this.onTranscriptCallback = callback;
  }

  /**
   * Set callback for errors
   */
  public onError(callback: (error: string) => void): void {
    this.onErrorCallback = callback;
  }

  // Speech Recognition Methods

  /**
   * Start listening for speech input
   * Requirements: 2.1, 2.2
   */
  async startListening(language: LanguageCode): Promise<void> {
    if (!this.recognition) {
      throw new Error(
        'Speech recognition not supported. Please use text input instead.'
      );
    }

    if (this.listening) {
      console.warn('Already listening');
      return;
    }

    try {
      this.currentLanguage = language;
      this.recognition.lang = language;
      this.recognition.start();
      this.listening = true;
    } catch (error) {
      this.listening = false;
      throw new Error(
        `Failed to start speech recognition: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Stop listening for speech input
   * Requirements: 2.1, 2.2
   */
  stopListening(): void {
    if (!this.recognition || !this.listening) {
      return;
    }

    try {
      // Clear any pending debounced updates
      if (this.transcriptDebounceTimer !== null) {
        clearTimeout(this.transcriptDebounceTimer);
        this.transcriptDebounceTimer = null;
      }
      
      this.recognition.stop();
      this.listening = false;
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
      this.listening = false;
    }
  }

  /**
   * Check if currently listening
   */
  isListening(): boolean {
    return this.listening;
  }

  // Speech Synthesis Methods

  /**
   * Speak text using text-to-speech
   * Optimized for low latency
   * Requirements: 3.1, 3.2, 14.4
   */
  async speak(text: string, options?: SpeechOptions): Promise<void> {
    if (!this.synthesis) {
      throw new Error(
        'Speech synthesis not supported. Text will be displayed only.'
      );
    }

    // Stop any current speech immediately for faster response
    if (this.speaking) {
      this.synthesis.cancel(); // More immediate than stopSpeaking()
    }

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);

      // Set language
      utterance.lang = options?.language || this.currentLanguage;

      // Use cached voices for faster lookup - Requirement 14.4
      const voices = this.getCachedVoices();
      
      // Set voice if specified
      if (options?.voice) {
        const voice = voices.find((v) => v.voiceURI === options.voice);
        if (voice) {
          utterance.voice = voice;
        }
      } else if (this.selectedVoiceURI) {
        const voice = voices.find((v) => v.voiceURI === this.selectedVoiceURI);
        if (voice) {
          utterance.voice = voice;
        }
      } else {
        // Auto-select best voice for language if none specified
        const bestVoice = this.getBestVoiceForLanguageInternal(
          options?.language || this.currentLanguage,
          voices
        );
        if (bestVoice) {
          utterance.voice = bestVoice;
        }
      }

      // Set speech parameters
      utterance.rate = options?.rate ?? 1;
      utterance.pitch = options?.pitch ?? 1;
      utterance.volume = options?.volume ?? 1;

      // Handle events
      utterance.onstart = () => {
        this.speaking = true;
      };

      utterance.onend = () => {
        this.speaking = false;
        resolve();
      };

      utterance.onerror = (error) => {
        this.speaking = false;
        const errorMessage = this.getSynthesisErrorMessage(error);
        this.onErrorCallback?.(errorMessage);
        reject(new Error(errorMessage));
      };

      // Speak immediately
      this.synthesis.speak(utterance);
    });
  }

  /**
   * Stop speaking immediately
   * Requirements: 3.2
   */
  stopSpeaking(): void {
    if (!this.synthesis) {
      return;
    }

    try {
      this.synthesis.cancel();
      this.speaking = false;
    } catch (error) {
      console.error('Error stopping speech:', error);
    }
  }

  /**
   * Pause speaking
   * Requirements: 3.2
   */
  pauseSpeaking(): void {
    if (!this.synthesis || !this.speaking) {
      return;
    }

    try {
      this.synthesis.pause();
    } catch (error) {
      console.error('Error pausing speech:', error);
    }
  }

  /**
   * Resume speaking
   * Requirements: 3.2
   */
  resumeSpeaking(): void {
    if (!this.synthesis) {
      return;
    }

    try {
      this.synthesis.resume();
    } catch (error) {
      console.error('Error resuming speech:', error);
    }
  }

  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean {
    return this.speaking;
  }

  // Configuration Methods

  /**
   * Set the language for speech recognition and synthesis
   * Requirements: 4.1, 4.2, 4.5
   */
  setLanguage(language: LanguageCode): void {
    this.currentLanguage = language;

    // Update recognition language if active
    if (this.recognition && this.listening) {
      this.stopListening();
      this.startListening(language).catch((error) => {
        console.error('Error restarting recognition with new language:', error);
      });
    }
  }

  /**
   * Get available voices for speech synthesis
   * Uses cached voices for better performance
   * Requirements: 3.3, 4.4, 14.4
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.synthesis) {
      return [];
    }

    return this.getCachedVoices();
  }

  /**
   * Set the voice for speech synthesis
   * Requirements: 3.3, 4.4
   */
  setVoice(voiceURI: string): void {
    this.selectedVoiceURI = voiceURI;
  }

  /**
   * Get voices for a specific language
   * Requirements: 3.3, 4.4
   */
  getVoicesForLanguage(language: LanguageCode): SpeechSynthesisVoice[] {
    const voices = this.getAvailableVoices();
    const langPrefix = language.split('-')[0];
    if (!langPrefix) {
      return [];
    }
    return voices.filter((voice) => voice.lang.startsWith(langPrefix));
  }

  /**
   * Get the best voice for a language (prefers local voices)
   * Internal version that accepts voices array for optimization
   * Requirements: 3.3, 4.4, 14.4
   */
  private getBestVoiceForLanguageInternal(
    language: LanguageCode,
    voices: SpeechSynthesisVoice[]
  ): SpeechSynthesisVoice | null {
    const langPrefix = language.split('-')[0];
    if (!langPrefix) {
      return null;
    }

    const languageVoices = voices.filter((voice) => voice.lang.startsWith(langPrefix));

    if (languageVoices.length === 0) {
      return null;
    }

    // Prefer local voices over network voices for lower latency
    const localVoice = languageVoices.find((voice) => voice.localService);
    if (localVoice) {
      return localVoice;
    }

    // Return first available voice
    return languageVoices[0] || null;
  }

  /**
   * Get the best voice for a language (prefers local voices)
   * Requirements: 3.3, 4.4
   */
  getBestVoiceForLanguage(language: LanguageCode): SpeechSynthesisVoice | null {
    const voices = this.getAvailableVoices();
    return this.getBestVoiceForLanguageInternal(language, voices);
  }

  // Feature Detection Methods

  /**
   * Check if speech recognition is supported
   * Requirements: 2.4
   */
  isSpeechRecognitionSupported(): boolean {
    return this.recognition !== null;
  }

  /**
   * Check if speech synthesis is supported
   * Requirements: 3.4
   */
  isSpeechSynthesisSupported(): boolean {
    return !!this.synthesis && this.synthesis.getVoices().length > 0;
  }

  /**
   * Get feature support status
   */
  getFeatureSupport(): {
    recognition: boolean;
    synthesis: boolean;
    languages: LanguageCode[];
  } {
    const supportedLanguages: LanguageCode[] = [];

    if (this.isSpeechSynthesisSupported()) {
      const voices = this.getAvailableVoices();
      const languageCodes: LanguageCode[] = ['en-IN', 'hi-IN', 'en-US'];

      languageCodes.forEach((lang) => {
        const langPrefix = lang.split('-')[0];
        if (langPrefix && voices.some((voice) => voice.lang.startsWith(langPrefix))) {
          supportedLanguages.push(lang);
        }
      });
    }

    return {
      recognition: this.isSpeechRecognitionSupported(),
      synthesis: this.isSpeechSynthesisSupported(),
      languages: supportedLanguages,
    };
  }
}

/**
 * Create and export a singleton instance of the voice engine
 */
export const voiceEngine = new BrowserVoiceEngine();

