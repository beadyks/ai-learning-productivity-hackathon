/**
 * Document upload type definitions
 * Covers file upload, validation, and progress tracking
 */

export type UploadStatus = 'pending' | 'uploading' | 'processing' | 'completed' | 'error';

export interface UploadProgress {
  uploadId: string;
  fileName: string;
  bytesUploaded: number;
  totalBytes: number;
  percentage: number;
  estimatedTimeRemaining: number;
  status: UploadStatus;
}

export interface UploadResult {
  documentId: string;
  fileName: string;
  fileSize: number;
  status: 'success' | 'error';
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface DocumentMetadata {
  documentId: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  uploadedAt: Date;
  processedAt?: Date;
  status: UploadStatus;
  pageCount?: number;
  extractedText?: string;
}

export interface DocumentUpload {
  // Upload Operations
  uploadFile(file: File): Promise<UploadResult>;
  cancelUpload(uploadId: string): void;
  
  // Validation
  validateFile(file: File): ValidationResult;
  getSupportedFormats(): string[];
  
  // Progress Tracking
  onProgress(callback: (progress: UploadProgress) => void): void;
}
