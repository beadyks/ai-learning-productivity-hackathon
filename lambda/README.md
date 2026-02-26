# Lambda Functions - Document Processing Pipeline

This directory contains the Lambda functions for the document processing pipeline of the Voice-First AI Learning Assistant.

## Overview

The document processing pipeline consists of three main Lambda functions that work together to process uploaded documents:

1. **Upload Handler** - Handles document upload requests and generates presigned URLs
2. **Text Extraction** - Extracts text from documents using Amazon Textract
3. **Content Chunking** - Chunks text and generates embeddings using Amazon Bedrock

## Architecture

```
User Upload → Upload Handler → S3 → Text Extraction → DynamoDB Stream → Content Chunking → Embeddings Storage
```

## Lambda Functions

### 1. Upload Handler (`upload-handler/`)

**Purpose**: Handles document upload initialization and validation

**Trigger**: HTTP API Gateway POST /documents/upload

**Features**:
- File type validation (PDF, DOC, DOCX, TXT, images)
- File size validation (max 100MB)
- Presigned URL generation for direct S3 upload
- Multipart upload support for large files (>5MB)
- Progress tracking in DynamoDB

**Environment Variables**:
- `DOCUMENT_BUCKET` - S3 bucket for document storage
- `PROGRESS_TABLE` - DynamoDB table for progress tracking
- `AWS_REGION` - AWS region

**Requirements**: 1.1 (document upload), 8.3 (progress tracking)

### 2. Upload Progress (`upload-progress/`)

**Purpose**: Tracks upload progress for large files

**Trigger**: HTTP API Gateway PUT /documents/progress

**Features**:
- Progress updates (0-100%)
- Status tracking (uploading, processing, completed, failed)
- Real-time progress monitoring

**Environment Variables**:
- `PROGRESS_TABLE` - DynamoDB table for progress tracking
- `AWS_REGION` - AWS region

**Requirements**: 8.3 (progress tracking)

### 3. Text Extraction (`text-extraction/`)

**Purpose**: Extracts text from uploaded documents

**Trigger**: S3 event notification on document upload

**Features**:
- Amazon Textract integration for PDF, DOC, DOCX, images
- Direct text extraction for plain text files
- Confidence scoring
- Error handling with descriptive messages
- Extracted text storage in S3

**Environment Variables**:
- `DOCUMENT_BUCKET` - S3 bucket for document storage
- `PROGRESS_TABLE` - DynamoDB table for progress tracking
- `AWS_REGION` - AWS region

**Requirements**: 1.1 (text extraction), 1.5 (error handling)

### 4. Content Chunking (`content-chunking/`)

**Purpose**: Chunks text and generates embeddings

**Trigger**: DynamoDB stream when text extraction completes

**Features**:
- Intelligent text chunking with overlap
- Sentence boundary detection
- Amazon Bedrock Titan Embeddings integration
- Batch processing to avoid rate limits
- Embeddings storage in DynamoDB

**Environment Variables**:
- `DOCUMENT_BUCKET` - S3 bucket for document storage
- `PROGRESS_TABLE` - DynamoDB table for progress tracking
- `EMBEDDINGS_TABLE` - DynamoDB table for embeddings storage
- `AWS_REGION` - AWS region

**Requirements**: 1.2 (content chunking), 1.3 (embedding generation)

## Configuration

### Chunking Parameters

- **Chunk Size**: 512 tokens (~2000 characters)
- **Chunk Overlap**: 50 tokens (~200 characters)
- **Characters per Token**: 4 (approximate)

### Supported File Formats

- PDF (`.pdf`)
- Microsoft Word (`.doc`, `.docx`)
- Plain Text (`.txt`)
- Images (`.jpg`, `.jpeg`, `.png`)

### File Size Limits

- Maximum file size: 100MB
- Multipart upload threshold: 5MB

## Development

### Building

Each Lambda function has its own `package.json` and can be built independently:

```bash
cd lambda/document-processing/upload-handler
npm install
npm run build
```

Or build all Lambda functions:

```bash
npm run build:lambdas
```

### Testing

Run tests for a specific Lambda function:

```bash
cd lambda/document-processing/upload-handler
npm test
```

## Deployment

Lambda functions are deployed automatically via AWS CDK:

```bash
npm run deploy
```

The CDK stack will:
1. Bundle Lambda functions using esbuild
2. Create Lambda functions with ARM64 architecture (20% cost savings)
3. Set up IAM permissions
4. Configure event triggers (S3, DynamoDB streams, API Gateway)

## Cost Optimization

- **ARM64 Architecture**: 20% cheaper than x86
- **Intelligent Memory Allocation**: 
  - Upload Handler: 512MB
  - Upload Progress: 256MB
  - Text Extraction: 1024MB
  - Content Chunking: 2048MB
- **Timeout Configuration**: Optimized per function
- **Batch Processing**: Reduces API calls to Bedrock

## Error Handling

All Lambda functions implement comprehensive error handling:

- Descriptive error messages
- Status updates in DynamoDB
- CloudWatch logging
- Retry logic for transient failures
- Graceful degradation

## Monitoring

Monitor Lambda functions via CloudWatch:

- Invocation count
- Error rate
- Duration
- Throttles
- Custom metrics for document processing

## Security

- KMS encryption for S3 and DynamoDB
- IAM least privilege permissions
- Cognito authentication for API endpoints
- VPC configuration (optional)
- Secrets Manager for sensitive data (if needed)
