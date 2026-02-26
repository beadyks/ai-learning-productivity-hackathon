import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { S3Client, PutObjectCommand, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, PutItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });

const DOCUMENT_BUCKET = process.env.DOCUMENT_BUCKET!;
const PROGRESS_TABLE = process.env.PROGRESS_TABLE!;
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const SUPPORTED_FORMATS = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/jpg'
];

interface UploadRequest {
  fileName: string;
  fileType: string;
  fileSize: number;
  userId: string;
  documentType?: 'syllabus' | 'notes' | 'textbook' | 'reference';
  subject?: string;
}

interface UploadResponse {
  uploadUrl?: string;
  uploadId?: string;
  documentId: string;
  message: string;
  multipart?: boolean;
}

/**
 * Lambda handler for document upload and validation
 * Requirements: 1.1 (document upload), 8.3 (progress tracking)
 */
export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    console.log('Upload request received:', JSON.stringify(event));

    // Parse request body
    const body: UploadRequest = JSON.parse(event.body || '{}');
    
    // Extract userId from authorizer context
    const userId = event.requestContext.authorizer?.jwt?.claims?.sub as string;
    if (!userId) {
      return createErrorResponse(401, 'Unauthorized: User ID not found');
    }

    // Validate request
    const validationError = validateUploadRequest(body);
    if (validationError) {
      return createErrorResponse(400, validationError);
    }

    // Generate unique document ID
    const documentId = generateDocumentId(userId);
    const key = `${userId}/${documentId}/${body.fileName}`;

    // Check if multipart upload is needed (files > 5MB)
    const useMultipart = body.fileSize > 5 * 1024 * 1024;

    if (useMultipart) {
      // Create multipart upload for large files
      const uploadId = await initiateMultipartUpload(key, body.fileType);
      
      // Store upload metadata in DynamoDB
      await storeUploadMetadata(documentId, userId, body, 'uploading');

      return createSuccessResponse({
        uploadId,
        documentId,
        message: 'Multipart upload initiated. Use the uploadId to upload parts.',
        multipart: true
      });
    } else {
      // Generate presigned URL for direct upload (small files)
      const uploadUrl = await generatePresignedUrl(key, body.fileType);
      
      // Store upload metadata in DynamoDB
      await storeUploadMetadata(documentId, userId, body, 'pending');

      return createSuccessResponse({
        uploadUrl,
        documentId,
        message: 'Upload URL generated successfully',
        multipart: false
      });
    }
  } catch (error) {
    console.error('Upload handler error:', error);
    return createErrorResponse(500, 'Internal server error during upload initialization');
  }
};

/**
 * Validate upload request
 * Requirement 1.1: File type validation and size limits
 */
function validateUploadRequest(body: UploadRequest): string | null {
  if (!body.fileName) {
    return 'File name is required';
  }

  if (!body.fileType) {
    return 'File type is required';
  }

  if (!body.fileSize || body.fileSize <= 0) {
    return 'Valid file size is required';
  }

  // Validate file type
  if (!SUPPORTED_FORMATS.includes(body.fileType)) {
    return `Unsupported file format. Supported formats: PDF, DOC, DOCX, TXT, JPEG, PNG. Received: ${body.fileType}`;
  }

  // Validate file size
  if (body.fileSize > MAX_FILE_SIZE) {
    return `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
  }

  return null;
}

/**
 * Generate unique document ID
 */
function generateDocumentId(userId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `doc_${timestamp}_${random}`;
}

/**
 * Generate presigned URL for S3 upload
 */
async function generatePresignedUrl(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: DOCUMENT_BUCKET,
    Key: key,
    ContentType: contentType,
    ServerSideEncryption: 'aws:kms'
  });

  // URL expires in 15 minutes
  const url = await getSignedUrl(s3Client, command, { expiresIn: 900 });
  return url;
}

/**
 * Initiate multipart upload for large files
 * Requirement 8.3: Progress tracking for large file uploads
 */
async function initiateMultipartUpload(key: string, contentType: string): Promise<string> {
  const command = new CreateMultipartUploadCommand({
    Bucket: DOCUMENT_BUCKET,
    Key: key,
    ContentType: contentType,
    ServerSideEncryption: 'aws:kms'
  });

  const response = await s3Client.send(command);
  return response.UploadId!;
}

/**
 * Store upload metadata in DynamoDB
 */
async function storeUploadMetadata(
  documentId: string,
  userId: string,
  body: UploadRequest,
  status: string
): Promise<void> {
  const command = new PutItemCommand({
    TableName: PROGRESS_TABLE,
    Item: {
      userId: { S: userId },
      topicId: { S: `upload_${documentId}` },
      documentId: { S: documentId },
      fileName: { S: body.fileName },
      fileType: { S: body.fileType },
      fileSize: { N: body.fileSize.toString() },
      documentType: { S: body.documentType || 'reference' },
      subject: { S: body.subject || 'general' },
      status: { S: status },
      uploadProgress: { N: '0' },
      createdAt: { N: Date.now().toString() },
      lastUpdated: { N: Date.now().toString() }
    }
  });

  await dynamoClient.send(command);
}

/**
 * Create success response
 */
function createSuccessResponse(data: UploadResponse): APIGatewayProxyResultV2 {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(data)
  };
}

/**
 * Create error response
 */
function createErrorResponse(statusCode: number, message: string): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ error: message })
  };
}
