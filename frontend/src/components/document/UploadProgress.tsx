/**
 * UploadProgress Component
 * Displays upload progress with percentage, estimated time, and cancel button
 * Requirements: 6.3
 */

import React from 'react';
import type { UploadProgress as UploadProgressType } from '../../types/document.types';
import { formatFileSize } from '../../utils/fileValidation';

interface UploadProgressProps {
  upload: UploadProgressType;
  onCancel: (uploadId: string) => void;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({ upload, onCancel }) => {
  const { uploadId, fileName, bytesUploaded, totalBytes, percentage, estimatedTimeRemaining, status } = upload;

  /**
   * Format time remaining for display
   */
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds < 0 || !isFinite(seconds)) return 'Calculating...';
    if (seconds < 60) return `${Math.round(seconds)}s remaining`;
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    
    if (minutes < 60) {
      return `${minutes}m ${remainingSeconds}s remaining`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m remaining`;
  };

  /**
   * Get status icon based on upload status
   */
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <span className="text-2xl">✅</span>;
      case 'error':
        return <span className="text-2xl">❌</span>;
      case 'uploading':
      case 'processing':
        return <span className="text-2xl animate-spin">⏳</span>;
      default:
        return <span className="text-2xl">📄</span>;
    }
  };

  /**
   * Get status text based on upload status
   */
  const getStatusText = () => {
    switch (status) {
      case 'completed':
        return 'Upload complete';
      case 'error':
        return 'Upload failed';
      case 'processing':
        return 'Processing...';
      case 'uploading':
        return formatTimeRemaining(estimatedTimeRemaining);
      case 'pending':
        return 'Pending...';
      default:
        return '';
    }
  };

  /**
   * Get progress bar color based on status
   */
  const getProgressBarColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-indigo-500';
    }
  };

  const canCancel = status === 'uploading' || status === 'pending';

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-start space-x-3">
        {/* Status Icon */}
        <div className="flex-shrink-0 mt-1">
          {getStatusIcon()}
        </div>

        {/* File Info and Progress */}
        <div className="flex-1 min-w-0">
          {/* File Name */}
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-900 truncate" title={fileName}>
              {fileName}
            </p>
            {canCancel && (
              <button
                onClick={() => onCancel(uploadId)}
                className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Cancel upload"
              >
                <span className="text-lg">✕</span>
              </button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-2">
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${getProgressBarColor()}`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
                role="progressbar"
                aria-valuenow={Math.round(percentage)}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>

          {/* Progress Details */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {formatFileSize(bytesUploaded)} / {formatFileSize(totalBytes)}
            </span>
            <span className="font-medium">
              {Math.round(percentage)}%
            </span>
          </div>

          {/* Status Text */}
          {status !== 'completed' && (
            <div className="mt-1 text-xs text-gray-500">
              {getStatusText()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
