# Voice Processing Lambda Functions

This directory contains AWS Lambda functions for voice processing capabilities in the Voice-First AI Learning Assistant.

## Architecture Overview

The voice processing system supports **two deployment modes**:

### 1. Browser-Based Voice Processing (Recommended - $0 cost)
- Uses Web Speech API for speech recognition (client-side)
- Uses SpeechSynthesis API for text-to-speech (client-side)
- **Cost:** $0/month (vs $2,640/month for AWS services)
- **Latency:** Lower (no network round-trip)
- **Browser Support:** Chrome, Edge, Safari (95%+ coverage)
- **Languages:** English, Hindi, Hinglish (native support)

### 2. AWS-Based Voice Processing (Fallback/Backend)
- Uses Amazon Transcribe for speech-to-text
- Uses Amazon Polly for text-to-speech
- **Cost:** ~$2,640/month for 1,000 active users
- **Use Cases:** 
  - Backend processing for batch operations
  - Fallback when browser APIs unavailable
  - Server-side voice processing requirements

## Components

### 1. Speech-to-Text Service (`speech-to-text/`)

Lambda function that integrates with Amazon Transcribe for converting speech to text.

**Features:**
- Multi-language support (English, Hindi, Indian English)
- Confidence scoring for transcription quality
- Asynchronous processing with status polling
- Error handling with descriptive messages

**API:**
```typescript
POST /voice/transcribe
{
  "audioData": "base64-encoded-audio",
  "language": "en-US" | "hi-IN" | "en-IN",
  "userId": "user-123",
  "sessionId": "session-456"
}

Response:
{
  "transcriptionId": "user-123-session-456-1234567890",
  "status": "IN_PROGRESS",
  "language": "en-US"
}

GET /voice/transcribe?transcriptionId=xxx
Response:
{
  "transcriptionId": "xxx",
  "status": "COMPLETED",
  "text": "transcribed text",
  "confidence": 0.92,
  "language": "en-US"
}
```

**Requirements:** 4.1, 6.1

### 2. Text-to-Speech Service (`text-to-speech/`)

Lambda function that integrates with Amazon Polly for converting text to speech.

**Features:**
- Multi-language voice selection (English, Hindi)
- Audio compression (OGG Vorbis, MP3) for bandwidth optimization
- Neural voices for natural-sounding speech
- Presigned URLs for secure audio access

**API:**
```typescript
POST /voice/synthesize
{
  "text": "Hello, how can I help you?",
  "language": "en-US" | "hi-IN" | "en-IN",
  "userId": "user-123",
  "sessionId": "session-456",
  "format": "ogg_vorbis" | "mp3"
}

Response:
{
  "audioUrl": "https://s3.../audio.ogg",
  "audioKey": "tts/user-123/session-456/1234567890.ogg",
  "language": "en-US",
  "voiceId": "Joanna",
  "format": "ogg_vorbis",
  "expiresIn": 3600
}
```

**Voice Mapping:**
- `en-US`: Joanna (Neural, Female)
- `en-IN`: Aditi (Neural, Female, supports Hindi)
- `hi-IN`: Aditi (Neural, Female)

**Requirements:** 4.2, 8.2

### 3. Voice Orchestrator (`voice-orchestrator/`)

Main orchestration Lambda that coordinates voice processing with language detection and fallback mechanisms.

**Features:**
- Language detection (English, Hindi, Hinglish)
- Automatic language switching
- Session management with DynamoDB
- Graceful fallback to text mode on failures
- Conversation history tracking

**API:**
```typescript
POST /voice/orchestrate
{
  "action": "transcribe" | "synthesize" | "detect-language" | "get-status",
  "userId": "user-123",
  "sessionId": "session-456",
  "audioData": "...", // for transcribe
  "text": "...", // for synthesize
  "language": "en-US" | "hi-IN" | "en-IN" | "auto"
}
```

**Language Detection:**
- Detects Devanagari script (Hindi)
- Detects Latin script (English)
- Identifies code-switching (Hinglish) → uses `en-IN` voice
- Maintains language preference in session

**Fallback Mechanism:**
- On transcription failure → prompt for text input
- On synthesis failure → return text response
- On service unavailability → enable text-only mode
- Session tracks `fallbackMode` flag

**Requirements:** 4.3, 4.5, 6.4

## Browser-Based Implementation (Recommended)

For cost optimization, implement voice processing in the browser:

### Speech Recognition (Client-Side)
```javascript
// Initialize speech recognition
const recognition = new webkitSpeechRecognition();
recognition.lang = 'hi-IN'; // or 'en-US', 'en-IN'
recognition.continuous = true;
recognition.interimResults = true;

recognition.onresult = (event) => {
  const transcript = event.results[event.results.length - 1][0].transcript;
  const confidence = event.results[event.results.length - 1][0].confidence;
  
  // Send transcript to backend for processing
  processUserInput(transcript, confidence);
};

recognition.start();
```

