/**
 * UploadZone Component
 * Drag-and-drop file upload zone with visual feedback
 * Requirements: 6.1, 6.2
 */

import React, { useState, useRef } from 'react';

interface UploadZoneProps {
  onFilesSelected: (files: FileList) => void;
  disabled?: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFilesSelected, disabled = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set dragging to false if we're leaving the drop zone entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFilesSelected(files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFilesSelected(files);
    }
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div
      className={`
        relative border-2 border-dashed rounded-lg p-8 text-center transition-all
        ${isDragging 
          ? 'border-indigo-500 bg-indigo-50' 
          : 'border-gray-300 bg-white hover:border-gray-400'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Upload files by dragging and dropping or clicking to select files"
      aria-describedby="upload-zone-description"
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
        aria-hidden="true"
      />

      <div className="flex flex-col items-center space-y-4">
        {isDragging ? (
          <>
            <div className="text-6xl" aria-hidden="true">📄</div>
            <div>
              <p className="text-lg font-semibold text-indigo-600">Drop files here</p>
              <p className="text-sm text-gray-500 mt-1">Release to upload</p>
            </div>
          </>
        ) : (
          <>
            <div className="text-6xl" aria-hidden="true">📤</div>
            <div>
              <p className="text-lg font-semibold text-gray-700">
                Drag and drop files here
              </p>
              <p className="text-sm text-gray-500 mt-1">
                or click to browse
              </p>
            </div>
            <div id="upload-zone-description" className="text-xs text-gray-400 mt-2">
              Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG (Max 50MB)
            </div>
          </>
        )}
      </div>
    </div>
  );
};
