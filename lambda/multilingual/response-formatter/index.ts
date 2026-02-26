import { Handler, APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

/**
 * Multilingual Response Formatter Lambda Function
 * Formats AI responses for different languages with technical term translation
 * Requirements: 6.3, 6.4 (technical term translation, language preference management)
 */

// Initialize AWS clients
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));

// Environment variables
const USER_PROFILES_TABLE = process.env.USER_PROFILES_TABLE || '';
const TRANSLATIONS_TABLE = process.env.TRANSLATIONS_TABLE || '';

export enum LanguageCode {
  ENGLISH = 'en',
  HINDI = 'hi',
  HINGLISH = 'hinglish',
}

interface ResponseFormattingRequest {
  text: string;
  targetLanguage: LanguageCode;
  userId: string;
  includeTechnicalTerms?: boolean;
  context?: string;
}

interface ResponseFormattingResult {
  formattedText: string;
  originalLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  technicalTerms: TechnicalTerm[];
  translationApplied: boolean;
}

interface TechnicalTerm {
  term: string;
  translation?: string;
  explanation?: string;
  language: LanguageCode;
}

interface LanguagePreference {
  userId: string;
  preferredLanguage: LanguageCode;
  technicalTermPreference: 'original' | 'translated' | 'both';
  explanationLevel: 'basic' | 'detailed';
  lastUpdated: number;
}

/**
 * Main Lambda handler
 */
export const handler: Handler<APIGatewayProxyEventV2, APIGatewayProxyResultV2> = async (event) => {
  try {
    console.log('Response Formatter invoked', { path: event.rawPath, method: event.requestContext.http.method });

    const method = event.requestContext.http.method;
    const path = event.rawPath;

    // Route to appropriate handler
    if (method === 'POST' && path.includes('/format/response')) {
      return await handleResponseFormatting(event);
    } else if (method === 'POST' && path.includes('/format/preferences')) {
      return await handleUpdatePreferences(event);
    } else if (method === 'GET' && path.includes('/format/preferences')) {
      return await handleGetPreferences(event);
    } else if (method === 'POST' && path.includes('/format/translate-term')) {
      return await handleTranslateTerm(event);
    }

    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Endpoint not found' }),
    };
  } catch (error) {
    console.error('Error in response formatter:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to format response',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

/**
 * Handle response formatting request
 * Requirement 6.3: Technical term translation
 */
async function handleResponseFormatting(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const body: ResponseFormattingRequest = JSON.parse(event.body || '{}');

  if (!body.text || !body.targetLanguage || !body.userId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Missing required fields: text, targetLanguage, userId',
      }),
    };
  }

  // Get user's language preferences
  const preferences = await getLanguagePreferences(body.userId);

  // Format response based on target language and preferences
  const result = await formatResponse(
    body.text,
    body.targetLanguage,
    preferences,
    body.includeTechnicalTerms ?? true
  );

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result),
  };
}

/**
 * Handle update preferences request
 * Requirement 6.4: Language preference management
 */
async function handleUpdatePreferences(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const body = JSON.parse(event.body || '{}');

  if (!body.userId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing required field: userId' }),
    };
  }

  const preferences: LanguagePreference = {
    userId: body.userId,
    preferredLanguage: body.preferredLanguage || LanguageCode.ENGLISH,
    technicalTermPreference: body.technicalTermPreference || 'both',
    explanationLevel: body.explanationLevel || 'basic',
    lastUpdated: Date.now(),
  };

  await saveLanguagePreferences(preferences);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      success: true,
      preferences: preferences,
    }),
  };
}

/**
 * Handle get preferences request
 */
async function handleGetPreferences(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const userId = event.queryStringParameters?.userId;

  if (!userId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing userId parameter' }),
    };
  }

  const preferences = await getLanguagePreferences(userId);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(preferences),
  };
}

/**
 * Handle translate term request
 */
async function handleTranslateTerm(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const body = JSON.parse(event.body || '{}');

  if (!body.term || !body.targetLanguage) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Missing required fields: term, targetLanguage',
      }),
    };
  }

  const translation = await translateTechnicalTerm(body.term, body.targetLanguage);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(translation),
  };
}

/**
 * Format response text for target language
 * Requirement 6.3: Language-specific response formatting with technical term translation
 */
