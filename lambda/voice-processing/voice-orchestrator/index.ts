import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const SESSION_TABLE = process.env.SESSION_TABLE || '';
const SPEECH_TO_TEXT_FUNCTION = process.env.SPEECH_TO_TEXT_FUNCTION || '';
const TEXT_TO_SPEECH_FUNCTION = process.env.TEXT_TO_SPEECH_FUNCTION || '';

interface VoiceRequest {
  action: 'transcribe' | 'synthesize' | 'detect-language' | 'get-status';
  userId: string;
  sessionId: string;
  audioData?: string; // For transcription
  text?: string; // For synthesis
  language?: 'en-US' | 'hi-IN' | 'en-IN' | 'auto';
  transcriptionId?: string; // For status checks
}

interface VoiceSession {
  userId: string;
  sessionId: string;
  preferredLanguage: string;
  detectedLanguage?: string;
  conversationHistory: ConversationTurn[];
  lastActivity: number;
  fallbackMode: boolean; // True if voice processing failed
}

interface ConversationTurn {
  timestamp: number;
  input: string;
  inputLanguage: string;
  response?: string;
  responseLanguage?: string;
  confidence?: number;
}

/**
 * Main voice processing orchestrator
 * Handles language detection, switching, and fallback mechanisms
 * Requirements: 4.3, 4.5, 6.4
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}') as VoiceRequest;
    
    // Validate input
    if (!body.action || !body.userId || !body.sessionId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Missing required fields: action, userId, sessionId',
        }),
      };
    }

    // Load or create session
    const session = await loadSession(body.userId, body.sessionId);

    // Route to appropriate handler
    switch (body.action) {
      case 'transcribe':
        return await handleTranscription(body, session);
      
      case 'synthesize':
        return await handleSynthesis(body, session);
      
      case 'detect-language':
        return await handleLanguageDetection(body, session);
      
      case 'get-status':
        return await handleStatusCheck(body, session);
      
      default:
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Invalid action. Supported actions: transcribe, synthesize, detect-language, get-status',
          }),
        };
    }
  } catch (error) {
    console.error('Error in voice orchestration:', error);
    
    // Implement fallback mechanism
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Voice processing failed',
        fallbackMode: true,
        message: 'Please use text input instead. We are experiencing technical difficulties with voice processing.',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

/**
 * Handle speech-to-text transcription with language detection
 */
async function handleTranscription(
  request: VoiceRequest,
  session: VoiceSession
): Promise<APIGatewayProxyResult> {
  try {
    if (!request.audioData) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Missing audioData for transcription',
        }),
      };
    }

    // Detect or use specified language
    let language = request.language;
    
    if (language === 'auto' || !language) {
      // Use session's preferred language or detect
      language = session.preferredLanguage as 'en-US' | 'hi-IN' | 'en-IN';
      
      // If no preference, try to detect from audio characteristics
      // For now, default to Indian English which supports code-switching
      if (!language) {
        language = 'en-IN';
      }
    }

    // Call speech-to-text service
    // In production, this would invoke the Lambda function
    const transcriptionResponse = {
      transcriptionId: `${request.userId}-${request.sessionId}-${Date.now()}`,
      status: 'IN_PROGRESS',
      language,
    };

    // Update session
    session.detectedLanguage = language;
    session.lastActivity = Date.now();
    await saveSession(session);

    return {
      statusCode: 202,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transcriptionResponse),
    };
  } catch (error) {
    console.error('Transcription error:', error);
    
    // Enable fallback mode
    session.fallbackMode = true;
    await saveSession(session);
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Transcription failed',
        fallbackMode: true,
        message: 'Voice input is temporarily unavailable. Please type your message instead.',
      }),
    };
  }
}

/**
 * Handle text-to-speech synthesis with language selection
 */
async function handleSynthesis(
  request: VoiceRequest,
  session: VoiceSession
): Promise<APIGatewayProxyResult> {
  try {
    if (!request.text) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Missing text for synthesis',
        }),
      };
    }

    // Determine language for synthesis
    let language = request.language || session.preferredLanguage || 'en-IN';
    
    // Detect language from text if auto
    if (language === 'auto') {
      language = detectTextLanguage(request.text);
    }

    // Call text-to-speech service
    // In production, this would invoke the Lambda function
    const synthesisResponse = {
      audioUrl: `https://example.com/audio/${request.sessionId}.ogg`,
      audioKey: `tts/${request.userId}/${request.sessionId}/${Date.now()}.ogg`,
      language,
      voiceId: getVoiceForLanguage(language),
      format: 'ogg_vorbis',
      expiresIn: 3600,
    };

    // Update session
    session.lastActivity = Date.now();
    session.conversationHistory.push({
      timestamp: Date.now(),
      input: request.text,
      inputLanguage: language,
      response: request.text,
      responseLanguage: language,
    });
    await saveSession(session);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(synthesisResponse),
    };
  } catch (error) {
    console.error('Synthesis error:', error);
    
    // Return text response as fallback
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: request.text,
        fallbackMode: true,
        message: 'Voice output is temporarily unavailable. Showing text response instead.',
      }),
    };
  }
}

