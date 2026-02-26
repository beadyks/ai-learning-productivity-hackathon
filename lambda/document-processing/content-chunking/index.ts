import { DynamoDBStreamEvent, DynamoDBRecord } from 'aws-lambda';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { DynamoDBClient, UpdateItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { Readable } from 'stream';

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });

const DOCUMENT_BUCKET = process.env.DOCUMENT_BUCKET!;
const PROGRESS_TABLE = process.env.PROGRESS_TABLE!;
const EMBEDDINGS_TABLE = process.env.EMBEDDINGS_TABLE || 'voice-learning-embeddings';

// Chunking configuration
const CHUNK_SIZE = 512; // tokens (approximately 2000 characters)
const CHUNK_OVERLAP = 50; // tokens overlap between chunks
const CHARS_PER_TOKEN = 4; // Approximate characters per token

interface TextChunk {
  chunkId: string;
  documentId: string;
  userId: string;
  text: string;
  position: number;
  metadata: {
    startChar: number;
    endChar: number;
    wordCount: number;
  };
}

interface EmbeddingResult {
  chunkId: string;
  embedding: number[];
  model: string;
}

/**
 * Lambda handler for content chunking and embedding generation
 * Triggered by DynamoDB stream when text extraction completes
 * Requirements: 1.2 (content chunking), 1.3 (embedding generation)
 */
export const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
  console.log('Content chunking triggered:', JSON.stringify(event));

  for (const record of event.Records) {
    try {
      // Only process when extraction status changes to 'extracted'
      if (record.eventName === 'MODIFY' || record.eventName === 'INSERT') {
        const newImage = record.dynamodb?.NewImage;
        const status = newImage?.status?.S;
        
        if (status === 'extracted') {
          await processExtractedDocument(record);
        }
      }
    } catch (error) {
      console.error('Error processing document for chunking:', error);
      // Continue processing other records even if one fails
    }
  }
};

/**
 * Process extracted document for chunking and embedding
 */
async function processExtractedDocument(record: DynamoDBRecord): Promise<void> {
  const newImage = record.dynamodb?.NewImage;
  if (!newImage) {
    throw new Error('No new image in DynamoDB record');
  }

  const userId = newImage.userId?.S;
  const topicId = newImage.topicId?.S;
  const extractedTextKey = newImage.extractedTextKey?.S;
  const documentId = newImage.documentId?.S;

  if (!userId || !extractedTextKey || !documentId) {
    throw new Error('Missing required fields in DynamoDB record');
  }

  console.log(`Processing document ${documentId} for chunking`);

  // Update status to chunking
  await updateStatus(userId, topicId!, 'chunking', 60);

  // Get extracted text from S3
  const text = await getExtractedText(extractedTextKey);

  // Chunk the text
  const chunks = chunkText(text, documentId, userId);
  console.log(`Created ${chunks.length} chunks for document ${documentId}`);

  // Update status to embedding
  await updateStatus(userId, topicId!, 'embedding', 70);

  // Generate embeddings for each chunk
  const embeddings = await generateEmbeddings(chunks);
  console.log(`Generated ${embeddings.length} embeddings for document ${documentId}`);

  // Store embeddings in DynamoDB (simulating OpenSearch for now)
  await storeEmbeddings(embeddings, chunks, userId, documentId);

  // Update status to completed
  await updateStatus(userId, topicId!, 'completed', 100);

  console.log(`Document ${documentId} processing completed`);
}

/**
 * Get extracted text from S3
 */
async function getExtractedText(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: DOCUMENT_BUCKET,
    Key: key
  });

  const response = await s3Client.send(command);
  const stream = response.Body as Readable;
  
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  
  return Buffer.concat(chunks).toString('utf-8');
}

/**
 * Chunk text into smaller segments with overlap
 * Requirement 1.2: Content chunking for large documents
 */