async function formatResponse(
  text: string,
  targetLanguage: LanguageCode,
  preferences: LanguagePreference,
  includeTechnicalTerms: boolean
): Promise<ResponseFormattingResult> {
  // Detect technical terms in the text
  const technicalTerms = extractTechnicalTerms(text);

  let formattedText = text;
  const translatedTerms: TechnicalTerm[] = [];

  // Process technical terms based on user preferences
  if (includeTechnicalTerms && technicalTerms.length > 0) {
    for (const term of technicalTerms) {
      const translation = await translateTechnicalTerm(term, targetLanguage);
      translatedTerms.push(translation);

      // Apply formatting based on preference
      if (preferences.technicalTermPreference === 'translated' && translation.translation) {
        // Replace with translation only
        formattedText = formattedText.replace(
          new RegExp(`\\b${term}\\b`, 'gi'),
          translation.translation
        );
      } else if (preferences.technicalTermPreference === 'both' && translation.translation) {
        // Show both original and translation
        formattedText = formattedText.replace(
          new RegExp(`\\b${term}\\b`, 'gi'),
          `${term} (${translation.translation})`
        );
      }
      // 'original' preference keeps the text as-is
    }
  }

  // Apply language-specific formatting
  formattedText = applyLanguageSpecificFormatting(formattedText, targetLanguage);

  return {
    formattedText,
    originalLanguage: LanguageCode.ENGLISH, // Assuming responses are generated in English
    targetLanguage,
    technicalTerms: translatedTerms,
    translationApplied: translatedTerms.length > 0,
  };
}

/**
 * Extract technical terms from text
 * Identifies common programming and technical terms
 */
function extractTechnicalTerms(text: string): string[] {
  // Common technical terms in programming and learning
  const technicalKeywords = [
    // Programming concepts
    'function', 'variable', 'array', 'object', 'class', 'method', 'parameter',
    'argument', 'return', 'loop', 'condition', 'algorithm', 'data structure',
    'recursion', 'iteration', 'inheritance', 'polymorphism', 'encapsulation',
    
    // Data types
    'string', 'integer', 'boolean', 'float', 'double', 'char', 'byte',
    
    // Web development
    'API', 'HTTP', 'REST', 'JSON', 'XML', 'HTML', 'CSS', 'JavaScript',
    'frontend', 'backend', 'database', 'server', 'client', 'request', 'response',
    
    // Common CS terms
    'compiler', 'interpreter', 'syntax', 'semantics', 'debugging', 'testing',
    'deployment', 'version control', 'repository', 'commit', 'branch', 'merge',
    
    // Data structures
    'stack', 'queue', 'tree', 'graph', 'hash table', 'linked list',
  ];

  const foundTerms: Set<string> = new Set();
  const lowerText = text.toLowerCase();

  for (const keyword of technicalKeywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    if (regex.test(lowerText)) {
      foundTerms.add(keyword);
    }
  }

  return Array.from(foundTerms);
}

/**
 * Translate technical term to target language
 * Requirement 6.3: Technical term translation capabilities
 */
async function translateTechnicalTerm(
  term: string,
  targetLanguage: LanguageCode
): Promise<TechnicalTerm> {
  // Check cache first
  const cached = await getCachedTranslation(term, targetLanguage);
  if (cached) {
    return cached;
  }

  // Generate translation and explanation
  const translation = generateTranslation(term, targetLanguage);
  
  // Cache the translation
  await cacheTranslation(term, targetLanguage, translation);

  return translation;
}

/**
 * Generate translation for technical term
 * This is a simplified version - in production, this would use a translation API or database
 */
function generateTranslation(term: string, targetLanguage: LanguageCode): TechnicalTerm {
  const lowerTerm = term.toLowerCase();

  // Technical term translations (Hindi and Hinglish)
  const translations: Record<string, { hi: string; hinglish: string; explanation: string }> = {
    'function': {
      hi: 'फ़ंक्शन',
      hinglish: 'function',
      explanation: 'A reusable block of code that performs a specific task',
    },
    'variable': {
      hi: 'चर',
      hinglish: 'variable',
      explanation: 'A named storage location that holds a value',
    },
    'array': {
      hi: 'सरणी',
      hinglish: 'array',
      explanation: 'A collection of elements stored in contiguous memory',
    },
    'loop': {
      hi: 'लूप',
      hinglish: 'loop',
      explanation: 'A control structure that repeats a block of code',
    },
    'condition': {
      hi: 'शर्त',
      hinglish: 'condition',
      explanation: 'A logical expression that evaluates to true or false',
    },
    'algorithm': {
      hi: 'एल्गोरिथ्म',
      hinglish: 'algorithm',
      explanation: 'A step-by-step procedure to solve a problem',
    },
    'database': {
      hi: 'डेटाबेस',
      hinglish: 'database',
      explanation: 'An organized collection of structured data',
    },
    'API': {
      hi: 'एपीआई',
      hinglish: 'API',
      explanation: 'Application Programming Interface - a way for programs to communicate',
    },
    'string': {
      hi: 'स्ट्रिंग',
      hinglish: 'string',
      explanation: 'A sequence of characters (text)',
    },
    'object': {
      hi: 'ऑब्जेक्ट',
      hinglish: 'object',
      explanation: 'A collection of related data and functions',
    },
  };

  const termData = translations[lowerTerm];

  if (!termData) {
    // Return original term if no translation available
    return {
      term,
      language: targetLanguage,
      explanation: `Technical term: ${term}`,
    };
  }

  let translation: string | undefined;
  if (targetLanguage === LanguageCode.HINDI) {
    translation = termData.hi;
  } else if (targetLanguage === LanguageCode.HINGLISH) {
    translation = termData.hinglish;
  }

  return {
    term,
    translation,
    explanation: termData.explanation,
    language: targetLanguage,
  };
}

