/**
 * Response Quality Optimizer Lambda Function
 * 
 * Optimizes AI responses for beginner-friendly learning:
 * - Beginner-friendly language processing
 * - Example and analogy generation
 * - Code example formatting for programming topics
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.5
 */

import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context } from 'aws-lambda';

// Language complexity levels
enum ComplexityLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

// Programming languages for code formatting
const PROGRAMMING_LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'csharp',
  'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'sql', 'html', 'css'
];

// Complex terms to simplify
const COMPLEX_TERMS: Record<string, string> = {
  'algorithm': 'step-by-step procedure',
  'iteration': 'repeating process',
  'recursion': 'function calling itself',
  'polymorphism': 'same interface, different implementations',
  'encapsulation': 'bundling data and methods together',
  'inheritance': 'child class getting properties from parent',
  'abstraction': 'hiding complex details',
  'asynchronous': 'non-blocking operation',
  'synchronous': 'blocking operation',
  'callback': 'function passed as argument',
  'promise': 'placeholder for future value',
  'closure': 'function with access to outer scope',
  'hoisting': 'moving declarations to top',
  'prototype': 'object template',
  'immutable': 'cannot be changed',
  'mutable': 'can be changed',
};

interface OptimizationRequest {
  text: string;
  topic: string;
  targetLevel: ComplexityLevel;
  language: string;
  includeExamples: boolean;
  includeAnalogies: boolean;
  formatCode: boolean;
}

interface OptimizedResponse {
  originalText: string;
  optimizedText: string;
  simplifications: string[];
  examples: string[];
  analogies: string[];
  codeBlocks: CodeBlock[];
  readabilityScore: number;
}

interface CodeBlock {
  language: string;
  code: string;
  explanation: string;
  formatted: string;
}

/**
 * Main Lambda handler
 */
export const handler = async (
  event: APIGatewayProxyEventV2,
  context: Context
): Promise<APIGatewayProxyResultV2> => {
  console.log('Response Quality Optimizer invoked:', JSON.stringify(event, null, 2));

  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const request: OptimizationRequest = {
      text: body.text || '',
      topic: body.topic || 'general',
      targetLevel: body.targetLevel || ComplexityLevel.BEGINNER,
      language: body.language || 'en',
      includeExamples: body.includeExamples !== false,
      includeAnalogies: body.includeAnalogies !== false,
      formatCode: body.formatCode !== false,
    };

    if (!request.text) {
      return createErrorResponse(400, 'Missing required field: text');
    }

    // Optimize response
    const optimizedResponse = await optimizeResponse(request);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(optimizedResponse),
    };
  } catch (error) {
    console.error('Error in response quality optimizer:', error);
    return createErrorResponse(500, 'Internal server error', {
      requestId: context.requestId,
    });
  }
};

/**
 * Optimize response for beginner-friendly learning
 */
async function optimizeResponse(request: OptimizationRequest): Promise<OptimizedResponse> {
  let optimizedText = request.text;
  const simplifications: string[] = [];
  const examples: string[] = [];
  const analogies: string[] = [];
  const codeBlocks: CodeBlock[] = [];

  // Step 1: Simplify complex terms
  if (request.targetLevel === ComplexityLevel.BEGINNER) {
    const simplificationResult = simplifyComplexTerms(optimizedText);
    optimizedText = simplificationResult.text;
    simplifications.push(...simplificationResult.simplifications);
  }

  // Step 2: Extract and format code blocks
  if (request.formatCode) {
    const codeExtractionResult = extractAndFormatCode(optimizedText);
    optimizedText = codeExtractionResult.text;
    codeBlocks.push(...codeExtractionResult.codeBlocks);
  }

  // Step 3: Add examples if requested
  if (request.includeExamples) {
    const generatedExamples = generateExamples(request.topic, request.language);
    examples.push(...generatedExamples);
  }

  // Step 4: Add analogies if requested
  if (request.includeAnalogies) {
    const generatedAnalogies = generateAnalogies(request.topic, request.language);
    analogies.push(...generatedAnalogies);
  }

  // Step 5: Improve sentence structure for readability
  optimizedText = improveReadability(optimizedText);

  // Step 6: Calculate readability score
  const readabilityScore = calculateReadabilityScore(optimizedText);

  return {
    originalText: request.text,
    optimizedText,
    simplifications,
    examples,
    analogies,
    codeBlocks,
    readabilityScore,
  };
}

/**
 * Simplify complex technical terms
 */
function simplifyComplexTerms(text: string): {
  text: string;
  simplifications: string[];
} {
  let simplifiedText = text;
  const simplifications: string[] = [];

  for (const [complex, simple] of Object.entries(COMPLEX_TERMS)) {
    const regex = new RegExp(`\\b${complex}\\b`, 'gi');
    if (regex.test(simplifiedText)) {
      simplifiedText = simplifiedText.replace(
        regex,
        `${complex} (${simple})`
      );
      simplifications.push(`"${complex}" simplified to "${simple}"`);
    }
  }

  return { text: simplifiedText, simplifications };
}