### Text-to-Speech (Client-Side)
```javascript
// Initialize speech synthesis
const utterance = new SpeechSynthesisUtterance(text);
utterance.lang = 'hi-IN'; // or 'en-US', 'en-IN'
utterance.rate = 1.0;
utterance.pitch = 1.0;

// Select voice
const voices = speechSynthesis.getVoices();
const hindiVoice = voices.find(v => v.lang === 'hi-IN');
if (hindiVoice) {
  utterance.voice = hindiVoice;
}

speechSynthesis.speak(utterance);
```

### Language Detection (Client-Side)
```javascript
function detectLanguage(text) {
  const hindiPattern = /[\u0900-\u097F]/;
  const englishPattern = /[a-zA-Z]/;
  
  const hasHindi = hindiPattern.test(text);
  const hasEnglish = englishPattern.test(text);
  
  if (hasHindi && hasEnglish) return 'en-IN'; // Hinglish
  if (hasHindi) return 'hi-IN';
  return 'en-US';
}
```

## Deployment

### Environment Variables

All Lambda functions require:
```bash
AWS_REGION=us-east-1
AUDIO_BUCKET=voice-learning-audio-bucket
TRANSCRIPTION_BUCKET=voice-learning-transcriptions
SESSION_TABLE=voice-sessions
```

### IAM Permissions

Required permissions for Lambda execution role:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "transcribe:StartTranscriptionJob",
        "transcribe:GetTranscriptionJob"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "polly:SynthesizeSpeech"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::voice-learning-*/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/voice-sessions"
    }
  ]
}
```

### Build and Deploy

```bash
# Install dependencies
cd lambda/voice-processing/speech-to-text
npm install

cd ../text-to-speech
npm install

cd ../voice-orchestrator
npm install

# Build TypeScript
npm run build

# Deploy with CDK (from infrastructure directory)
cd ../../../infrastructure
npm run deploy
```

## Cost Optimization

### Current Implementation (AWS Services)
- **Transcribe:** $0.024/minute = $1.44/hour
- **Polly:** $4.00 per 1M characters
- **Estimated cost:** $2,640/month for 1,000 active users

### Recommended Implementation (Browser APIs)
- **Web Speech API:** $0
- **SpeechSynthesis API:** $0
- **Estimated cost:** $0/month

**Savings: 100% ($2,640/month)**

### Hybrid Approach
Use browser APIs as primary, AWS services as fallback:
- 95% of requests → Browser APIs ($0)
- 5% of requests → AWS Services ($132/month)
- **Total cost:** $132/month (95% savings)

## Testing

### Unit Tests
```bash
cd lambda/voice-processing/speech-to-text
npm test
```

### Integration Tests
Test with actual audio files:
```bash
# Test transcription
curl -X POST https://api.example.com/voice/transcribe \
  -H "Content-Type: application/json" \
  -d '{
    "audioData": "base64-encoded-audio",
    "language": "hi-IN",
    "userId": "test-user",
    "sessionId": "test-session"
  }'

# Test synthesis
curl -X POST https://api.example.com/voice/synthesize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "नमस्ते, मैं आपकी कैसे मदद कर सकता हूं?",
    "language": "hi-IN",
    "userId": "test-user",
    "sessionId": "test-session"
  }'
```

## Browser Compatibility

### Web Speech API Support
- ✅ Chrome 25+ (Desktop & Mobile)
- ✅ Edge 79+
- ✅ Safari 14.1+ (iOS & macOS)
- ❌ Firefox (limited support)

### Fallback Strategy
1. Check for Web Speech API support
2. If available → use browser-based processing
3. If unavailable → use AWS Lambda functions
4. If both fail → text-only mode

```javascript
function isVoiceSupported() {
  return 'webkitSpeechRecognition' in window && 
         'speechSynthesis' in window;
}

if (isVoiceSupported()) {
  // Use browser APIs
  initBrowserVoice();
} else {
  // Use AWS Lambda fallback
  initAWSVoice();
}
```

## Monitoring

### CloudWatch Metrics
- Lambda invocation count
- Error rate
- Average duration
- Transcription accuracy (confidence scores)

### Cost Alerts
Set up CloudWatch alarms for:
- Daily Transcribe usage > $50
- Daily Polly usage > $20
- Total voice processing cost > $100/day

## Future Enhancements

1. **Offline Mode:** Cache voice models for offline processing
2. **Real-time Streaming:** WebSocket-based streaming transcription
3. **Voice Biometrics:** Speaker identification for personalization
4. **Emotion Detection:** Analyze voice tone for adaptive responses
5. **Custom Vocabulary:** Add domain-specific terms for better accuracy

## References

- [Web Speech API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Amazon Transcribe Documentation](https://docs.aws.amazon.com/transcribe/)
- [Amazon Polly Documentation](https://docs.aws.amazon.com/polly/)
- [Design Document](.kiro/specs/voice-first-ai-learning-assistant/design.md)
- [Requirements Document](.kiro/specs/voice-first-ai-learning-assistant/requirements.md)
