# Multilingual Support Services

This directory contains Lambda functions that provide comprehensive multilingual support for the Voice-First AI Learning Assistant, enabling seamless interaction in English, Hindi, and Hinglish.

## Overview

The multilingual support system consists of two main components:

1. **Language Detector** - Detects user language and manages language switching
2. **Response Formatter** - Formats AI responses with technical term translation

## Components

### 1. Language Detector (`language-detector/`)

**Purpose**: Automatically detect the language of user input and manage language preferences.

**Key Features**:
- Automatic language detection (English, Hindi, Hinglish)
- Devanagari script detection for Hindi
- Hinglish pattern recognition (Roman script Hindi words)
- Seamless language switching without context loss
- User language preference management

**API Endpoints**:
- `POST /language/detect` - Detect language from text input
- `POST /language/switch` - Switch user's language preference
- `GET /language/current` - Get user's current language preference

**Requirements Addressed**:
- 6.1: Hindi language processing
- 6.2: Hinglish (mixed Hindi-English) support
- 6.5: Seamless language switching

### 2. Response Formatter (`response-formatter/`)

**Purpose**: Format AI responses for different languages with technical term translation.

**Key Features**:
- Language-specific response formatting
- Technical term translation (English ↔ Hindi)
- Configurable translation preferences (original, translated, both)
- Technical term explanation in user's language
- Translation caching for performance

**API Endpoints**:
- `POST /format/response` - Format response for target language
- `POST /format/preferences` - Update language preferences
- `GET /format/preferences` - Get user's language preferences
- `POST /format/translate-term` - Translate a specific technical term

**Requirements Addressed**:
- 6.3: Technical term translation capabilities
- 6.4: Language preference management

## Language Detection Algorithm

The language detector uses multiple heuristics:

1. **Script Analysis**: Counts Devanagari (Hindi) vs Latin (English) characters
2. **Pattern Matching**: Identifies common Hinglish words and patterns
3. **Confidence Scoring**: Provides confidence level for detection accuracy

### Detection Rules

- **Hindi**: >80% Devanagari characters
- **English**: >80% Latin characters
- **Hinglish**: 20-80% mix of both scripts OR contains Hinglish patterns

### Hinglish Patterns

Common Hinglish indicators:
```
kya, hai, aur, mein, nahi, haan, kaise, kab, kahan
achha, theek, bahut, yaar, bhai, samajh, matlab
```

## Technical Term Translation

### Supported Terms

The system includes translations for common programming and technical terms:

- **Programming**: function, variable, array, loop, condition, algorithm
- **Data Types**: string, integer, boolean, object
- **Web Development**: API, HTTP, database, server, client
- **Data Structures**: stack, queue, tree, graph

### Translation Preferences

Users can configure how technical terms are displayed:

1. **Original**: Keep English terms (e.g., "function")
2. **Translated**: Show Hindi translation (e.g., "फ़ंक्शन")
3. **Both**: Show both (e.g., "function (फ़ंक्शन)")

## Usage Examples

### Detect Language

```typescript
POST /language/detect
{
  "text": "Mujhe programming sikhni hai",
  "userId": "user123"
}

Response:
{
  "detectedLanguage": "hinglish",
  "confidence": 0.85,
  "isHinglish": true,
  "hindiPercentage": 40,
  "englishPercentage": 60
}
```

### Switch Language

```typescript
POST /language/switch
{
  "userId": "user123",
  "targetLanguage": "hi",
  "sessionId": "session456"
}

Response:
{
  "success": true,
  "previousLanguage": "en",
  "currentLanguage": "hi",
  "message": "भाषा बदल दी गई है। अब मैं हिंदी में जवाब दूंगा।"
}
```

### Format Response

```typescript
POST /format/response
{
  "text": "A function is a reusable block of code",
  "targetLanguage": "hi",
  "userId": "user123",
  "includeTechnicalTerms": true
}

Response:
{
  "formattedText": "A function (फ़ंक्शन) is a reusable block of code।",
  "originalLanguage": "en",
  "targetLanguage": "hi",
  "technicalTerms": [
    {
      "term": "function",
      "translation": "फ़ंक्शन",
      "explanation": "A reusable block of code that performs a specific task",
      "language": "hi"
    }
  ],
  "translationApplied": true
}
```

## Integration with Other Services

### Response Generator Integration

The multilingual services integrate with the AI response generator:

```typescript
// 1. Detect user's language
const detection = await detectLanguage(userInput);

// 2. Generate response in appropriate language
const response = await generateResponse(query, detection.detectedLanguage);

// 3. Format response with technical terms
const formatted = await formatResponse(response, detection.detectedLanguage, userId);
```

### Mode Controller Integration

Language preferences are preserved across mode switches:

```typescript
// Language context is maintained when switching modes
await switchMode(userId, 'interviewer', { language: 'hi' });
// User continues in Hindi even after mode change
```

## Database Schema

### User Profiles Table

```typescript
{
  userId: string,
  preferredLanguage: 'en' | 'hi' | 'hinglish',
  languagePreferences: {
    technicalTermPreference: 'original' | 'translated' | 'both',
    explanationLevel: 'basic' | 'detailed',
    lastUpdated: number
  }
}
```

### Translations Cache Table

```typescript
{
  term: string,           // Primary key
  language: string,       // Sort key
  translation: string,
  explanation: string,
  cachedAt: number,
  ttl: number            // Auto-expire after 90 days
}
```

## Performance Optimization

### Caching Strategy

1. **Translation Cache**: Technical term translations cached for 90 days
2. **User Preferences**: Language preferences cached in user profile
3. **Detection Results**: Recent detection results cached per session

### Cost Optimization

- No external translation API calls (built-in translations)
- DynamoDB TTL for automatic cache cleanup
- Efficient character counting algorithms

## Testing

### Language Detection Tests

```bash
# Test Hindi detection
curl -X POST /language/detect \
  -d '{"text": "मुझे प्रोग्रामिंग सीखनी है"}'

# Test Hinglish detection
curl -X POST /language/detect \
  -d '{"text": "Mujhe programming sikhni hai yaar"}'

# Test English detection
curl -X POST /language/detect \
  -d '{"text": "I want to learn programming"}'
```

### Response Formatting Tests

```bash
# Test technical term translation
curl -X POST /format/response \
  -d '{
    "text": "A function takes parameters and returns a value",
    "targetLanguage": "hi",
    "userId": "test-user"
  }'
```

## Future Enhancements

1. **Additional Languages**: Support for more Indian languages (Tamil, Telugu, Bengali)
2. **Context-Aware Translation**: Better translation based on conversation context
3. **Custom Terminology**: Allow users to add custom technical term translations
4. **Voice Integration**: Integrate with browser Speech API for multilingual voice
5. **Regional Variations**: Support for regional Hindi variations

## Deployment

These Lambda functions are deployed as part of the main infrastructure stack:

```bash
cd infrastructure
npm run deploy
```

Environment variables required:
- `USER_PROFILES_TABLE`: DynamoDB table for user profiles
- `TRANSLATIONS_TABLE`: DynamoDB table for translation cache
- `AWS_REGION`: AWS region for services

## Monitoring

Key metrics to monitor:
- Language detection accuracy
- Translation cache hit rate
- Language switch frequency
- Response formatting latency

CloudWatch logs are available for debugging:
```bash
aws logs tail /aws/lambda/language-detector --follow
aws logs tail /aws/lambda/response-formatter --follow
```