/**
 * Apply language-specific formatting rules
 */
function applyLanguageSpecificFormatting(text: string, language: LanguageCode): string {
  let formatted = text;

  switch (language) {
    case LanguageCode.HINDI:
      // Add Hindi-specific formatting
      // For example, ensure proper punctuation marks
      formatted = formatted.replace(/\?/g, '?'); // Keep question marks
      formatted = formatted.replace(/\./g, '।'); // Replace period with Hindi danda
      break;

    case LanguageCode.HINGLISH:
      // Hinglish typically uses English punctuation
      // No special formatting needed
      break;

    case LanguageCode.ENGLISH:
    default:
      // Standard English formatting
      break;
  }

  return formatted;
}

/**
 * Get cached translation from DynamoDB
 */
async function getCachedTranslation(
  term: string,
  language: LanguageCode
): Promise<TechnicalTerm | null> {
  try {
    const result = await dynamoClient.send(
      new GetCommand({
        TableName: TRANSLATIONS_TABLE,
        Key: {
          term: term.toLowerCase(),
          language: language,
        },
      })
    );

    if (result.Item) {
      return result.Item as TechnicalTerm;
    }

    return null;
  } catch (error) {
    console.error('Error getting cached translation:', error);
    return null;
  }
}

/**
 * Cache translation in DynamoDB
 */
async function cacheTranslation(
  term: string,
  language: LanguageCode,
  translation: TechnicalTerm
): Promise<void> {
  try {
    const ttl = Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60); // 90 days

    await dynamoClient.send(
      new PutCommand({
        TableName: TRANSLATIONS_TABLE,
        Item: {
          term: term.toLowerCase(),
          language: language,
          ...translation,
          cachedAt: Date.now(),
          ttl: ttl,
        },
      })
    );
  } catch (error) {
    console.error('Error caching translation:', error);
    // Don't throw - caching failure shouldn't break the response
  }
}

/**
 * Get user's language preferences
 * Requirement 6.4: Language preference management
 */
async function getLanguagePreferences(userId: string): Promise<LanguagePreference> {
  try {
    const result = await dynamoClient.send(
      new GetCommand({
        TableName: USER_PROFILES_TABLE,
        Key: { userId },
      })
    );

    if (result.Item && result.Item.languagePreferences) {
      return result.Item.languagePreferences as LanguagePreference;
    }

    // Return default preferences
    return {
      userId,
      preferredLanguage: LanguageCode.ENGLISH,
      technicalTermPreference: 'both',
      explanationLevel: 'basic',
      lastUpdated: Date.now(),
    };
  } catch (error) {
    console.error('Error getting language preferences:', error);
    // Return default preferences on error
    return {
      userId,
      preferredLanguage: LanguageCode.ENGLISH,
      technicalTermPreference: 'both',
      explanationLevel: 'basic',
      lastUpdated: Date.now(),
    };
  }
}

/**
 * Save user's language preferences
 */
async function saveLanguagePreferences(preferences: LanguagePreference): Promise<void> {
  try {
    await dynamoClient.send(
      new PutCommand({
        TableName: USER_PROFILES_TABLE,
        Item: {
          userId: preferences.userId,
          languagePreferences: preferences,
          lastUpdated: Date.now(),
        },
      })
    );

    console.log('Saved language preferences', { userId: preferences.userId });
  } catch (error) {
    console.error('Error saving language preferences:', error);
    throw error;
  }
}