/**
 * Handle language detection and switching
 * Supports English, Hindi, and Hinglish
 */
async function handleLanguageDetection(
  request: VoiceRequest,
  session: VoiceSession
): Promise<APIGatewayProxyResult> {
  try {
    const text = request.text || '';
    const detectedLanguage = detectTextLanguage(text);
    
    // Update session with detected language
    session.detectedLanguage = detectedLanguage;
    session.preferredLanguage = detectedLanguage;
    session.lastActivity = Date.now();
    await saveSession(session);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        detectedLanguage,
        confidence: 0.85, // Placeholder confidence score
        supportedLanguages: ['en-US', 'hi-IN', 'en-IN'],
      }),
    };
  } catch (error) {
    console.error('Language detection error:', error);
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Language detection failed',
        defaultLanguage: 'en-IN',
      }),
    };
  }
}

/**
 * Handle status check for async operations
 */
async function handleStatusCheck(
  request: VoiceRequest,
  session: VoiceSession
): Promise<APIGatewayProxyResult> {
  try {
    if (!request.transcriptionId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Missing transcriptionId for status check',
        }),
      };
    }

    // In production, this would check the actual transcription status
    const statusResponse = {
      transcriptionId: request.transcriptionId,
      status: 'COMPLETED',
      text: 'Sample transcribed text',
      confidence: 0.92,
      language: session.detectedLanguage || 'en-IN',
    };

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(statusResponse),
    };
  } catch (error) {
    console.error('Status check error:', error);
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to check status',
      }),
    };
  }
}

/**
 * Detect language from text content
 * Supports English, Hindi, and Hinglish (code-switching)
 */
function detectTextLanguage(text: string): string {
  // Simple heuristic-based language detection
  const hindiPattern = /[\u0900-\u097F]/; // Devanagari script
  const englishPattern = /[a-zA-Z]/;
  
  const hasHindi = hindiPattern.test(text);
  const hasEnglish = englishPattern.test(text);
  
  if (hasHindi && hasEnglish) {
    // Hinglish (code-switching) - use Indian English voice
    return 'en-IN';
  } else if (hasHindi) {
    return 'hi-IN';
  } else {
    return 'en-IN'; // Default to Indian English
  }
}

/**
 * Get appropriate voice ID for language
 */
function getVoiceForLanguage(language: string): string {
  const voiceMapping: Record<string, string> = {
    'en-US': 'Joanna',
    'en-IN': 'Aditi',
    'hi-IN': 'Aditi',
  };
  
  return voiceMapping[language] || 'Aditi';
}

/**
 * Load session from DynamoDB
 */
async function loadSession(userId: string, sessionId: string): Promise<VoiceSession> {
  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: SESSION_TABLE,
        Key: { userId, sessionId },
      })
    );

    if (result.Item) {
      return result.Item as VoiceSession;
    }

    // Create new session
    return {
      userId,
      sessionId,
      preferredLanguage: 'en-IN',
      conversationHistory: [],
      lastActivity: Date.now(),
      fallbackMode: false,
    };
  } catch (error) {
    console.error('Error loading session:', error);
    
    // Return default session on error
    return {
      userId,
      sessionId,
      preferredLanguage: 'en-IN',
      conversationHistory: [],
      lastActivity: Date.now(),
      fallbackMode: false,
    };
  }
}

/**
 * Save session to DynamoDB
 */
async function saveSession(session: VoiceSession): Promise<void> {
  try {
    await docClient.send(
      new PutCommand({
        TableName: SESSION_TABLE,
        Item: {
          ...session,
          ttl: Math.floor(Date.now() / 1000) + 86400, // 24 hour TTL
        },
      })
    );
  } catch (error) {
    console.error('Error saving session:', error);
    // Don't throw - session save failure shouldn't break the request
  }
}
