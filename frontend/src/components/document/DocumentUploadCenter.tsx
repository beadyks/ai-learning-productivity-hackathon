/**
 * DocumentUploadCenter Component
 * Main component for document upload with drag-and-drop, validation, and progress tracking
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import React, { useState, useCallback } from 'react';
import { UploadZone } from './UploadZone';
import { UploadProgressList } from './UploadProgressList';
import { UploadError } from './UploadError';
import { validateFile } from '../../utils/fileValidation';
import { uploadDocument } from '../../services/documentService';
import type { UploadProgress, UploadResult } from '../../types/document.types';

interface FailedUpload {
  file: File;
  error: string;
}

export const DocumentUploadCenter: React.FC = () => {
  const [uploads, setUploads] = useState<Map<string, UploadProgress>>(new Map());
  const [failedUploads, setFailedUploads] = useState<Map<string, FailedUpload>>(new Map());
  const [abortControllers, setAbortControllers] = useState<Map<string, AbortController>>(new Map());

  /**
   * Handle progress updates for an upload
   */
  const handleProgress = useCallback((progress: UploadProgress) => {
    setUploads((prev) => {
      const next = new Map(prev);
      next.set(progress.uploadId, progress);
      return next;
    });

    // Remove completed uploads after a delay
    if (progress.status === 'completed') {
      setTimeout(() => {
        setUploads((prev) => {
          const next = new Map(prev);
          next.delete(progress.uploadId);
          return next;
        });
      }, 3000); // Remove after 3 seconds
    }
  }, []);

  /**
   * Process a single file upload
   */
  const processFile = useCallback(async (file: File) => {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      const errorKey = `error-${Date.now()}-${file.name}`;
      setFailedUploads((prev) => {
        const next = new Map(prev);
        next.set(errorKey, {
          file,
          error: validation.errors.join('. '),
        });
        return next;
      });
      return;
    }

    // Create abort controller for cancellation
    const abortController = new AbortController();
    const uploadId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    setAbortControllers((prev) => {
      const next = new Map(prev);
      next.set(uploadId, abortController);
      return next;
    });

    try {
      // Upload file
      const result: UploadResult = await uploadDocument(
        file,
        handleProgress,
        abortController.signal
      );

      // Handle upload result
      if (result.status === 'error') {
        const errorKey = `error-${Date.now()}-${file.name}`;
        setFailedUploads((prev) => {
          const next = new Map(prev);
          next.set(errorKey, {
            file,
            error: result.error || 'Upload failed',
          });
          return next;
        });
      }
    } catch (error) {
      // Handle unexpected errors
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      const errorKey = `error-${Date.now()}-${file.name}`;
      setFailedUploads((prev) => {
        const next = new Map(prev);
        next.set(errorKey, {
          file,
          error: errorMessage,
        });
        return next;
      });
    } finally {
      // Clean up abort controller
      setAbortControllers((prev) => {
        const next = new Map(prev);
        next.delete(uploadId);
        return next;
      });
    }
  }, [handleProgress]);

  /**
   * Handle files selected for upload
   */
  const handleFilesSelected = useCallback((files: FileList) => {
    const fileArray = Array.from(files);
    
    // Process each file
    fileArray.forEach((file) => {
      processFile(file);
    });
  }, [processFile]);

  /**
   * Cancel an ongoing upload
   */
  const handleCancelUpload = useCallback((uploadId: string) => {
    const abortController = abortControllers.get(uploadId);
    if (abortController) {
      abortController.abort();
      
      // Remove from uploads
      setUploads((prev) => {
        const next = new Map(prev);
        next.delete(uploadId);
        return next;
      });
      
      // Clean up abort controller
      setAbortControllers((prev) => {
        const next = new Map(prev);
        next.delete(uploadId);
        return next;
      });
    }
  }, [abortControllers]);

  /**
   * Retry a failed upload
   */
  const handleRetryUpload = useCallback((errorKey: string) => {
    const failedUpload = failedUploads.get(errorKey);
    if (failedUpload) {
      // Remove from failed uploads
      setFailedUploads((prev) => {
        const next = new Map(prev);
        next.delete(errorKey);
        return next;
      });
      
      // Retry upload
      processFile(failedUpload.file);
    }
  }, [failedUploads, processFile]);

  /**
   * Dismiss an error
   */
  const handleDismissError = useCallback((errorKey: string) => {
    setFailedUploads((prev) => {
      const next = new Map(prev);
      next.delete(errorKey);
      return next;
    });
  }, []);

  const activeUploads = Array.from(uploads.values());
  const errors = Array.from(failedUploads.entries());

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Header - Mobile-first responsive */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Document Upload Center</h2>
        <p className="text-sm text-gray-600 mt-1">
          Upload your study materials to get curriculum-specific answers
        </p>
      </div>

      {/* Upload Zone */}
      <UploadZone
        onFilesSelected={handleFilesSelected}
        disabled={false}
      />

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="space-y-3">
          {errors.map(([errorKey, failedUpload]) => (
            <UploadError
              key={errorKey}
              fileName={failedUpload.file.name}
              error={failedUpload.error}
              onRetry={() => handleRetryUpload(errorKey)}
              onDismiss={() => handleDismissError(errorKey)}
            />
          ))}
        </div>
      )}

      {/* Upload Progress */}
      <UploadProgressList
        uploads={activeUploads}
        onCancel={handleCancelUpload}
      />

      {/* Help Text - Mobile-first responsive */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">
          Tips for uploading documents:
        </h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG</li>
          <li>Maximum file size: 50MB per file</li>
          <li>You can upload multiple files at once</li>
          <li>Documents are processed automatically after upload</li>
          <li>Processing may take a few minutes for large documents</li>
        </ul>
      </div>
    </div>
  );
};