/**
 * Extract and format code blocks
 */
function extractAndFormatCode(text: string): {
  text: string;
  codeBlocks: CodeBlock[];
} {
  const codeBlocks: CodeBlock[] = [];
  let processedText = text;

  // Match code blocks with language specification
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let match;
  let blockIndex = 0;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    const language = match[1] || 'plaintext';
    const code = match[2].trim();

    // Format the code block
    const formattedCode = formatCodeBlock(code, language);
    const explanation = generateCodeExplanation(code, language);

    codeBlocks.push({
      language,
      code,
      explanation,
      formatted: formattedCode,
    });

    // Replace in text with formatted version
    const replacement = `\n\n**Code Example ${blockIndex + 1} (${language}):**\n\`\`\`${language}\n${formattedCode}\n\`\`\`\n\n**Explanation:** ${explanation}\n`;
    processedText = processedText.replace(match[0], replacement);
    blockIndex++;
  }

  // Also match inline code
  const inlineCodeRegex = /`([^`]+)`/g;
  processedText = processedText.replace(inlineCodeRegex, (match, code) => {
    return `\`${code}\` (code)`;
  });

  return { text: processedText, codeBlocks };
}

/**
 * Format code block with proper indentation and comments
 */
function formatCodeBlock(code: string, language: string): string {
  // Basic formatting - in production, use a proper code formatter
  const lines = code.split('\n');
  let indentLevel = 0;
  const formattedLines: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Decrease indent for closing braces
    if (trimmedLine.startsWith('}') || trimmedLine.startsWith(']') || trimmedLine.startsWith(')')) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    // Add indentation
    const indentedLine = '  '.repeat(indentLevel) + trimmedLine;
    formattedLines.push(indentedLine);

    // Increase indent for opening braces
    if (trimmedLine.endsWith('{') || trimmedLine.endsWith('[') || trimmedLine.endsWith('(')) {
      indentLevel++;
    }
  }

  return formattedLines.join('\n');
}

/**
 * Generate explanation for code block
 */
function generateCodeExplanation(code: string, language: string): string {
  // Basic explanation generation - in production, use AI for better explanations
  const lines = code.split('\n').filter(line => line.trim().length > 0);
  
  if (lines.length === 1) {
    return 'This line of code performs a single operation.';
  } else if (lines.length <= 5) {
    return 'This code snippet performs a few related operations step by step.';
  } else {
    return 'This code block contains multiple steps that work together to achieve the desired result.';
  }
}

/**
 * Generate examples for topic
 */
function generateExamples(topic: string, language: string): string[] {
  const examples: string[] = [];

  // Topic-specific examples
  const topicExamples: Record<string, string[]> = {
    'variables': [
      'Think of a variable like a labeled box where you can store a value. For example, `let age = 25` creates a box labeled "age" and puts the number 25 in it.',
    ],
    'functions': [
      'A function is like a recipe. You give it ingredients (inputs), it follows steps, and gives you a dish (output). For example, a function to add two numbers takes two numbers as input and returns their sum.',
    ],
    'loops': [
      'A loop is like doing homework problems. Instead of writing the same steps 10 times, you write it once and tell the computer to repeat it 10 times.',
    ],
    'arrays': [
      'An array is like a shopping list. Each item has a position (index), and you can add, remove, or check items in the list.',
    ],
    'objects': [
      'An object is like a person\'s profile. It has properties (name, age, email) and actions they can do (login, logout).',
    ],
  };

  // Find matching examples
  for (const [key, exampleList] of Object.entries(topicExamples)) {
    if (topic.toLowerCase().includes(key)) {
      examples.push(...exampleList);
    }
  }

  // Default example if no specific match
  if (examples.length === 0) {
    if (language === 'hi') {
      examples.push('उदाहरण के लिए, मान लीजिए कि आप एक कार चला रहे हैं। आप गैस पेडल दबाते हैं (इनपुट), कार तेज चलती है (प्रोसेस), और आप अपने गंतव्य पर पहुंचते हैं (आउटपुट)।');
    } else {
      examples.push('For example, imagine you\'re driving a car. You press the gas pedal (input), the car accelerates (process), and you reach your destination (output).');
    }
  }

  return examples;
}

/**
 * Generate analogies for topic
 */
