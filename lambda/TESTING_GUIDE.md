# Document Processing Pipeline - Testing Guide

## Quick Start Testing

### Prerequisites

1. Deploy the CDK stack:
```bash
npm run build
npm run deploy
```

2. Get the API Gateway URL from CloudFormation outputs:
```bash
aws cloudformation describe-stacks \
  --stack-name VoiceLearningAssistantStack \
  --query 'Stacks[0].Outputs[?OutputKey==`HttpApiUrl`].OutputValue' \
  --output text
```

3. Create a test user in Cognito and get an authentication token

## Manual Testing

### Test 1: Upload a Small Text File

**Step 1**: Initiate upload

```bash
curl -X POST https://YOUR_API_URL/documents/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test-document.txt",
    "fileType": "text/plain",
    "fileSize": 1024,
    "documentType": "notes",
    "subject": "testing"
  }'
```

**Expected Response**:
```json
{
  "uploadUrl": "https://s3.amazonaws.com/...",
  "documentId": "doc_1234567890_abc123",
  "message": "Upload URL generated successfully",
  "multipart": false
}
```

**Step 2**: Upload file to presigned URL

```bash
curl -X PUT "PRESIGNED_URL_FROM_STEP_1" \
  -H "Content-Type: text/plain" \
  --data-binary @test-document.txt
```

**Step 3**: Monitor processing

Check CloudWatch Logs for:
- Text extraction Lambda logs
- Content chunking Lambda logs

**Step 4**: Verify results in DynamoDB

```bash
# Check progress table
aws dynamodb get-item \
  --table-name voice-learning-progress \
  --key '{"userId": {"S": "YOUR_USER_ID"}, "topicId": {"S": "upload_doc_1234567890_abc123"}}'

# Check embeddings table
aws dynamodb query \
  --table-name voice-learning-embeddings \
  --index-name DocumentIndex \
  --key-condition-expression "documentId = :docId" \
  --expression-attribute-values '{":docId": {"S": "doc_1234567890_abc123"}}'
```

### Test 2: Upload a Large PDF File

**Step 1**: Initiate multipart upload

```bash
curl -X POST https://YOUR_API_URL/documents/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "large-document.pdf",
    "fileType": "application/pdf",
    "fileSize": 10485760,
    "documentType": "textbook",
    "subject": "computer-science"
  }'
```

**Expected Response**:
```json
{
  "uploadId": "MULTIPART_UPLOAD_ID",
  "documentId": "doc_1234567890_xyz789",
  "message": "Multipart upload initiated. Use the uploadId to upload parts.",
  "multipart": true
}
```

**Step 2**: Upload file parts (use AWS SDK or CLI)

**Step 3**: Update progress

```bash
curl -X PUT https://YOUR_API_URL/documents/progress \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "doc_1234567890_xyz789",
    "uploadProgress": 50,
    "status": "uploading"
  }'
```

### Test 3: Error Handling - Invalid File Type

```bash
curl -X POST https://YOUR_API_URL/documents/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test.exe",
    "fileType": "application/x-msdownload",
    "fileSize": 1024
  }'
```

**Expected Response**:
```json
{
  "error": "Unsupported file format. Supported formats: PDF, DOC, DOCX, TXT, JPEG, PNG. Received: application/x-msdownload"
}
```

### Test 4: Error Handling - File Too Large

```bash
curl -X POST https://YOUR_API_URL/documents/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "huge-file.pdf",
    "fileType": "application/pdf",
    "fileSize": 200000000
  }'
```

**Expected Response**:
```json
{
  "error": "File size exceeds maximum limit of 100MB"
}
```

## Automated Testing

### Unit Tests

Create test files for each Lambda function:

```typescript
// lambda/document-processing/upload-handler/index.test.ts
import { handler } from './index';

describe('Upload Handler', () => {
  test('validates file type correctly', async () => {
    const event = {
      body: JSON.stringify({
        fileName: 'test.pdf',
        fileType: 'application/pdf',
        fileSize: 1024
      }),
      requestContext: {
        authorizer: {
          jwt: {
            claims: {
              sub: 'test-user-id'
            }
          }
        }
      }
    };
    
    const result = await handler(event as any);
    expect(result.statusCode).toBe(200);
  });

  test('rejects invalid file type', async () => {
    const event = {
      body: JSON.stringify({
        fileName: 'test.exe',
        fileType: 'application/x-msdownload',
        fileSize: 1024
      }),
      requestContext: {
        authorizer: {
          jwt: {
            claims: {
              sub: 'test-user-id'
            }
          }
        }
      }
    };
    
    const result = await handler(event as any);
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toContain('Unsupported file format');
  });
});
```

