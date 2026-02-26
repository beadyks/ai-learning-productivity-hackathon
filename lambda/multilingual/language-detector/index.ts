import { Handler, APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

/**
 * Language Detector Lambda Function
 * Detects and manages language preferences for multilingual support
 * Requirements: 6.1, 6.2, 6.5 (Hindi support, Hinglish support, language switching)
 */

// Initialize AWS clients
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));

// Environment variables
const USER_PROFILES_TABLE = process.env.USER_PROFILES_TABLE || '';

// Supported languages
export enum LanguageCode {
  ENGLISH = 'en',
  HINDI = 'hi',
  HINGLISH = 'hinglish',
}

interface LanguageDetectionRequest {
  text: string;
  userId?: string;
  context?: string;
}

interface LanguageDetectionResponse {
  detectedLanguage: LanguageCode;
  confidence: number;
  isHinglish: boolean;
  hindiPercentage?: number;
  englishPercentage?: number;
  suggestion?: string;
}

interface LanguageSwitchRequest {
  userId: string;
  targetLanguage: LanguageCode;
  sessionId: string;
}

interface LanguageSwitchResponse {
  success: boolean;
  previousLanguage: LanguageCode;
  currentLanguage: LanguageCode;
  message: string;
}

/**
 * Main Lambda handler
 */
export const handler: Handler<APIGatewayProxyEventV2, APIGatewayProxyResultV2> = async (event) => {
  try {
    console.log('Language Detector invoked', { path: event.rawPath, method: event.requestContext.http.method });

    const method = event.requestContext.http.method;
    const path = event.rawPath;

    // Route to appropriate handler
    if (method === 'POST' && path.includes('/language/detect')) {
      return await handleLanguageDetection(event);
    } else if (method === 'POST' && path.includes('/language/switch')) {
      return await handleLanguageSwitch(event);
    } else if (method === 'GET' && path.includes('/language/current')) {
      return await handleGetCurrentLanguage(event);
    }

    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Endpoint not found' }),
    };
  } catch (error) {
    console.error('Error in language detector:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to process language request',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

/**
 * Handle language detection request
 * Requirement 6.1: Hindi language processing
 * Requirement 6.2: Hinglish (mixed Hindi-English) support
 */
async function handleLanguageDetection(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const body: LanguageDetectionRequest = JSON.parse(event.body || '{}');

  if (!body.text) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing required field: text' }),
    };
  }

  const result = detectLanguage(body.text);

  // If userId provided, update their language preference
  if (body.userId && result.confidence > 0.7) {
    await updateUserLanguagePreference(body.userId, result.detectedLanguage);
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result),
  };
}

/**
 * Handle language switch request
 * Requirement 6.5: Seamless language switching
 */
async function handleLanguageSwitch(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const body: LanguageSwitchRequest = JSON.parse(event.body || '{}');

  if (!body.userId || !body.targetLanguage || !body.sessionId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Missing required fields: userId, targetLanguage, sessionId',
      }),
    };
  }

  // Validate target language
  if (!Object.values(LanguageCode).includes(body.targetLanguage)) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Invalid target language. Must be: en, hi, or hinglish',
      }),
    };
  }

  const result = await switchLanguage(body.userId, body.targetLanguage, body.sessionId);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result),
  };
}

/**
 * Handle get current language request
 */
async function handleGetCurrentLanguage(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const userId = event.queryStringParameters?.userId;

  if (!userId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing userId parameter' }),
    };
  }

  const language = await getUserLanguagePreference(userId);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: userId,
      currentLanguage: language,
    }),
  };
}

/**
 * Detect language from text input
 * Requirement 6.1: Hindi language detection
 * Requirement 6.2: Hinglish detection and processing
 */
function detectLanguage(text: string): LanguageDetectionResponse {
  const cleanText = text.trim();
  
  // Count characters in different scripts
  const devanagariCount = countDevanagariCharacters(cleanText);
  const latinCount = countLatinCharacters(cleanText);
  const totalChars = devanagariCount + latinCount;

  if (totalChars === 0) {
    return {
      detectedLanguage: LanguageCode.ENGLISH,
      confidence: 0.5,
      isHinglish: false,
      suggestion: 'Unable to detect language from empty or special characters only',
    };
  }

  const hindiPercentage = (devanagariCount / totalChars) * 100;
  const englishPercentage = (latinCount / totalChars) * 100;

  // Determine language based on character distribution
  let detectedLanguage: LanguageCode;
  let confidence: number;
  let isHinglish = false;

  if (hindiPercentage > 80) {
    // Predominantly Hindi
    detectedLanguage = LanguageCode.HINDI;
    confidence = Math.min(hindiPercentage / 100, 0.95);
  } else if (englishPercentage > 80) {
    // Predominantly English
    detectedLanguage = LanguageCode.ENGLISH;
    confidence = Math.min(englishPercentage / 100, 0.95);
  } else if (hindiPercentage > 20 && englishPercentage > 20) {
    // Mixed Hindi and English - Hinglish
    detectedLanguage = LanguageCode.HINGLISH;
    isHinglish = true;
    confidence = 0.85;
  } else {
    // Default to English with low confidence
    detectedLanguage = LanguageCode.ENGLISH;
    confidence = 0.6;
  }

  // Additional heuristics for Hinglish detection
  if (!isHinglish && detectHinglishPatterns(cleanText)) {
    detectedLanguage = LanguageCode.HINGLISH;
    isHinglish = true;
    confidence = Math.max(confidence, 0.75);
  }

  return {
    detectedLanguage,
    confidence,
    isHinglish,
    hindiPercentage: Math.round(hindiPercentage),
    englishPercentage: Math.round(englishPercentage),
  };
}

