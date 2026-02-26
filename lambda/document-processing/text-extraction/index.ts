import { S3Event, S3EventRecord } from 'aws-lambda';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { TextractClient, DetectDocumentTextCommand, AnalyzeDocumentCommand } from '@aws-sdk/client-textract';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { Readable } from 'stream';

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const textractClient = new TextractClient({ region: process.env.AWS_REGION });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });

const DOCUMENT_BUCKET = process.env.DOCUMENT_BUCKET!;
const PROGRESS_TABLE = process.env.PROGRESS_TABLE!;

interface ExtractionResult {
  documentId: string;
  extractedText: string;
  pageCount: number;
  confidence: number;
  language: string;
  metadata: {
    extractionMethod: 'textract' | 'tesseract' | 'paddleocr';
    processingTime: number;
    wordCount: number;
  };
}

/**
 * Lambda handler for text extraction from documents
 * Triggered by S3 upload events
 * Requirements: 1.1 (text extraction), 1.5 (error handling)
 */
export const handler = async (event: S3Event): Promise<void> => {
  console.log('Text extraction triggered:', JSON.stringify(event));

  for (const record of event.Records) {
    try {
      await processDocument(record);
    } catch (error) {
      console.error('Error processing document:', error);
      await updateDocumentStatus(record, 'failed', (error as Error).message);
    }
  }
};

/**
 * Process a single document from S3
 */
async function processDocument(record: S3EventRecord): Promise<void> {
  const startTime = Date.now();
  const bucket = record.s3.bucket.name;
  const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
  
  console.log(`Processing document: ${key} from bucket: ${bucket}`);

  // Extract document ID from key (format: userId/documentId/filename)
  const pathParts = key.split('/');
  if (pathParts.length < 3) {
    throw new Error('Invalid S3 key format');
  }
  
  const userId = pathParts[0];
  const documentId = pathParts[1];
  const fileName = pathParts[2];

  // Update status to processing
  await updateProcessingStatus(userId, documentId, 'processing', 0);

  // Get document from S3
  const getCommand = new GetObjectCommand({
    Bucket: bucket,
    Key: key
  });
  
  const response = await s3Client.send(getCommand);
  const fileType = response.ContentType || '';
  
  // Extract text based on file type
  let extractedText: string;
  let extractionMethod: 'textract' | 'tesseract' | 'paddleocr';
  let confidence = 0;
  let pageCount = 1;

  if (isImageFile(fileType)) {
    // Use Textract for images
    const result = await extractTextWithTextract(bucket, key);
    extractedText = result.text;
    confidence = result.confidence;
    pageCount = result.pageCount;
    extractionMethod = 'textract';
  } else if (isPdfFile(fileType)) {
    // Use Textract for PDFs
    const result = await extractTextWithTextract(bucket, key);
    extractedText = result.text;
    confidence = result.confidence;
    pageCount = result.pageCount;
    extractionMethod = 'textract';
  } else if (isTextFile(fileType)) {
    // Direct text extraction for plain text files
    extractedText = await extractPlainText(response.Body as Readable);
    confidence = 100;
    extractionMethod = 'textract'; // Mark as textract for consistency
  } else if (isDocFile(fileType)) {
    // For DOC/DOCX, use Textract
    const result = await extractTextWithTextract(bucket, key);
    extractedText = result.text;
    confidence = result.confidence;
    pageCount = result.pageCount;
    extractionMethod = 'textract';
  } else {
    throw new Error(`Unsupported file type: ${fileType}`);
  }

  const processingTime = Date.now() - startTime;
  const wordCount = extractedText.split(/\s+/).length;

  // Store extracted text back to S3
  const textKey = `${userId}/${documentId}/extracted-text.txt`;
  await s3Client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: textKey,
    Body: extractedText,
    ContentType: 'text/plain',
    ServerSideEncryption: 'aws:kms',
    Metadata: {
      documentId,
      userId,
      originalFileName: fileName,
      extractionMethod,
      confidence: confidence.toString(),
      wordCount: wordCount.toString(),
      processingTime: processingTime.toString()
    }
  }));

  // Update DynamoDB with extraction results
  await updateExtractionResults(userId, documentId, {
    extractedText: textKey,
    wordCount,
    pageCount,
    confidence,
    extractionMethod,
    processingTime
  });

  console.log(`Text extraction completed for ${documentId}: ${wordCount} words, ${confidence}% confidence`);
}

/**
 * Extract text using Amazon Textract
 * Requirement 1.1: Handle different document formats
 */
