# Screen 4: Document Upload

## Purpose
Upload and manage study materials (PDF, DOC, images)

## Layout

```
┌─────────────────────────────────────────────────────────────┐
│ [←] Upload Documents                    [🌐 EN] [Profile ▼]│
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Upload Your Study Materials 📚                              │
│  PDFs, Word docs, images - we'll extract the text           │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                       │   │
│  │              ╔═══════════════════╗                   │   │
│  │              ║                   ║                   │   │
│  │              ║       📄          ║                   │   │
│  │              ║                   ║                   │   │
│  │              ║  Drag & Drop      ║                   │   │
│  │              ║  files here       ║                   │   │
│  │              ║                   ║                   │   │
│  │              ║  or click to      ║                   │   │
│  │              ║  browse           ║                   │   │
│  │              ║                   ║                   │   │
│  │              ╚═══════════════════╝                   │   │
│  │                                                       │   │
│  │  Supported: PDF, DOC, DOCX, TXT, JPG, PNG           │   │
│  │  Max size: 50MB per file                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  📋 Uploaded Documents (3)                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ✓ Data_Structures.pdf                               │   │
│  │   5.2 MB • Uploaded 2 days ago • 45 pages           │   │
│  │   [View] [Delete]                                   │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ ⏳ Algorithms_Notes.docx (Processing...)            │   │
│  │   2.1 MB • Extracting text... 60%                   │   │
│  │   ████████████░░░░░░                                │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ ✓ Syllabus.jpg                                      │   │
│  │   1.8 MB • Uploaded 1 week ago • OCR complete       │   │
│  │   [View] [Delete]                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  💡 Tip: Upload your syllabus, notes, and textbooks for     │
│     personalized learning based on YOUR materials            │
│                                                               │
│  [← Back to Dashboard]                                       │
└─────────────────────────────────────────────────────────────┘
```

## Key Elements

### Upload Area (Drag & Drop)
- Large drop zone (300x300px)
- Visual feedback on drag-over
- Click to browse alternative
- File type icons
- Size limit indicator

### File List
Each file shows:
- **Status icon**: ✓ (complete), ⏳ (processing), ❌ (error)
- **Filename**: Truncated if too long
- **Metadata**: Size, upload date, page count
- **Progress bar**: For processing files
- **Actions**: View, Delete buttons

### Processing States
1. **Uploading**: Progress bar, cancel option
2. **Processing**: OCR/text extraction progress
3. **Complete**: Success indicator, ready to use
4. **Error**: Error message, retry option

### Supported Formats
- **Documents**: PDF, DOC, DOCX, TXT
- **Images**: JPG, PNG (with OCR)
- **Max size**: 50MB per file
- **Language**: English, Hindi (OCR)

## Interactions

### Upload Flow
1. User drags file or clicks browse
2. File validation (type, size)
3. Upload progress indicator
4. OCR/text extraction (if needed)
5. Success notification
6. File appears in list

### Error Handling
- **Invalid format**: "Please upload PDF, DOC, or image files"
- **File too large**: "File exceeds 50MB limit"
- **Upload failed**: "Upload failed. Please try again"
- **OCR failed**: "Text extraction failed. Try another file"

### Bulk Upload
- Multiple file selection
- Queue management
- Parallel processing
- Overall progress indicator

## Mobile Responsive
- Smaller drop zone
- Vertical file list
- Swipe to delete
- Camera integration for photos