/**
 * Count Devanagari script characters (Hindi)
 */
function countDevanagariCharacters(text: string): number {
  // Devanagari Unicode range: U+0900 to U+097F
  const devanagariRegex = /[\u0900-\u097F]/g;
  const matches = text.match(devanagariRegex);
  return matches ? matches.length : 0;
}

/**
 * Count Latin script characters (English)
 */
function countLatinCharacters(text: string): number {
  // Latin alphabet (a-z, A-Z)
  const latinRegex = /[a-zA-Z]/g;
  const matches = text.match(latinRegex);
  return matches ? matches.length : 0;
}

/**
 * Detect Hinglish patterns
 * Hinglish often uses Roman script for Hindi words
 */
function detectHinglishPatterns(text: string): boolean {
  const lowerText = text.toLowerCase();
  
  // Common Hinglish words and patterns
  const hinglishIndicators = [
    'kya', 'hai', 'hain', 'aur', 'mein', 'main', 'ka', 'ki', 'ke',
    'nahi', 'nahin', 'haan', 'kaise', 'kab', 'kahan', 'kyun', 'kyu',
    'achha', 'accha', 'theek', 'thik', 'bahut', 'bohot', 'abhi',
    'yaar', 'bhai', 'dost', 'samajh', 'samaj', 'pata', 'matlab',
    'bilkul', 'zaroor', 'shayad', 'lagta', 'hota', 'karna', 'karo',
  ];

  // Check if text contains multiple Hinglish indicators
  const indicatorCount = hinglishIndicators.filter(indicator => 
    lowerText.includes(indicator)
  ).length;

  return indicatorCount >= 2;
}

/**
 * Switch user's language preference
 * Requirement 6.5: Seamless language switching without losing context
 */
async function switchLanguage(
  userId: string,
  targetLanguage: LanguageCode,
  sessionId: string
): Promise<LanguageSwitchResponse> {
  // Get current language preference
  const previousLanguage = await getUserLanguagePreference(userId);

  // Update user's language preference
  await updateUserLanguagePreference(userId, targetLanguage);

  // Generate confirmation message in target language
  const message = generateLanguageSwitchMessage(previousLanguage, targetLanguage);

  console.log('Language switched', { userId, previousLanguage, targetLanguage, sessionId });

  return {
    success: true,
    previousLanguage,
    currentLanguage: targetLanguage,
    message,
  };
}

/**
 * Generate language switch confirmation message
 * Messages are provided in the target language
 */
function generateLanguageSwitchMessage(
  fromLanguage: LanguageCode,
  toLanguage: LanguageCode
): string {
  if (fromLanguage === toLanguage) {
    switch (toLanguage) {
      case LanguageCode.HINDI:
        return 'आप पहले से ही हिंदी में हैं।';
      case LanguageCode.HINGLISH:
        return 'Aap pehle se hi Hinglish mein hain.';
      case LanguageCode.ENGLISH:
      default:
        return 'You are already using English.';
    }
  }

  switch (toLanguage) {
    case LanguageCode.HINDI:
      return 'भाषा बदल दी गई है। अब मैं हिंदी में जवाब दूंगा।';
    case LanguageCode.HINGLISH:
      return 'Language switch ho gayi hai. Ab main Hinglish mein reply karunga.';
    case LanguageCode.ENGLISH:
    default:
      return 'Language switched successfully. I will now respond in English.';
  }
}

/**
 * Get user's language preference from profile
 */
async function getUserLanguagePreference(userId: string): Promise<LanguageCode> {
  try {
    const result = await dynamoClient.send(
      new GetCommand({
        TableName: USER_PROFILES_TABLE,
        Key: { userId },
      })
    );

    if (result.Item && result.Item.preferredLanguage) {
      return result.Item.preferredLanguage as LanguageCode;
    }

    // Default to English if not set
    return LanguageCode.ENGLISH;
  } catch (error) {
    console.error('Error getting user language preference:', error);
    return LanguageCode.ENGLISH;
  }
}

/**
 * Update user's language preference in profile
 */
async function updateUserLanguagePreference(
  userId: string,
  language: LanguageCode
): Promise<void> {
  try {
    await dynamoClient.send(
      new UpdateCommand({
        TableName: USER_PROFILES_TABLE,
        Key: { userId },
        UpdateExpression: 'SET preferredLanguage = :lang, lastUpdated = :timestamp',
        ExpressionAttributeValues: {
          ':lang': language,
          ':timestamp': Date.now(),
        },
      })
    );

    console.log('Updated user language preference', { userId, language });
  } catch (error) {
    console.error('Error updating user language preference:', error);
    throw error;
  }
}
