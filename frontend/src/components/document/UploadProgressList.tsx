/**
 * UploadProgressList Component
 * Displays a list of ongoing and completed uploads
 * Requirements: 6.3
 */

import React from 'react';
import { UploadProgress } from './UploadProgress';
import type { UploadProgress as UploadProgressType } from '../../types/document.types';

interface UploadProgressListProps {
  uploads: UploadProgressType[];
  onCancel: (uploadId: string) => void;
}

export const UploadProgressList: React.FC<UploadProgressListProps> = ({ uploads, onCancel }) => {
  if (uploads.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">
        {uploads.length === 1 ? 'Upload in Progress' : `${uploads.length} Uploads in Progress`}
      </h3>
      <div className="space-y-2">
        {uploads.map((upload) => (
          <UploadProgress
            key={upload.uploadId}
            upload={upload}
            onCancel={onCancel}
          />
        ))}
      </div>
    </div>
  );
};
