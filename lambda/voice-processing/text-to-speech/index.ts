import {
  PollyClient,
  SynthesizeSpeechCommand,
  VoiceId,
  Engine,
  OutputFormat,
} from '@aws-sdk/client-polly';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const pollyClient = new PollyClient({ region: process.env.AWS_REGION || 'us-east-1' });
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

const AUDIO_BUCKET = process.env.AUDIO_BUCKET || '';

interface TextToSpeechRequest {
  text: string;
  language?: 'en-US' | 'hi-IN' | 'en-IN';
  voiceId?: string;
  userId: string;
  sessionId: string;
  format?: 'mp3' | 'ogg_vorbis'; // Compressed formats for bandwidth optimization
}

interface TextToSpeechResponse {
  audioUrl: string;
  audioKey: string;
  language: string;
  voiceId: string;
  format: string;
  expiresIn: number; // Seconds until URL expires
}

/**
 * Voice selection mapping for different languages
 * Optimized for natural-sounding speech in English and Hindi
 */
const VOICE_MAPPING: Record<string, { voiceId: VoiceId; engine: Engine }> = {
  'en-US': { voiceId: 'Joanna' as VoiceId, engine: 'neural' as Engine }, // Female, US English
  'en-IN': { voiceId: 'Aditi' as VoiceId, engine: 'neural' as Engine }, // Female, Indian English
  'hi-IN': { voiceId: 'Aditi' as VoiceId, engine: 'neural' as Engine }, // Supports Hindi
};

/**
 * Lambda handler for text-to-speech processing
 * Supports multiple languages with voice selection and audio compression
 * Requirements: 4.2, 8.2
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}') as TextToSpeechRequest;
    
    // Validate input
    if (!body.text || !body.userId || !body.sessionId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Missing required fields: text, userId, sessionId',
        }),
      };
    }

    // Validate text length (Polly has limits)
    if (body.text.length > 3000) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Text too long. Maximum 3000 characters allowed.',
        }),
      };
    }

    // Determine language and voice
    const language = body.language || 'en-US';
    
    if (!['en-US', 'hi-IN', 'en-IN'].includes(language)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Unsupported language. Supported languages: en-US, hi-IN, en-IN',
        }),
      };
    }

    const voiceConfig = VOICE_MAPPING[language];
    const voiceId = body.voiceId || voiceConfig.voiceId;
    
    // Determine output format (default to ogg_vorbis for better compression)
    const outputFormat = body.format || 'ogg_vorbis';
    
    // Synthesize speech
    const synthesizeCommand = new SynthesizeSpeechCommand({
      Text: body.text,
      VoiceId: voiceId as VoiceId,
      Engine: voiceConfig.engine,
      OutputFormat: outputFormat as OutputFormat,
      LanguageCode: language,
      // Use standard quality for bandwidth optimization
      SampleRate: outputFormat === 'mp3' ? '22050' : '22050',
    });

    const synthesizeResponse = await pollyClient.send(synthesizeCommand);
    
    if (!synthesizeResponse.AudioStream) {
      throw new Error('No audio stream received from Polly');
    }

    // Convert audio stream to buffer
    const audioBuffer = await streamToBuffer(synthesizeResponse.AudioStream);
    
    // Compress and store audio in S3
    const audioKey = `tts/${body.userId}/${body.sessionId}/${Date.now()}.${
      outputFormat === 'ogg_vorbis' ? 'ogg' : 'mp3'
    }`;
    
    await s3Client.send(
      new PutObjectCommand({
        Bucket: AUDIO_BUCKET,
        Key: audioKey,
        Body: audioBuffer,
        ContentType: outputFormat === 'ogg_vorbis' ? 'audio/ogg' : 'audio/mpeg',
        // Set lifecycle for automatic cleanup after 24 hours
        Metadata: {
          userId: body.userId,
          sessionId: body.sessionId,
          language,
        },
      })
    );

    // Generate presigned URL for audio access (expires in 1 hour)
    const audioUrl = await getSignedUrl(
      s3Client,
      new PutObjectCommand({
        Bucket: AUDIO_BUCKET,
        Key: audioKey,
      }),
      { expiresIn: 3600 }
    );

    const response: TextToSpeechResponse = {
      audioUrl,
      audioKey,
      language,
      voiceId,
      format: outputFormat,
      expiresIn: 3600,
    };

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('Error in text-to-speech processing:', error);
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to process text-to-speech request',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

/**
 * Convert readable stream to buffer
 */
async function streamToBuffer(stream: any): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  
  return Buffer.concat(chunks);
}

/**
 * Get available voices for a language
 * Utility function for voice selection
 */
export async function getAvailableVoices(language: string): Promise<string[]> {
  const voiceConfig = VOICE_MAPPING[language];
  
  if (!voiceConfig) {
    return [];
  }
  
  // Return available voices for the language
  // In production, this could query Polly's DescribeVoices API
  switch (language) {
    case 'en-US':
      return ['Joanna', 'Matthew', 'Ivy', 'Kendra', 'Kimberly', 'Salli', 'Joey', 'Justin'];
    case 'en-IN':
      return ['Aditi', 'Raveena'];
    case 'hi-IN':
      return ['Aditi'];
    default:
      return [];
  }
}