async function extractTextWithTextract(bucket: string, key: string): Promise<{
  text: string;
  confidence: number;
  pageCount: number;
}> {
  try {
    // Use DetectDocumentText for simple text extraction
    const command = new DetectDocumentTextCommand({
      Document: {
        S3Object: {
          Bucket: bucket,
          Name: key
        }
      }
    });

    const response = await textractClient.send(command);
    
    if (!response.Blocks || response.Blocks.length === 0) {
      throw new Error('No text detected in document');
    }

    // Extract text and calculate average confidence
    let text = '';
    let totalConfidence = 0;
    let confidenceCount = 0;
    let pageCount = 0;

    for (const block of response.Blocks) {
      if (block.BlockType === 'LINE' && block.Text) {
        text += block.Text + '\n';
        if (block.Confidence) {
          totalConfidence += block.Confidence;
          confidenceCount++;
        }
      }
      if (block.BlockType === 'PAGE') {
        pageCount++;
      }
    }

    const averageConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;

    return {
      text: text.trim(),
      confidence: Math.round(averageConfidence),
      pageCount: pageCount || 1
    };
  } catch (error) {
    console.error('Textract extraction error:', error);
    throw new Error(`Text extraction failed: ${(error as Error).message}`);
  }
}

/**
 * Extract plain text from text files
 */
async function extractPlainText(stream: Readable): Promise<string> {
  const chunks: Buffer[] = [];
  
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  
  return Buffer.concat(chunks).toString('utf-8');
}

/**
 * Update processing status in DynamoDB
 */
async function updateProcessingStatus(
  userId: string,
  documentId: string,
  status: string,
  progress: number
): Promise<void> {
  const command = new UpdateItemCommand({
    TableName: PROGRESS_TABLE,
    Key: {
      userId: { S: userId },
      topicId: { S: `upload_${documentId}` }
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

/**
 * Update extraction results in DynamoDB
 */
async function updateExtractionResults(
  userId: string,
  documentId: string,
  results: {
    extractedText: string;
    wordCount: number;
    pageCount: number;
    confidence: number;
    extractionMethod: string;
    processingTime: number;
  }
): Promise<void> {
  const command = new UpdateItemCommand({
    TableName: PROGRESS_TABLE,
    Key: {
      userId: { S: userId },
      topicId: { S: `upload_${documentId}` }
    },
    UpdateExpression: 'SET #status = :status, extractedTextKey = :textKey, wordCount = :wordCount, ' +
                     'pageCount = :pageCount, confidence = :confidence, extractionMethod = :method, ' +
                     'processingTime = :time, uploadProgress = :progress, lastUpdated = :timestamp',
    ExpressionAttributeNames: {
      '#status': 'status'
    },
    ExpressionAttributeValues: {
      ':status': { S: 'extracted' },
      ':textKey': { S: results.extractedText },
      ':wordCount': { N: results.wordCount.toString() },
      ':pageCount': { N: results.pageCount.toString() },
      ':confidence': { N: results.confidence.toString() },
      ':method': { S: results.extractionMethod },
      ':time': { N: results.processingTime.toString() },
      ':progress': { N: '50' }, // 50% complete after extraction
      ':timestamp': { N: Date.now().toString() }
    }
  });

  await dynamoClient.send(command);
}

/**
 * Update document status on error
 * Requirement 1.5: Error handling for extraction failures
 */
async function updateDocumentStatus(
  record: S3EventRecord,
  status: string,
  errorMessage?: string
): Promise<void> {
  const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
  const pathParts = key.split('/');
  
  if (pathParts.length < 3) {
    console.error('Cannot update status: invalid key format');
    return;
  }

  const userId = pathParts[0];
  const documentId = pathParts[1];

  const command = new UpdateItemCommand({
    TableName: PROGRESS_TABLE,
    Key: {
      userId: { S: userId },
      topicId: { S: `upload_${documentId}` }
    },
    UpdateExpression: 'SET #status = :status, lastUpdated = :timestamp' +
                     (errorMessage ? ', errorMessage = :error' : ''),
    ExpressionAttributeNames: {
      '#status': 'status'
    },
    ExpressionAttributeValues: {
      ':status': { S: status },
      ':timestamp': { N: Date.now().toString() },
      ...(errorMessage && { ':error': { S: errorMessage } })
    }
  });

  await dynamoClient.send(command);
}

// File type helpers
function isImageFile(contentType: string): boolean {
  return contentType.startsWith('image/');
}

function isPdfFile(contentType: string): boolean {
  return contentType === 'application/pdf';
}

function isTextFile(contentType: string): boolean {
  return contentType === 'text/plain';
}

function isDocFile(contentType: string): boolean {
  return contentType === 'application/msword' || 
         contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
}