Run tests:
```bash
cd lambda/document-processing/upload-handler
npm test
```

### Integration Tests

Test the complete pipeline:

```typescript
// lambda/integration-tests/document-pipeline.test.ts
describe('Document Processing Pipeline', () => {
  test('processes document end-to-end', async () => {
    // 1. Upload document
    const uploadResponse = await initiateUpload();
    expect(uploadResponse.documentId).toBeDefined();
    
    // 2. Wait for text extraction
    await waitForStatus(uploadResponse.documentId, 'extracted');
    
    // 3. Wait for chunking
    await waitForStatus(uploadResponse.documentId, 'chunking');
    
    // 4. Wait for completion
    await waitForStatus(uploadResponse.documentId, 'completed');
    
    // 5. Verify embeddings exist
    const embeddings = await getEmbeddings(uploadResponse.documentId);
    expect(embeddings.length).toBeGreaterThan(0);
  });
});
```

## Monitoring and Debugging

### CloudWatch Logs

View logs for each Lambda function:

```bash
# Upload Handler logs
aws logs tail /aws/lambda/voice-learning-upload-handler --follow

# Text Extraction logs
aws logs tail /aws/lambda/voice-learning-text-extraction --follow

# Content Chunking logs
aws logs tail /aws/lambda/voice-learning-content-chunking --follow
```

### CloudWatch Metrics

Monitor key metrics:

```bash
# Lambda invocations
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=voice-learning-upload-handler \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Sum

# Lambda errors
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value=voice-learning-text-extraction \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Sum
```

### X-Ray Tracing

Enable X-Ray for distributed tracing:

```typescript
// Add to Lambda function configuration
import * as AWSXRay from 'aws-xray-sdk-core';
const AWS = AWSXRay.captureAWS(require('aws-sdk'));
```

View traces in AWS X-Ray console to see the complete request flow.

## Performance Testing

### Load Testing

Use Artillery or similar tool:

```yaml
# artillery-config.yml
config:
  target: "https://YOUR_API_URL"
  phases:
    - duration: 60
      arrivalRate: 10
  processor: "./auth-processor.js"

scenarios:
  - name: "Upload documents"
    flow:
      - post:
          url: "/documents/upload"
          headers:
            Authorization: "Bearer {{ token }}"
          json:
            fileName: "test-{{ $randomString() }}.txt"
            fileType: "text/plain"
            fileSize: 1024
```

Run load test:
```bash
artillery run artillery-config.yml
```

### Benchmarking

Measure processing times:

```bash
# Time to extract text from 1MB PDF
# Expected: < 10 seconds

# Time to generate embeddings for 10 chunks
# Expected: < 5 seconds

# End-to-end processing time for 5MB document
# Expected: < 30 seconds
```

## Troubleshooting

### Common Issues

**Issue**: Upload fails with 403 Forbidden
- **Cause**: Invalid or expired JWT token
- **Solution**: Refresh authentication token

**Issue**: Text extraction times out
- **Cause**: Document too large or complex
- **Solution**: Increase Lambda timeout or split document

**Issue**: Embeddings not generated
- **Cause**: DynamoDB stream not triggering
- **Solution**: Check stream configuration and Lambda event source mapping

**Issue**: High costs
- **Cause**: Too many Textract or Bedrock API calls
- **Solution**: Implement caching, use open-source OCR for simple documents

### Debug Checklist

- [ ] Lambda functions deployed successfully
- [ ] IAM permissions configured correctly
- [ ] S3 event notifications enabled
- [ ] DynamoDB stream enabled
- [ ] API Gateway routes configured
- [ ] Cognito authorizer working
- [ ] CloudWatch logs accessible
- [ ] KMS key permissions granted

## Property-Based Testing (To Be Implemented)

### Property 1: Document Processing Completeness

Test that for any supported file format, the system:
1. Accepts the upload
2. Extracts text successfully
3. Generates chunks
4. Creates embeddings
5. Stores results in DynamoDB

### Property 2: Error Handling Consistency

Test that for any invalid input:
1. Returns appropriate error code
2. Provides descriptive error message
3. Does not leave partial data
4. Updates status correctly

## Next Steps

1. Implement property-based tests using fast-check
2. Add integration tests for complete pipeline
3. Set up CI/CD pipeline with automated testing
4. Create performance benchmarks
5. Add monitoring dashboards
