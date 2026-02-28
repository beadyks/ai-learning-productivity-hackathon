/**
 * File Validation Utilities
 * Validates file format and size for document uploads
 * Requirements: 6.4
 */

import type { ValidationResult } from '../types/document.types';

/**
 * Supported file formats for upload
 */
export const SUPPORTED_FORMATS = [
  '.pdf',
  '.doc',
  '.docx',
  '.txt',
  '.jpg',
  '.jpeg',
  '.png',
] as const;

/**
 * MIME types corresponding to supported formats
 */
export const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'image/png',
] as const;

/**
 * Maximum file size in bytes (50MB)
 */
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Validate a file for upload
 * Checks format and size constraints
 * 
 * @param file - File to validate
 * @returns ValidationResult with valid flag and error messages
 */
export const validateFile = (file: File): ValidationResult => {
  const errors: string[] = [];

  // Check file format by extension
  const extension = getFileExtension(file.name);
  if (!SUPPORTED_FORMATS.includes(extension as any)) {
    errors.push(
      `Unsupported file format "${extension}". Supported formats: ${SUPPORTED_FORMATS.join(', ')}`
    );
  }

  // Check file format by MIME type (additional validation)
  if (file.type && !SUPPORTED_MIME_TYPES.includes(file.type as any)) {
    // Only add error if extension check also failed
    if (!SUPPORTED_FORMATS.includes(extension as any)) {
      errors.push(`Invalid file type: ${file.type}`);
    }
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const maxSizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
    errors.push(
      `File size (${sizeMB}MB) exceeds maximum allowed size of ${maxSizeMB}MB`
    );
  }

  // Check for empty files
  if (file.size === 0) {
    errors.push('File is empty');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validate multiple files
 * 
 * @param files - FileList or File array to validate
 * @returns Map of file names to validation results
 */
export const validateFiles = (
  files: FileList | File[]
): Map<string, ValidationResult> => {
  const results = new Map<string, ValidationResult>();
  const fileArray = Array.from(files);

  for (const file of fileArray) {
    results.set(file.name, validateFile(file));
  }

  return results;
};

/**
 * Get file extension from filename
 * 
 * @param filename - Name of the file
 * @returns File extension including the dot (e.g., ".pdf")
 */
export const getFileExtension = (filename: string): string => {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return '';
  }
  return filename.substring(lastDotIndex).toLowerCase();
};

/**
 * Format file size for display
 * 
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Get supported formats as a human-readable string
 * 
 * @returns Comma-separated list of supported formats
 */
export const getSupportedFormatsString = (): string => {
  return SUPPORTED_FORMATS.join(', ');
};
