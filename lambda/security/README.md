# Security and Compliance Services

This directory contains Lambda functions for security and compliance features of the Voice-First AI Learning Assistant.

## Overview

The security services implement comprehensive data protection, encryption, authentication, and authorization capabilities to ensure user data is secure and compliant with data protection regulations.

## Components

### 1. Data Protection Service (`data-protection/`)

Handles encryption, secure deletion, and compliance checking.

**Requirements Addressed:**
- 9.1: End-to-end encryption for documents
- 9.4: Secure deletion capabilities
- 9.2: Data protection compliance checks

**Key Features:**
- **Secure Delete**: Complete removal of user data across all services (S3, DynamoDB)
- **Encryption**: KMS-based encryption for sensitive data
- **Compliance Checks**: Automated verification of security controls
- **Data Inventory**: Complete listing of user data for transparency

**API Endpoints:**
- `POST /security/data-protection` - Execute data protection operations

**Actions:**
- `secure-delete` - Securely delete user documents or all user data
- `encrypt-data` - Encrypt sensitive data using KMS
- `decrypt-data` - Decrypt encrypted data
- `compliance-check` - Verify compliance with security requirements
- `data-inventory` - List all data associated with a user

### 2. Authentication & Authorization Service (`auth-manager/`)

Manages user roles, permissions, and data sharing.

**Requirements Addressed:**
- 9.3: Amazon Cognito authentication integration
- 9.3: Role-based access control (RBAC)
- 9.5: Data sharing permission management

**Key Features:**
- **Role-Based Access Control**: Four user roles with distinct permissions
- **Permission Checking**: Verify user permissions before operations
- **Document Sharing**: Share documents with explicit permissions
- **Cognito Integration**: Seamless integration with AWS Cognito

**API Endpoints:**
- `POST /security/auth` - Execute authentication/authorization operations
- `GET /security/auth` - Get user roles and permissions

**Actions:**
- `check-permission` - Verify if user has specific permission
- `assign-role` - Assign role to user
- `remove-role` - Remove role from user
- `get-user-roles` - Get all roles for a user
- `share-document` - Share document with another user
- `revoke-share` - Revoke document sharing
- `list-shared-documents` - List documents shared with user
- `initialize-groups` - Initialize Cognito groups for RBAC

## User Roles

### Student (Default)
- Read/write/delete own data
- Upload documents
- Access AI features

### Premium Student
- All Student permissions
- Share documents
- Access premium features (unlimited usage, priority responses)

### Educator
- All Premium Student permissions
- View analytics

### Admin
- All permissions
- Manage users
- System administration

## Permissions

- `read:own_data` - Read own user data
- `write:own_data` - Modify own user data
- `delete:own_data` - Delete own user data
- `upload:documents` - Upload study materials
- `share:documents` - Share documents with others
- `access:ai_features` - Use AI learning features
- `access:premium_features` - Use premium features
- `manage:users` - Manage other users (admin only)
- `view:analytics` - View system analytics

## Security Features

### Encryption

**At Rest:**
- All DynamoDB tables encrypted with customer-managed KMS key
- S3 bucket encrypted with KMS
- Automatic key rotation enabled

**In Transit:**
- HTTPS enforced by API Gateway
- TLS 1.2+ required
- Certificate-based authentication

### Data Protection

**Secure Deletion:**
- Multi-step deletion process
- Removes data from all services (S3, DynamoDB)
- Audit trail maintained
- Complies with GDPR "right to erasure"

**Data Retention:**
- Sessions auto-expire using DynamoDB TTL
- Document shares expire after 30 days
- Configurable retention policies

### Access Control

**Authentication:**
- AWS Cognito user pools
- Email verification required
- Strong password policy (8+ chars, mixed case, numbers)
- Account recovery via email

**Authorization:**
- JWT-based authentication
- Role-based access control (RBAC)
- Fine-grained permissions
- Resource-level access control

### Compliance

**Automated Checks:**
- Encryption verification
- Access control validation
- Audit logging verification
- Data retention compliance

**Audit Logging:**
- All operations logged to CloudWatch
- User actions tracked
- Security events monitored
- Retention: 90 days

## Usage Examples

### Check User Permission

```bash
curl -X POST https://api.example.com/security/auth \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "check-permission",
    "permission": "share:documents"
  }'
```

### Share Document

```bash
curl -X POST https://api.example.com/security/auth \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "share-document",
    "documentId": "doc_123",
    "shareWithUserId": "user_456",
    "sharePermissions": ["read"]
  }'
```

### Secure Delete User Data

```bash
curl -X POST https://api.example.com/security/data-protection \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "secure-delete"
  }'
```

### Run Compliance Check

```bash
curl -X POST https://api.example.com/security/data-protection \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "compliance-check"
  }'
```

## Deployment

The security Lambda functions are deployed as part of the main infrastructure stack:

```bash
cd infrastructure
npm run build
cdk deploy
```

## Testing

Run unit tests:

```bash
cd lambda/security/data-protection
npm test

cd ../auth-manager
npm test
```

## Environment Variables

### Data Protection Function
- `DOCUMENT_BUCKET` - S3 bucket for documents
- `USER_PROFILES_TABLE` - DynamoDB table for user profiles
- `SESSIONS_TABLE` - DynamoDB table for sessions
- `PROGRESS_TABLE` - DynamoDB table for progress
- `EMBEDDINGS_TABLE` - DynamoDB table for embeddings
- `ENCRYPTION_KEY_ID` - KMS key ID for encryption
- `AWS_REGION` - AWS region

### Auth Manager Function
- `USER_POOL_ID` - Cognito User Pool ID
- `USER_PROFILES_TABLE` - DynamoDB table for user profiles
- `PERMISSIONS_TABLE` - DynamoDB table for permissions
- `AWS_REGION` - AWS region

## Security Best Practices

1. **Least Privilege**: Functions have minimal required permissions
2. **Encryption**: All data encrypted at rest and in transit
3. **Audit Logging**: All operations logged for compliance
4. **Input Validation**: All inputs validated before processing
5. **Error Handling**: Errors logged without exposing sensitive data
6. **Secure Deletion**: Multi-step process ensures complete removal
7. **Access Control**: JWT-based authentication with RBAC
8. **Key Rotation**: KMS keys automatically rotated

## Compliance

The security implementation supports compliance with:

- **GDPR**: Right to erasure, data portability, consent management
- **CCPA**: Data deletion, access rights
- **SOC 2**: Access control, encryption, audit logging
- **ISO 27001**: Information security management

## Monitoring

Security events are monitored through:

- **CloudWatch Logs**: All Lambda invocations logged
- **CloudWatch Metrics**: Custom metrics for security events
- **CloudWatch Alarms**: Alerts for suspicious activity
- **AWS CloudTrail**: API call auditing

## Support

For security issues or questions:
- Review the design document: `.kiro/specs/voice-first-ai-learning-assistant/design.md`
- Check requirements: `.kiro/specs/voice-first-ai-learning-assistant/requirements.md`
- Contact: security@voicelearning.example.com
