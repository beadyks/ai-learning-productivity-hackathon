import { Handler, APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb';

/**
 * Semantic Search Lambda Function
 * Implements vector search with hybrid keyword + semantic search
 * Requirements: 1.3 (cross-document search), 7.1 (content prioritization)
 */

// Initialize AWS clients
const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION });
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));

// Environment variables
const EMBEDDINGS_TABLE = process.env.EMBEDDINGS_TABLE || '';
const TITAN_EMBEDDING_MODEL = 'amazon.titan-embed-text-v1';

interface SearchRequest {
  userId: string;
  query: string;
  maxResults?: number;
  searchType?: 'semantic' | 'keyword' | 'hybrid';
  filters?: {
    documentIds?: string[];
    topics?: string[];
    minRelevance?: number;
  };
}

interface SearchResult {
  chunkId: string;
  documentId: string;
  text: string;
  relevanceScore: number;
  metadata: {
    topic?: string;
    pageNumber?: number;
    section?: string;
    documentName?: string;
  };
  matchType: 'semantic' | 'keyword' | 'both';
}

interface SearchResponse {
  results: SearchResult[];
  totalResults: number;
  searchType: string;
  queryEmbedding?: number[];
}

/**
 * Main Lambda handler
 */
export const handler: Handler<APIGatewayProxyEventV2, APIGatewayProxyResultV2> = async (event) => {
  try {
    console.log('Semantic Search invoked', { path: event.rawPath, method: event.requestContext.http.method });

    // Parse request body
    const body: SearchRequest = JSON.parse(event.body || '{}');

    // Validate required fields
    if (!body.userId || !body.query) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Missing required fields: userId, query',
        }),
      };
    }

    // Set defaults
    const maxResults = body.maxResults || 10;
    const searchType = body.searchType || 'hybrid';

    console.log('Performing search', { 
      userId: body.userId, 
      searchType, 
      maxResults 
    });

    // Perform search based on type
    let results: SearchResult[];
    let queryEmbedding: number[] | undefined;

    switch (searchType) {
      case 'semantic':
        queryEmbedding = await generateQueryEmbedding(body.query);
        results = await performSemanticSearch(body.userId, queryEmbedding, maxResults, body.filters);
        break;
      
      case 'keyword':
        results = await performKeywordSearch(body.userId, body.query, maxResults, body.filters);
        break;
      
      case 'hybrid':
      default:
        queryEmbedding = await generateQueryEmbedding(body.query);
        results = await performHybridSearch(
          body.userId, 
          body.query, 
          queryEmbedding, 
          maxResults, 
          body.filters
        );
        break;
    }

    // Rank and filter results
    const rankedResults = rankResults(results, body.filters?.minRelevance);

    const response: SearchResponse = {
      results: rankedResults,
      totalResults: rankedResults.length,
      searchType: searchType,
      queryEmbedding: searchType === 'keyword' ? undefined : queryEmbedding,
    };

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('Error performing search:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to perform search',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

/**
 * Generate embedding for search query using Amazon Bedrock Titan
 */
async function generateQueryEmbedding(query: string): Promise<number[]> {
  try {
    const requestBody = {
      inputText: query,
    };

    const command = new InvokeModelCommand({
      modelId: TITAN_EMBEDDING_MODEL,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(requestBody),
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    return responseBody.embedding;
  } catch (error) {
    console.error('Error generating query embedding:', error);
    throw error;
  }
}

/**
 * Perform semantic search using vector similarity
 * Requirement 1.3: Cross-document search capabilities
 */
async function performSemanticSearch(
  userId: string,
  queryEmbedding: number[],
  maxResults: number,
  filters?: SearchRequest['filters']
): Promise<SearchResult[]> {
  try {
    // Query all user's embeddings
    const result = await dynamoClient.send(
      new QueryCommand({
        TableName: EMBEDDINGS_TABLE,
        IndexName: 'UserIndex',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return [];
    }

    // Calculate cosine similarity for each chunk
    const scoredResults = result.Items.map((item) => {
      const chunkEmbedding = item.embedding;
      const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);

      return {
        chunkId: item.chunkId,
        documentId: item.documentId,
        text: item.text,
        relevanceScore: similarity,
        metadata: item.metadata || {},
        matchType: 'semantic' as const,
      };
    });

    // Apply filters
    let filteredResults = scoredResults;

    if (filters?.documentIds && filters.documentIds.length > 0) {
      filteredResults = filteredResults.filter((r) =>
        filters.documentIds!.includes(r.documentId)
      );
    }

    if (filters?.topics && filters.topics.length > 0) {
      filteredResults = filteredResults.filter((r) =>
        filters.topics!.some((topic) => r.metadata.topic?.includes(topic))
      );
    }

    // Sort by relevance and return top results
    return filteredResults
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxResults);
  } catch (error) {
    console.error('Error performing semantic search:', error);
    throw error;
  }
}

/**
 * Perform keyword-based search
 */
async function performKeywordSearch(
  userId: string,
  query: string,
  maxResults: number,
  filters?: SearchRequest['filters']
): Promise<SearchResult[]> {
  try {
    // Query all user's embeddings
    const result = await dynamoClient.send(
      new QueryCommand({
        TableName: EMBEDDINGS_TABLE,
        IndexName: 'UserIndex',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return [];
    }

    // Extract keywords from query
    const keywords = extractKeywords(query);

    // Score each chunk based on keyword matches
    const scoredResults = result.Items.map((item) => {
      const text = item.text.toLowerCase();
      const score = calculateKeywordScore(text, keywords);

      return {
        chunkId: item.chunkId,
        documentId: item.documentId,
        text: item.text,
        relevanceScore: score,
        metadata: item.metadata || {},
        matchType: 'keyword' as const,
      };
    });

    // Filter out results with zero score
    let filteredResults = scoredResults.filter((r) => r.relevanceScore > 0);

    // Apply additional filters
    if (filters?.documentIds && filters.documentIds.length > 0) {
      filteredResults = filteredResults.filter((r) =>
        filters.documentIds!.includes(r.documentId)
      );
    }

    if (filters?.topics && filters.topics.length > 0) {
      filteredResults = filteredResults.filter((r) =>
        filters.topics!.some((topic) => r.metadata.topic?.includes(topic))
      );
    }

    // Sort by relevance and return top results
    return filteredResults
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxResults);
  } catch (error) {
    console.error('Error performing keyword search:', error);
    throw error;
  }
}

/**
 * Perform hybrid search combining semantic and keyword approaches
 * Requirement 7.1: Content source prioritization
 */
async function performHybridSearch(
  userId: string,
  query: string,
  queryEmbedding: number[],
  maxResults: number,
  filters?: SearchRequest['filters']
): Promise<SearchResult[]> {
  try {
    // Perform both searches
    const semanticResults = await performSemanticSearch(userId, queryEmbedding, maxResults * 2, filters);
    const keywordResults = await performKeywordSearch(userId, query, maxResults * 2, filters);

    // Combine results with weighted scoring
    const combinedMap = new Map<string, SearchResult>();

    // Add semantic results with weight
    semanticResults.forEach((result) => {
      combinedMap.set(result.chunkId, {
        ...result,
        relevanceScore: result.relevanceScore * 0.7, // 70% weight for semantic
        matchType: 'semantic',
      });
    });

    // Add or merge keyword results with weight
    keywordResults.forEach((result) => {
      const existing = combinedMap.get(result.chunkId);
      if (existing) {
        // Combine scores if found in both
        existing.relevanceScore += result.relevanceScore * 0.3; // 30% weight for keyword
        existing.matchType = 'both';
      } else {
        combinedMap.set(result.chunkId, {
          ...result,
          relevanceScore: result.relevanceScore * 0.3,
          matchType: 'keyword',
        });
      }
    });

    // Convert to array and sort
    const combinedResults = Array.from(combinedMap.values())
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxResults);

    return combinedResults;
  } catch (error) {
    console.error('Error performing hybrid search:', error);
    throw error;
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }

  norm1 = Math.sqrt(norm1);
  norm2 = Math.sqrt(norm2);

  if (norm1 === 0 || norm2 === 0) {
    return 0;
  }

  return dotProduct / (norm1 * norm2);
}

/**
 * Extract keywords from query
 */
function extractKeywords(query: string): string[] {
  // Remove common stop words
  const stopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
    'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
    'to', 'was', 'will', 'with', 'what', 'when', 'where', 'who', 'why',
    'how', 'can', 'could', 'should', 'would', 'may', 'might', 'must',
  ]);

  // Tokenize and filter
  const words = query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));

  return words;
}

/**
 * Calculate keyword-based relevance score
 */
function calculateKeywordScore(text: string, keywords: string[]): number {
  let score = 0;

  keywords.forEach((keyword) => {
    // Count occurrences
    const regex = new RegExp(keyword, 'gi');
    const matches = text.match(regex);
    if (matches) {
      // Score based on frequency and position
      score += matches.length;
      
      // Bonus for exact phrase match
      if (text.includes(keyword)) {
        score += 0.5;
      }
    }
  });

  // Normalize by text length
  const normalizedScore = score / (text.length / 100);

  return normalizedScore;
}

/**
 * Rank and filter results based on relevance threshold
 */
function rankResults(results: SearchResult[], minRelevance?: number): SearchResult[] {
  let filtered = results;

  // Apply minimum relevance filter
  if (minRelevance !== undefined) {
    filtered = filtered.filter((r) => r.relevanceScore >= minRelevance);
  }

  // Boost results that match on both semantic and keyword
  filtered.forEach((result) => {
    if (result.matchType === 'both') {
      result.relevanceScore *= 1.2; // 20% boost for hybrid matches
    }
  });

  // Re-sort after boosting
  return filtered.sort((a, b) => b.relevanceScore - a.relevanceScore);
}
