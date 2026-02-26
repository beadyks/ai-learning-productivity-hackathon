import {
  TranscribeClient,
  StartTranscriptionJobCommand,
  GetTranscriptionJobCommand,
  TranscriptionJob,
  LanguageCode as TranscribeLanguageCode,
} from '@aws-sdk/client-transcribe';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const transcribeClient = new TranscribeClient({ region: process.env.AWS_REGION || 'us-east-1' });
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

const AUDIO_BUCKET = process.env.AUDIO_BUCKET || '';
const TRANSCRIPTION_BUCKET = process.env.TRANSCRIPTION_BUCKET || '';

interface TranscriptionRequest {
  audioData: string; // Base64 encoded audio
  language?: 'en-US' | 'hi-IN' | 'en-IN'; // English, Hindi, or Indian English
  userId: string;
  sessionId: string;
}

interface TranscriptionResponse {
  transcriptionId: string;
  text?: string;
  confidence?: number;
  language: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  error?: string;
}

/**
 * Lambda handler for speech-to-text processing
 * Supports English and Hindi languages with confidence scoring
 * Requirements: 4.1, 6.1
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}') as TranscriptionRequest;
    
    // Validate input
    if (!body.audioData || !body.userId || !body.sessionId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Missing required fields: audioData, userId, sessionId',
        }),
      };
    }

    // Determine language (default to English)
    const language = body.language || 'en-US';
    
    // Validate language support
    if (!['en-US', 'hi-IN', 'en-IN'].includes(language)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Unsupported language. Supported languages: en-US, hi-IN, en-IN',
        }),
      };
    }

    // Check if this is a status check request
    const queryParams = event.queryStringParameters || {};
    if (queryParams.transcriptionId) {
      return await getTranscriptionStatus(queryParams.transcriptionId);
    }

    // Start new transcription
    const transcriptionId = `${body.userId}-${body.sessionId}-${Date.now()}`;
    
    // Upload audio to S3
    const audioKey = `audio/${transcriptionId}.webm`;
    const audioBuffer = Buffer.from(body.audioData, 'base64');
    
    await s3Client.send(
      new PutObjectCommand({
        Bucket: AUDIO_BUCKET,
        Key: audioKey,
        Body: audioBuffer,
        ContentType: 'audio/webm',
      })
    );

    // Start transcription job
    const transcriptionJobName = transcriptionId;
    const mediaFileUri = `s3://${AUDIO_BUCKET}/${audioKey}`;

    await transcribeClient.send(
      new StartTranscriptionJobCommand({
        TranscriptionJobName: transcriptionJobName,
        LanguageCode: language as TranscribeLanguageCode,
        MediaFormat: 'webm',
        Media: {
          MediaFileUri: mediaFileUri,
        },
        OutputBucketName: TRANSCRIPTION_BUCKET,
        Settings: {
          ShowSpeakerLabels: false,
          MaxSpeakerLabels: 1,
        },
      })
    );

    const response: TranscriptionResponse = {
      transcriptionId,
      status: 'IN_PROGRESS',
      language,
    };

    return {
      statusCode: 202,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('Error in speech-to-text processing:', error);
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to process speech-to-text request',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

/**
 * Get transcription job status and results
 * Includes confidence scoring for quality assessment
 */
async function getTranscriptionStatus(
  transcriptionId: string
): Promise<APIGatewayProxyResult> {
  try {
    const command = new GetTranscriptionJobCommand({
      TranscriptionJobName: transcriptionId,
    });

    const result = await transcribeClient.send(command);
    const job = result.TranscriptionJob as TranscriptionJob;

    if (!job) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Transcription job not found',
        }),
      };
    }

    const response: TranscriptionResponse = {
      transcriptionId,
      status: job.TranscriptionJobStatus as 'IN_PROGRESS' | 'COMPLETED' | 'FAILED',
      language: job.LanguageCode || 'en-US',
    };

    // If completed, fetch and parse the transcription
    if (job.TranscriptionJobStatus === 'COMPLETED' && job.Transcript?.TranscriptFileUri) {
      const transcriptData = await fetchTranscript(job.Transcript.TranscriptFileUri);
      response.text = transcriptData.text;
      response.confidence = transcriptData.confidence;
    }

    // Handle failures
    if (job.TranscriptionJobStatus === 'FAILED') {
      response.error = job.FailureReason || 'Transcription failed';
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('Error getting transcription status:', error);
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to get transcription status',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
}

/**
 * Fetch and parse transcription results from S3
 * Calculates average confidence score
 */
async function fetchTranscript(
  transcriptUri: string
): Promise<{ text: string; confidence: number }> {
  try {
    // Parse S3 URI
    const match = transcriptUri.match(/s3:\/\/([^\/]+)\/(.+)/);
    if (!match) {
      throw new Error('Invalid transcript URI format');
    }

    const [, bucket, key] = match;

    // Fetch transcript from S3
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await s3Client.send(command);
    const transcriptJson = await response.Body?.transformToString();

    if (!transcriptJson) {
      throw new Error('Empty transcript response');
    }

    const transcript = JSON.parse(transcriptJson);
    
    // Extract text and calculate average confidence
    const results = transcript.results;
    const text = results.transcripts[0]?.transcript || '';
    
    // Calculate average confidence from items
    let totalConfidence = 0;
    let itemCount = 0;
    
    if (results.items) {
      for (const item of results.items) {
        if (item.alternatives && item.alternatives[0]?.confidence) {
          totalConfidence += parseFloat(item.alternatives[0].confidence);
          itemCount++;
        }
      }
    }
    
    const confidence = itemCount > 0 ? totalConfidence / itemCount : 0;

    return { text, confidence };
  } catch (error) {
    console.error('Error fetching transcript:', error);
    throw error;
  }
}
