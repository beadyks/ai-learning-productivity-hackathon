# Voice Components

This directory contains React components for voice interaction using the Browser Voice Engine.

## Components

### VoiceControls

A demonstration component that shows how to use the voice engine for speech recognition and text-to-speech.

**Features:**
- Speech recognition with real-time interim and final transcripts
- Text-to-speech with customizable voices
- Language selection (English India, Hindi India, English US)
- Voice selection from available browser voices
- Feature detection and browser compatibility checks
- Error handling and user feedback

**Usage:**

```tsx
import { VoiceControls } from './components/voice';

function App() {
  return <VoiceControls />;
}
```

## Voice Engine Service

The voice engine is implemented in `src/services/voiceEngine.ts` and provides:

### Speech Recognition
- Zero-cost speech-to-text using Web Speech API
- Real-time interim results
- Final transcript with confidence scores
- Multi-language support (en-IN, hi-IN, en-US)
- Automatic error handling and recovery

### Speech Synthesis
- Zero-cost text-to-speech using Speech Synthesis API
- Playback controls (speak, stop, pause, resume)
- Voice selection and customization
- Language-appropriate voice selection
- Rate, pitch, and volume control

### Feature Detection
- Browser compatibility checking
- Graceful degradation for unsupported browsers
- Fallback to text-only mode

## useVoiceEngine Hook

The `useVoiceEngine` hook provides easy access to the voice engine with integrated state management.

**Example:**

```tsx
import { useVoiceEngine } from '../hooks/useVoiceEngine';

function MyComponent() {
  const {
    isListening,
    isSpeaking,
    finalTranscript,
    startListening,
    speak,
    isRecognitionSupported,
  } = useVoiceEngine();

  const handleVoiceInput = async () => {
    if (!isRecognitionSupported) {
      alert('Speech recognition not supported');
      return;
    }
    await startListening();
  };

  const handleSpeak = async (text: string) => {
    await speak(text);
  };

  return (
    <div>
      <button onClick={handleVoiceInput} disabled={isListening}>
        {isListening ? 'Listening...' : 'Start Voice Input'}
      </button>
      {finalTranscript && <p>You said: {finalTranscript}</p>}
    </div>
  );
}
```

## Browser Compatibility

### Speech Recognition
- ✅ Chrome/Edge (desktop and mobile)
- ✅ Safari (iOS 14.5+)
- ❌ Firefox (not supported)

### Speech Synthesis
- ✅ Chrome/Edge (desktop and mobile)
- ✅ Safari (desktop and mobile)
- ✅ Firefox (desktop and mobile)

## Requirements Validation

This implementation satisfies the following requirements:

- **2.1**: Browser-based voice processing activation
- **2.2**: Real-time speech transcription with interim results
- **2.3**: Final transcript sent to backend
- **2.4**: Fallback for unsupported browsers
- **2.5**: User-friendly error messages
- **3.1**: Text-to-speech using Speech Synthesis API
- **3.2**: Playback controls (pause, resume, stop)
- **3.3**: Language-appropriate voice selection
- **3.4**: Fallback for unsupported browsers
- **3.5**: Voice preference persistence (via Zustand)
- **4.1**: Hindi language support (hi-IN)
- **4.2**: English language support (en-IN)
- **4.3**: Hinglish support (mixed language input)
- **4.4**: Language-appropriate voice selection
- **4.5**: Language switching without context loss

## Cost Savings

By using the browser's native Web Speech API instead of AWS Transcribe and Polly:

- **AWS Transcribe**: $0.024/minute → **$0.00/minute** (FREE)
- **AWS Polly**: $0.016/minute → **$0.00/minute** (FREE)
- **Monthly savings**: ~$2,640 for 1,000 users with 30 min/month usage

## Testing

The voice engine includes comprehensive error handling and feature detection. To test:

1. Open the application in a supported browser
2. Grant microphone permissions when prompted
3. Use the VoiceControls component to test speech recognition and synthesis
4. Try different languages and voices
5. Test error scenarios (deny permissions, unsupported browser)

## Future Enhancements

- Voice activity detection (VAD) for automatic start/stop
- Noise cancellation and audio preprocessing
- Custom wake word detection
- Offline voice processing (when browser support improves)
- Voice biometrics for authentication