function chunkText(text: string, documentId: string, userId: string): TextChunk[] {
  const chunks: TextChunk[] = [];
  const chunkSizeChars = CHUNK_SIZE * CHARS_PER_TOKEN;
  const overlapChars = CHUNK_OVERLAP * CHARS_PER_TOKEN;
  
  let position = 0;
  let startChar = 0;

  while (startChar < text.length) {
    const endChar = Math.min(startChar + chunkSizeChars, text.length);
    let chunkText = text.substring(startChar, endChar);
    
    // Try to break at sentence boundaries
    if (endChar < text.length) {
      const lastPeriod = chunkText.lastIndexOf('.');
      const lastNewline = chunkText.lastIndexOf('\n');
      const breakPoint = Math.max(lastPeriod, lastNewline);
      
      if (breakPoint > chunkSizeChars * 0.7) {
        // If we found a good break point in the last 30% of the chunk
        chunkText = chunkText.substring(0, breakPoint + 1);
      }
    }

    const actualEndChar = startChar + chunkText.length;
    const wordCount = chunkText.split(/\s+/).filter(w => w.length > 0).length;

    chunks.push({
      chunkId: `${documentId}_chunk_${position}`,
      documentId,
      userId,
      text: chunkText.trim(),
      position,
      metadata: {
        startChar,
        endChar: actualEndChar,
        wordCount
      }
    });

    // Move to next chunk with overlap
    startChar = actualEndChar - overlapChars;
    if (startChar >= text.length - overlapChars) {
      break;
    }
    position++;
  }

  return chunks;
}

/**
 * Generate embeddings using Amazon Bedrock Titan Embeddings
 * Requirement 1.3: Vector embedding generation
 */
async function generateEmbeddings(chunks: TextChunk[]): Promise<EmbeddingResult[]> {
  const embeddings: EmbeddingResult[] = [];
  
  // Process chunks in batches to avoid rate limits
  const batchSize = 5;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const batchPromises = batch.map(chunk => generateSingleEmbedding(chunk));
    const batchResults = await Promise.all(batchPromises);
    embeddings.push(...batchResults);
    
    // Small delay between batches to avoid throttling
    if (i + batchSize < chunks.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return embeddings;
}

/**
 * Generate embedding for a single chunk using Bedrock Titan
 */
async function generateSingleEmbedding(chunk: TextChunk): Promise<EmbeddingResult> {
  const modelId = 'amazon.titan-embed-text-v1';
  
  const payload = {
    inputText: chunk.text
  };

  const command = new InvokeModelCommand({
    modelId,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(payload)
  });

  try {
    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    return {
      chunkId: chunk.chunkId,
      embedding: responseBody.embedding,
      model: modelId
    };
  } catch (error) {
    console.error(`Error generating embedding for chunk ${chunk.chunkId}:`, error);
    throw error;
  }
}

/**
 * Store embeddings in DynamoDB (simulating vector database)
 * In production, this would store in OpenSearch Serverless or Chroma
 * Requirement 1.3: Store embeddings for search
 */
async function storeEmbeddings(
  embeddings: EmbeddingResult[],
  chunks: TextChunk[],
  userId: string,
  documentId: string
): Promise<void> {
  const storePromises = embeddings.map(async (embedding, index) => {
    const chunk = chunks[index];
    
    const command = new PutItemCommand({
      TableName: EMBEDDINGS_TABLE,
      Item: {
        chunkId: { S: embedding.chunkId },
        documentId: { S: documentId },
        userId: { S: userId },
        text: { S: chunk.text },
        position: { N: chunk.position.toString() },
        embedding: { S: JSON.stringify(embedding.embedding) }, // Store as JSON string
        model: { S: embedding.model },
        wordCount: { N: chunk.metadata.wordCount.toString() },
        startChar: { N: chunk.metadata.startChar.toString() },
        endChar: { N: chunk.metadata.endChar.toString() },
        createdAt: { N: Date.now().toString() }
      }
    });

    await dynamoClient.send(command);
  });

  await Promise.all(storePromises);
  
  // Also store chunk metadata in S3 for backup
  const chunksKey = `${userId}/${documentId}/chunks.json`;
  await s3Client.send(new PutObjectCommand({
    Bucket: DOCUMENT_BUCKET,
    Key: chunksKey,
    Body: JSON.stringify(chunks, null, 2),
    ContentType: 'application/json',
    ServerSideEncryption: 'aws:kms'
  }));
}

/**
 * Update processing status in DynamoDB
 */
async function updateStatus(
  userId: string,
  topicId: string,
  status: string,
  progress: number
): Promise<void> {
  const command = new UpdateItemCommand({
    TableName: PROGRESS_TABLE,
    Key: {
      userId: { S: userId },
      topicId: { S: topicId }
    },
    UpdateExpression: 'SET #status = :status, uploadProgress = :progress, lastUpdated = :timestamp',
    ExpressionAttributeNames: {
      '#status': 'status'
    },
    ExpressionAttributeValues: {
      ':status': { S: status },
      ':progress': { N: progress.toString() },
      ':timestamp': { N: Date.now().toString() }
    }
  });

  await dynamoClient.send(command);
}
