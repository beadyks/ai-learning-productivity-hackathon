# Document Upload Components

This directory contains components for the Document Upload Center feature, which allows students to upload study materials for curriculum-specific AI assistance.

## Components

### DocumentUploadCenter
Main component that orchestrates the entire upload flow.

**Features:**
- Drag-and-drop file upload
- File validation (format and size)
- Progress tracking with ETA
- Error handling with retry options
- Multiple concurrent uploads
- Upload cancellation

**Requirements:** 6.1, 6.2, 6.3, 6.4, 6.5

### UploadZone
Drag-and-drop zone with visual feedback.

**Features:**
- Drag-and-drop handlers
- Visual feedback on drag over
- File selection button
- Keyboard accessibility
- Disabled state support

**Requirements:** 6.1, 6.2

### UploadProgress
Individual upload progress display.

**Features:**
- Progress bar with percentage
- Estimated time remaining
- File size display
- Status indicators (uploading, processing, completed, error)
- Cancel button

**Requirements:** 6.3

### UploadProgressList
List of ongoing uploads.

**Features:**
- Displays multiple uploads
- Handles empty state
- Passes cancel events to parent

**Requirements:** 6.3

### UploadError
Error display with recovery options.

**Features:**
- User-friendly error messages
- Context-specific suggestions
- Retry button
- Dismiss button
- Error categorization (network, size, format, server, timeout)

**Requirements:** 6.5

## Services

### documentService
Handles S3 upload integration.

**Functions:**
- `requestPresignedUrl()` - Get pre-signed URL from backend
- `uploadToS3()` - Upload file to S3 with progress tracking
- `notifyUploadComplete()` - Notify backend of completion
- `uploadDocument()` - Complete upload flow

**Requirements:** 6.2, 6.3

## Utilities

### fileValidation
File validation utilities.

**Functions:**
- `validateFile()` - Validate single file
- `validateFiles()` - Validate multiple files
- `getFileExtension()` - Extract file extension
- `formatFileSize()` - Format bytes for display
- `getSupportedFormatsString()` - Get supported formats list

**Constants:**
- `SUPPORTED_FORMATS` - Array of supported file extensions
- `SUPPORTED_MIME_TYPES` - Array of supported MIME types
- `MAX_FILE_SIZE` - Maximum file size (50MB)

**Requirements:** 6.4

## Usage Example

```tsx
import { DocumentUploadCenter } from './components/document';

function App() {
  return (
    <div>
      <DocumentUploadCenter />
    </div>
  );
}
```

## Upload Flow

1. **User selects files** (drag-and-drop or click)
2. **Validation** - Check format and size
3. **Request pre-signed URL** from backend
4. **Upload to S3** with progress tracking
5. **Notify backend** of completion
6. **Backend processes** document (extraction, chunking, embedding)

## Error Handling

The components handle various error scenarios:

- **Network errors** - Suggest checking connection
- **File size errors** - Suggest compression or splitting
- **Format errors** - List supported formats
- **Server errors** - Suggest retry
- **Timeout errors** - Suggest better connection
- **Cancelled uploads** - Allow retry

All errors provide:
- Clear error message
- Actionable suggestions
- Retry option
- Dismiss option

## Accessibility

All components follow accessibility best practices:

- Keyboard navigation support
- ARIA labels and roles
- Focus indicators
- Screen reader announcements
- Minimum touch target sizes (44x44px)

## Performance

- **Concurrent uploads** - Multiple files upload simultaneously
- **Progress tracking** - Real-time progress with ETA
- **Cancellation** - Abort ongoing uploads
- **Cleanup** - Automatic removal of completed uploads
- **Memory efficient** - Uses XMLHttpRequest for streaming

## Testing

Property-based tests validate:
- **Property 11**: File upload validation and processing
- **Property 12**: Upload error recovery

Unit tests cover:
- File validation logic
- Progress calculation
- Error message generation
- Component rendering
- User interactions
