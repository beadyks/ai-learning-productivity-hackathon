/**
 * UploadError Component
 * Displays upload errors with retry and recovery options
 * Requirements: 6.5
 */

import React from 'react';

interface UploadErrorProps {
  fileName: string;
  error: string;
  onRetry: () => void;
  onDismiss: () => void;
}

export const UploadError: React.FC<UploadErrorProps> = ({
  fileName,
  error,
  onRetry,
  onDismiss,
}) => {
  /**
   * Get user-friendly error message and suggestions
   */
  const getErrorDetails = (errorMessage: string): { message: string; suggestions: string[] } => {
    const lowerError = errorMessage.toLowerCase();

    // Network errors
    if (lowerError.includes('network') || lowerError.includes('connection')) {
      return {
        message: 'Network connection lost during upload',
        suggestions: [
          'Check your internet connection',
          'Try uploading again when connection is stable',
          'Consider uploading smaller files on slow connections',
        ],
      };
    }

    // File size errors
    if (lowerError.includes('size') || lowerError.includes('large')) {
      return {
        message: 'File is too large to upload',
        suggestions: [
          'Maximum file size is 50MB',
          'Try compressing the file',
          'Split large documents into smaller parts',
        ],
      };
    }

    // Format errors
    if (lowerError.includes('format') || lowerError.includes('type')) {
      return {
        message: 'File format is not supported',
        suggestions: [
          'Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG',
          'Convert your file to a supported format',
        ],
      };
    }

    // Server errors
    if (lowerError.includes('server') || lowerError.includes('500')) {
      return {
        message: 'Server error occurred',
        suggestions: [
          'This is a temporary issue',
          'Please try again in a few moments',
          'Contact support if the problem persists',
        ],
      };
    }

    // Timeout errors
    if (lowerError.includes('timeout') || lowerError.includes('timed out')) {
      return {
        message: 'Upload timed out',
        suggestions: [
          'Your connection may be too slow',
          'Try uploading during off-peak hours',
          'Consider using a faster internet connection',
        ],
      };
    }

    // Cancelled uploads
    if (lowerError.includes('cancel') || lowerError.includes('abort')) {
      return {
        message: 'Upload was cancelled',
        suggestions: [
          'Click retry to upload again',
        ],
      };
    }

    // Generic error
    return {
      message: errorMessage,
      suggestions: [
        'Please try uploading again',
        'Contact support if the problem continues',
      ],
    };
  };

  const { message, suggestions } = getErrorDetails(error);

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        {/* Error Icon */}
        <div className="flex-shrink-0">
          <span className="text-2xl">⚠️</span>
        </div>

        {/* Error Content */}
        <div className="flex-1 min-w-0">
          {/* File Name */}
          <p className="text-sm font-medium text-red-900 mb-1">
            Failed to upload: {fileName}
          </p>

          {/* Error Message */}
          <p className="text-sm text-red-700 mb-2">
            {message}
          </p>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-red-800 mb-1">
                What you can do:
              </p>
              <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
                {suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onRetry}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
            >
              <span className="mr-1">🔄</span>
              Retry Upload
            </button>
            <button
              onClick={onDismiss}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-700 hover:text-red-900 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
          aria-label="Dismiss error"
        >
          <span className="text-lg">✕</span>
        </button>
      </div>
    </div>
  );
};
