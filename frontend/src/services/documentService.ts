/**
 * Document Service
 * Handles document upload to S3 with progress tracking
 * Requirements: 6.2, 6.3
 */

import { apiClient } from './apiClient';
import type { UploadResult, UploadProgress } from '../types/document.types';

/**
 * Pre-signed URL response from backend
 */
interface PresignedUrlResponse {
  uploadUrl: string;
  documentId: string;
  fields?: Record<string, string>;
}

/**
 * Upload completion notification payload
 */
interface UploadCompletePayload {
  documentId: string;
  fileName: string;
  fileSize: number;
  contentType: string;
}

/**
 * Progress callback type
 */
type ProgressCallback = (progress: UploadProgress) => void;

/**
 * Generate unique upload ID
 */
const generateUploadId = (): string => {
  return `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Calculate estimated time remaining
 */
const calculateETA = (
  bytesUploaded: number,
  totalBytes: number,
  startTime: number
): number => {
  const elapsedTime = (Date.now() - startTime) / 1000; // seconds
  const uploadSpeed = bytesUploaded / elapsedTime; // bytes per second
  const remainingBytes = totalBytes - bytesUploaded;
  
  if (uploadSpeed === 0) return 0;
  
  return remainingBytes / uploadSpeed;
};

/**
 * Request pre-signed URL from backend for S3 upload
 * 
 * @param fileName - Name of the file to upload
 * @param fileSize - Size of the file in bytes
 * @param contentType - MIME type of the file
 * @returns Pre-signed URL and document ID
 */
export const requestPresignedUrl = async (
  fileName: string,
  fileSize: number,
  contentType: string
): Promise<PresignedUrlResponse> => {
  try {
    const response = await apiClient.post<PresignedUrlResponse>(
      '/documents/upload-url',
      {
        fileName,
        fileSize,
        contentType,
      }
    );

    return response.data;
  } catch (error) {
    console.error('Failed to request pre-signed URL:', error);
    throw new Error('Failed to initiate upload. Please try again.');
  }
};

/**
 * Upload file to S3 using pre-signed URL with progress tracking
 * 
 * @param url - Pre-signed S3 URL
 * @param file - File to upload
 * @param uploadId - Unique upload identifier
 * @param onProgress - Progress callback
 * @param abortSignal - Optional abort signal for cancellation
 * @returns Promise that resolves when upload completes
 */
export const uploadToS3 = async (
  url: string,
  file: File,
  uploadId: string,
  onProgress: ProgressCallback,
  abortSignal?: AbortSignal
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const startTime = Date.now();

    // Handle abort signal
    if (abortSignal) {
      abortSignal.addEventListener('abort', () => {
        xhr.abort();
        reject(new Error('Upload cancelled'));
      });
    }

    // Track upload progress
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percentage = (event.loaded / event.total) * 100;
        const eta = calculateETA(event.loaded, event.total, startTime);

        onProgress({
          uploadId,
          fileName: file.name,
          bytesUploaded: event.loaded,
          totalBytes: event.total,
          percentage,
          estimatedTimeRemaining: eta,
          status: 'uploading',
        });
      }
    });

    // Handle successful upload
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress({
          uploadId,
          fileName: file.name,
          bytesUploaded: file.size,
          totalBytes: file.size,
          percentage: 100,
          estimatedTimeRemaining: 0,
          status: 'processing',
        });
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    // Handle errors
    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload cancelled'));
    });

    // Open connection and send file
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
};

/**
 * Notify backend that upload is complete
 * 
 * @param documentId - Document ID from pre-signed URL response
 * @param fileName - Name of the uploaded file
 * @param fileSize - Size of the uploaded file
 * @param contentType - MIME type of the file
 */
export const notifyUploadComplete = async (
  documentId: string,
  fileName: string,
  fileSize: number,
  contentType: string
): Promise<void> => {
  try {
    await apiClient.post('/documents/upload-complete', {
      documentId,
      fileName,
      fileSize,
      contentType,
    } as UploadCompletePayload);
  } catch (error) {
    console.error('Failed to notify upload completion:', error);
    throw new Error('Upload completed but notification failed. Document may not be processed.');
  }
};

/**
 * Complete file upload flow: request URL, upload to S3, notify backend
 * 
 * @param file - File to upload
 * @param onProgress - Progress callback
 * @param abortSignal - Optional abort signal for cancellation
 * @returns Upload result with document ID
 */
export const uploadDocument = async (
  file: File,
  onProgress: ProgressCallback,
  abortSignal?: AbortSignal
): Promise<UploadResult> => {
  const uploadId = generateUploadId();

  try {
    // Initial progress
    onProgress({
      uploadId,
      fileName: file.name,
      bytesUploaded: 0,
      totalBytes: file.size,
      percentage: 0,
      estimatedTimeRemaining: 0,
      status: 'pending',
    });

    // Step 1: Request pre-signed URL
    const { uploadUrl, documentId } = await requestPresignedUrl(
      file.name,
      file.size,
      file.type
    );

    // Step 2: Upload to S3
    await uploadToS3(uploadUrl, file, uploadId, onProgress, abortSignal);

    // Step 3: Notify backend of completion
    await notifyUploadComplete(documentId, file.name, file.size, file.type);

    // Final progress
    onProgress({
      uploadId,
      fileName: file.name,
      bytesUploaded: file.size,
      totalBytes: file.size,
      percentage: 100,
      estimatedTimeRemaining: 0,
      status: 'completed',
    });

    return {
      documentId,
      fileName: file.name,
      fileSize: file.size,
      status: 'success',
    };
  } catch (error) {
    // Error progress
    onProgress({
      uploadId,
      fileName: file.name,
      bytesUploaded: 0,
      totalBytes: file.size,
      percentage: 0,
      estimatedTimeRemaining: 0,
      status: 'error',
    });

    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    
    return {
      documentId: '',
      fileName: file.name,
      fileSize: file.size,
      status: 'error',
      error: errorMessage,
    };
  }
};

/**
 * Document service singleton
 */
export const documentService = {
  requestPresignedUrl,
  uploadToS3,
  notifyUploadComplete,
  uploadDocument,
};
