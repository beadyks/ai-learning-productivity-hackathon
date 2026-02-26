import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBClient, UpdateItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const PROGRESS_TABLE = process.env.PROGRESS_TABLE!;

interface ProgressUpdateRequest {
  documentId: string;
  uploadProgress: number; // 0-100
  status?: 'uploading' | 'processing' | 'completed' | 'failed';
}

/**
 * Lambda handler for tracking upload progress
 * Requirement 8.3: Progress tracking for large file uploads
 */
export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    console.log('Progress update request:', JSON.stringify(event));

    // Extract userId from authorizer context
    const userId = event.requestContext.authorizer?.jwt?.claims?.sub as string;
    if (!userId) {
      return createErrorResponse(401, 'Unauthorized: User ID not found');
    }

    // Parse request body
    const body: ProgressUpdateRequest = JSON.parse(event.body || '{}');

    if (!body.documentId) {
      return createErrorResponse(400, 'Document ID is required');
    }

    if (body.uploadProgress < 0 || body.uploadProgress > 100) {
      return createErrorResponse(400, 'Upload progress must be between 0 and 100');
    }

    // Update progress in DynamoDB
    const updateCommand = new UpdateItemCommand({
      TableName: PROGRESS_TABLE,
      Key: {
        userId: { S: userId },
        topicId: { S: `upload_${body.documentId}` }
      },
      UpdateExpression: 'SET uploadProgress = :progress, lastUpdated = :timestamp' + 
                       (body.status ? ', #status = :status' : ''),
      ExpressionAttributeValues: {
        ':progress': { N: body.uploadProgress.toString() },
        ':timestamp': { N: Date.now().toString() },
        ...(body.status && { ':status': { S: body.status } })
      },
      ...(body.status && {
        ExpressionAttributeNames: {
          '#status': 'status'
        }
      }),
      ReturnValues: 'ALL_NEW'
    });

    const result = await dynamoClient.send(updateCommand);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Progress updated successfully',
        progress: body.uploadProgress,
        status: body.status || 'uploading'
      })
    };
  } catch (error) {
    console.error('Progress update error:', error);
    return createErrorResponse(500, 'Failed to update upload progress');
  }
};

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