function generateAnalogies(topic: string, language: string): string[] {
  const analogies: string[] = [];

  // Topic-specific analogies
  const topicAnalogies: Record<string, string[]> = {
    'database': [
      'A database is like a library. Books are organized on shelves (tables), each book has information (records), and you use a catalog (queries) to find what you need.',
    ],
    'api': [
      'An API is like a waiter in a restaurant. You (the client) tell the waiter what you want, the waiter takes your order to the kitchen (server), and brings back your food (response).',
    ],
    'cache': [
      'A cache is like keeping frequently used items on your desk instead of in a filing cabinet. It\'s faster to grab from your desk, even though the cabinet has more storage.',
    ],
    'recursion': [
      'Recursion is like Russian nesting dolls. Each doll contains a smaller version of itself, until you reach the smallest doll that can\'t be opened further.',
    ],
    'inheritance': [
      'Inheritance is like family traits. Children inherit characteristics from their parents, but can also have their own unique features.',
    ],
  };

  // Find matching analogies
  for (const [key, analogyList] of Object.entries(topicAnalogies)) {
    if (topic.toLowerCase().includes(key)) {
      analogies.push(...analogyList);
    }
  }

  // Default analogy if no specific match
  if (analogies.length === 0) {
    if (language === 'hi') {
      analogies.push('यह एक पहेली को हल करने जैसा है - आप छोटे टुकड़ों से शुरू करते हैं और धीरे-धीरे पूरी तस्वीर बनाते हैं।');
    } else {
      analogies.push('Think of it like solving a puzzle - you start with small pieces and gradually build the complete picture.');
    }
  }

  return analogies;
}

/**
 * Improve readability of text
 */
function improveReadability(text: string): string {
  let improvedText = text;

  // Break long sentences
  improvedText = breakLongSentences(improvedText);

  // Add paragraph breaks for better structure
  improvedText = addParagraphBreaks(improvedText);

  // Use active voice
  improvedText = convertToActiveVoice(improvedText);

  return improvedText;
}

/**
 * Break long sentences into shorter ones
 */
function breakLongSentences(text: string): string {
  const sentences = text.split(/\. /);
  const improvedSentences: string[] = [];

  for (const sentence of sentences) {
    const words = sentence.split(' ');
    
    // If sentence is too long (>25 words), try to break it
    if (words.length > 25) {
      // Look for conjunctions to break at
      const conjunctions = ['and', 'but', 'or', 'so', 'because', 'although', 'while'];
      let broken = false;

      for (const conjunction of conjunctions) {
        const conjunctionIndex = words.findIndex(word => 
          word.toLowerCase() === conjunction
        );

        if (conjunctionIndex > 5 && conjunctionIndex < words.length - 5) {
          const firstPart = words.slice(0, conjunctionIndex).join(' ');
          const secondPart = words.slice(conjunctionIndex).join(' ');
          improvedSentences.push(firstPart + '.');
          improvedSentences.push(secondPart.charAt(0).toUpperCase() + secondPart.slice(1));
          broken = true;
          break;
        }
      }

      if (!broken) {
        improvedSentences.push(sentence);
      }
    } else {
      improvedSentences.push(sentence);
    }
  }

  return improvedSentences.join('. ');
}

/**
 * Add paragraph breaks for better structure
 */
function addParagraphBreaks(text: string): string {
  const sentences = text.split(/\. /);
  const paragraphs: string[] = [];
  let currentParagraph: string[] = [];

  for (let i = 0; i < sentences.length; i++) {
    currentParagraph.push(sentences[i]);

    // Create new paragraph every 3-4 sentences
    if (currentParagraph.length >= 3 || i === sentences.length - 1) {
      paragraphs.push(currentParagraph.join('. ') + '.');
      currentParagraph = [];
    }
  }

  return paragraphs.join('\n\n');
}

/**
 * Convert passive voice to active voice where possible
 */
function convertToActiveVoice(text: string): string {
  // Basic passive voice patterns
  const passivePatterns = [
    { pattern: /is being (\w+ed)/g, replacement: 'actively $1' },
    { pattern: /was being (\w+ed)/g, replacement: 'actively $1' },
    { pattern: /will be (\w+ed)/g, replacement: 'will $1' },
  ];

  let activeText = text;
  for (const { pattern, replacement } of passivePatterns) {
    activeText = activeText.replace(pattern, replacement);
  }

  return activeText;
}

/**
 * Calculate readability score (0-100, higher is better)
 */
function calculateReadabilityScore(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);

  if (sentences.length === 0 || words.length === 0) {
    return 0;
  }

  // Flesch Reading Ease formula
  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  const score = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, score));
}

/**
 * Count syllables in a word (approximate)
 */
function countSyllables(word: string): number {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;

  const vowels = 'aeiouy';
  let syllableCount = 0;
  let previousWasVowel = false;

  for (let i = 0; i < word.length; i++) {
    const isVowel = vowels.includes(word[i]);
    if (isVowel && !previousWasVowel) {
      syllableCount++;
    }
    previousWasVowel = isVowel;
  }

  // Adjust for silent 'e'
  if (word.endsWith('e')) {
    syllableCount--;
  }

  // Ensure at least 1 syllable
  return Math.max(1, syllableCount);
}

/**
 * Create standardized error response
 */
function createErrorResponse(
  statusCode: number,
  message: string,
  details?: Record<string, any>
): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      error: message,
      statusCode,
      timestamp: new Date().toISOString(),
      ...details,
    }),
  };
}
