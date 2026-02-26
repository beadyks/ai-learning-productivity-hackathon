# Technology Stack Documentation
## Voice-First AI Learning Assistant - Complete Technology Guide

---

## 📋 Table of Contents

1. [Technology Stack Overview](#technology-stack-overview)
2. [Frontend Technologies](#frontend-technologies)
3. [Backend Technologies](#backend-technologies)
4. [AI/ML Technologies](#aiml-technologies)
5. [DevOps & Infrastructure](#devops--infrastructure)
6. [Database & Storage](#database--storage)
7. [Security Technologies](#security-technologies)
8. [Monitoring & Analytics](#monitoring--analytics)
9. [Development Tools](#development-tools)
10. [Cost Optimization Technologies](#cost-optimization-technologies)

---

## Technology Stack Overview

### Architecture Philosophy
- **Serverless-First**: Minimize operational overhead and costs
- **Open-Source Preferred**: Use free alternatives where possible
- **Cloud-Native**: Leverage AWS managed services
- **Cost-Optimized**: Every technology choice prioritizes affordability
- **Developer-Friendly**: Modern, well-documented tools

### Technology Selection Criteria
1. **Cost**: Free or ultra-low-cost options preferred
2. **Performance**: Fast response times (<2 seconds)
3. **Scalability**: Handle 100,000+ students
4. **Maintainability**: Well-documented, active community
5. **Developer Experience**: Modern tooling, TypeScript support

---

## Frontend Technologies

### Core Framework

#### **React 18.2**
- **Purpose**: UI component library
- **Why**: Industry standard, huge ecosystem, excellent performance
- **Features Used**:
  - Hooks (useState, useEffect, useCallback, useMemo)
  - Suspense for lazy loading
  - Concurrent rendering
  - Server Components (via Next.js)
- **Cost**: FREE (Open Source)

#### **Next.js 14**
- **Purpose**: React framework with SSR/SSG
- **Why**: Best-in-class developer experience, automatic optimization
- **Features Used**:
  - App Router (new routing system)
  - Server Components
  - Static Site Generation (SSG)
  - Image Optimization
  - API Routes
- **Cost**: FREE (Open Source)
- **Deployment**: Static export to S3 (no Vercel costs)

#### **TypeScript 5.3**
- **Purpose**: Type safety and better developer experience
- **Why**: Catch errors at compile time, better IDE support
- **Features Used**:
  - Strict mode
  - Type inference
  - Generics
  - Utility types
- **Cost**: FREE (Open Source)

### UI/UX Libraries

#### **Tailwind CSS 3.4**
- **Purpose**: Utility-first CSS framework
- **Why**: Fast development, small bundle size, responsive design
- **Features Used**:
  - Utility classes
  - Responsive design
  - Dark mode support
  - Custom theme
- **Cost**: FREE (Open Source)

#### **shadcn/ui**
- **Purpose**: Accessible, customizable component library
- **Why**: Built on Radix UI, fully customizable, copy-paste components
- **Components Used**:
  - Button, Input, Select
  - Dialog, Sheet, Popover
  - Toast, Alert
  - Form components
- **Cost**: FREE (Open Source)

#### **Lucide Icons**
- **Purpose**: Modern icon library
- **Why**: Tree-shakeable, consistent design, React components
- **Cost**: FREE (Open Source)

#### **Framer Motion**
- **Purpose**: Animation library
- **Why**: Smooth animations, gesture support, layout animations
- **Features Used**:
  - Page transitions
  - Component animations
  - Gesture handling
- **Cost**: FREE (Open Source)

### Browser APIs (FREE!)

#### **Web Speech API**
- **Purpose**: Speech recognition and synthesis
- **Why**: FREE, native browser support, no AWS costs
- **Features**:
  - Speech Recognition (speech-to-text)
  - Speech Synthesis (text-to-speech)
  - Language support: English, Hindi, Hinglish
  - Continuous recognition
- **Browser Support**: Chrome, Edge, Safari (95%+ coverage)
- **Cost**: $0 (saves $2,640/month vs AWS Transcribe/Polly)

```javascript
// Speech Recognition Example
const recognition = new webkitSpeechRecognition();
recognition.lang = 'hi-IN'; // Hindi
recognition.continuous = true;
recognition.interimResults = true;

recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  console.log('User said:', transcript);
};

// Speech Synthesis Example
const utterance = new SpeechSynthesisUtterance('नमस्ते');
utterance.lang = 'hi-IN';
speechSynthesis.speak(utterance);
```

#### **Storage APIs**
- **LocalStorage**: Persistent key-value storage
- **IndexedDB**: Client-side database for documents
- **Cache API**: Service Worker cache for offline support
- **Cost**: FREE (browser native)

#### **PWA APIs**
- **Service Workers**: Offline support, background sync
- **Web Manifest**: Install as app
- **Push Notifications**: User engagement
- **Cost**: FREE (browser native)

### State Management

#### **Zustand 4.x**
- **Purpose**: Lightweight state management
- **Why**: Simple API, no boilerplate, TypeScript support
- **Use Cases**:
  - User authentication state
  - UI state (modals, sidebars)
  - Theme preferences
- **Cost**: FREE (Open Source)

#### **TanStack Query 5.x** (formerly React Query)
- **Purpose**: Server state management
- **Why**: Automatic caching, refetching, optimistic updates
- **Use Cases**:
  - API data fetching
  - Cache management
  - Infinite scrolling
- **Cost**: FREE (Open Source)

### Forms & Validation

#### **React Hook Form**
- **Purpose**: Form state management
- **Why**: Performance, minimal re-renders, easy validation
- **Cost**: FREE (Open Source)

#### **Zod**
- **Purpose**: Schema validation
- **Why**: TypeScript-first, type inference, composable
- **Cost**: FREE (Open Source)

### Build Tools

#### **Vite 5.x** / **Turbopack**
- **Purpose**: Fast build tool
- **Why**: Lightning-fast HMR, optimized production builds
- **Cost**: FREE (Open Source)

#### **SWC**
- **Purpose**: Fast TypeScript/JavaScript compiler
- **Why**: Rust-based, 20x faster than Babel
- **Cost**: FREE (Open Source)

---

## Backend Technologies

### Runtime & Languages

#### **Node.js 20 LTS**
- **Purpose**: JavaScript runtime for Lambda functions
- **Why**: Fast, event-driven, huge ecosystem
- **Features Used**:
  - ES Modules
  - Async/await
  - Streams
- **Cost**: FREE (Open Source)
- **Lambda Cost**: $0.0000133334 per GB-second (ARM64)

#### **Python 3.11**
- **Purpose**: ML/AI processing, OCR
- **Why**: Best ML ecosystem, easy to write, fast
- **Features Used**:
  - Type hints
  - Async/await
  - Context managers
- **Cost**: FREE (Open Source)
- **Lambda Cost**: $0.0000133334 per GB-second (ARM64)

### API Frameworks

#### **Express.js 4.x**
- **Purpose**: Node.js web framework
- **Why**: Minimal, flexible, well-documented
- **Features Used**:
  - Middleware
  - Routing
  - Error handling
- **Cost**: FREE (Open Source)

#### **FastAPI 0.109**
- **Purpose**: Python web framework
- **Why**: Fast, automatic API docs, async support
- **Features Used**:
  - Pydantic models
  - Automatic validation
  - OpenAPI docs
  - Async endpoints
- **Cost**: FREE (Open Source)

### AWS SDK

#### **AWS SDK for JavaScript v3**
- **Purpose**: Interact with AWS services
- **Services Used**:
  - S3 (document storage)
  - DynamoDB (user data)
  - Bedrock (AI)
  - Cognito (auth)
- **Cost**: FREE (SDK), pay for AWS services used

#### **Boto3** (Python AWS SDK)
- **Purpose**: Python AWS integration
- **Services Used**: Same as JavaScript SDK
- **Cost**: FREE (SDK)

---

## AI/ML Technologies

### Large Language Models

#### **Amazon Bedrock - Claude 3 Haiku**
- **Purpose**: Primary LLM for 95% of queries
- **Why**: 12x cheaper than Sonnet, fast responses
- **Pricing**: $0.00025 per 1K input tokens, $0.00125 per 1K output tokens
- **Use Cases**:
  - Simple Q&A
  - Explanations
  - Code examples
  - Study tips
- **Monthly Cost**: ~$25 for 1,000 students (with caching)

#### **Amazon Bedrock - Claude 3 Sonnet**
- **Purpose**: Complex reasoning (5% of queries)
- **Why**: Better at complex problems, multi-step reasoning
- **Pricing**: $0.003 per 1K input tokens, $0.015 per 1K output tokens
- **Use Cases**:
  - Complex problem solving
  - Multi-step reasoning
  - Code debugging
- **Monthly Cost**: ~$5 for 1,000 students

#### **Amazon Bedrock - Titan Embeddings**
- **Purpose**: Generate vector embeddings for semantic search
- **Why**: Cheapest embedding model, good quality
- **Pricing**: $0.0001 per 1K tokens
- **Dimensions**: 1536
- **Monthly Cost**: ~$2 for 1,000 students

### LLM Frameworks

#### **LangChain 0.1.x**
- **Purpose**: LLM application framework
- **Why**: Prompt templates, chains, memory management
- **Features Used**:
  - Prompt templates
  - Conversation chains
  - Memory (conversation history)
  - Document loaders
  - Output parsers
- **Cost**: FREE (Open Source)

```python
from langchain.prompts import ChatPromptTemplate
from langchain.chains import LLMChain

# Prompt template for tutor mode
tutor_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a patient tutor helping Indian students..."),
    ("human", "{question}")
])

chain = LLMChain(llm=bedrock_llm, prompt=tutor_prompt)
response = chain.run(question="Explain recursion")
```

#### **LlamaIndex**
- **Purpose**: Document indexing and retrieval
- **Why**: Easy document loading, chunking, indexing
- **Features Used**:
  - Document loaders (PDF, DOCX)
  - Text splitters
  - Vector store integration
- **Cost**: FREE (Open Source)

### Vector Database

#### **ChromaDB 0.4.x**
- **Purpose**: Vector database for semantic search
- **Why**: Open-source, easy to use, fast
- **Features**:
  - Vector similarity search
  - Metadata filtering
  - Collections
  - Persistence
- **Deployment**: Self-hosted on EC2 Spot
- **Cost**: $5/month (EC2 t3a.small Spot)
- **Savings**: $695/month vs OpenSearch Serverless

```python
import chromadb

# Initialize ChromaDB
client = chromadb.Client()
collection = client.create_collection("documents")

# Add documents with embeddings
collection.add(
    embeddings=[[0.1, 0.2, ...], [0.3, 0.4, ...]],
    documents=["Document 1", "Document 2"],
    metadatas=[{"source": "textbook"}, {"source": "notes"}],
    ids=["doc1", "doc2"]
)

# Query
results = collection.query(
    query_embeddings=[[0.1, 0.2, ...]],
    n_results=5
)
```

#### **Qdrant** (Alternative)
- **Purpose**: Alternative vector database
- **Why**: Rust-based, very fast, production-ready
- **Cost**: FREE (Open Source), same EC2 hosting cost

### OCR Technologies

#### **Tesseract 5.3**
- **Purpose**: English text OCR
- **Why**: Open-source, production-ready, 100+ languages
- **Accuracy**: 95%+ for printed English text
- **Cost**: $0 (saves $150/month vs Textract)

```python
import pytesseract
from PIL import Image

# Extract text from image
image = Image.open('document.jpg')
text = pytesseract.image_to_string(image, lang='eng')
```

#### **PaddleOCR**
- **Purpose**: Hindi text OCR
- **Why**: Better Hindi accuracy than Tesseract
- **Accuracy**: 90%+ for Hindi text
- **Cost**: $0 (Open Source)

```python
from paddleocr import PaddleOCR

# Initialize with Hindi support
ocr = PaddleOCR(lang='hi')

# Extract text
result = ocr.ocr('hindi_document.jpg')
for line in result:
    print(line[1][0])  # Extracted text
```

### Document Processing

#### **PyPDF2**
- **Purpose**: PDF parsing and text extraction
- **Why**: Simple, reliable, pure Python
- **Cost**: FREE (Open Source)

#### **pdfplumber**
- **Purpose**: Advanced PDF parsing (tables, layout)
- **Why**: Better table extraction than PyPDF2
- **Cost**: FREE (Open Source)

#### **Pillow (PIL)**
- **Purpose**: Image processing
- **Why**: Standard Python imaging library
- **Cost**: FREE (Open Source)

#### **OpenCV**
- **Purpose**: Advanced image processing
- **Why**: Noise reduction, enhancement for better OCR
- **Cost**: FREE (Open Source)

### Text Processing

#### **spaCy**
- **Purpose**: NLP tasks (NER, POS tagging)
- **Why**: Fast, production-ready, pre-trained models
- **Cost**: FREE (Open Source)

#### **NLTK**
- **Purpose**: Text processing utilities
- **Why**: Stopwords, tokenization, stemming
- **Cost**: FREE (Open Source)

### Caching & Optimization

#### **Redis 7.x**
- **Purpose**: Response caching
- **Why**: Fast, in-memory, 60% cache hit rate
- **Deployment**: ElastiCache or self-hosted
- **TTL**: 24 hours for responses
- **Cost**: ~$15/month (ElastiCache t3.micro)
- **Savings**: 60% reduction in AI costs

#### **Query Router**
- **Purpose**: Route queries to appropriate model
- **Logic**:
  - Simple queries → Haiku (cheap)
  - Complex queries → Sonnet (expensive)
- **Implementation**: Custom Python logic
- **Cost**: FREE (custom code)

---

## DevOps & Infrastructure

### Version Control

#### **Git 2.x**
- **Purpose**: Version control
- **Why**: Industry standard
- **Cost**: FREE (Open Source)

#### **GitHub**
- **Purpose**: Git hosting, collaboration
- **Why**: Free for public repos, excellent CI/CD
- **Cost**: FREE (public repos)

### CI/CD

#### **GitHub Actions**
- **Purpose**: Automated CI/CD pipeline
- **Why**: Integrated with GitHub, free for public repos
- **Workflows**:
  - Lint & format check
  - Unit tests
  - Build & deploy
  - Infrastructure updates
- **Cost**: FREE (2,000 minutes/month for private repos)

```yaml
# .github/workflows/deploy.yml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Build
        run: npm run build
      - name: Deploy to S3
        run: aws s3 sync ./out s3://my-bucket
```

### Infrastructure as Code

#### **Terraform 1.7**
- **Purpose**: Infrastructure provisioning
- **Why**: Declarative, state management, AWS provider
- **Resources Managed**:
  - Lambda functions
  - API Gateway
  - S3 buckets
  - DynamoDB tables
  - IAM roles
  - CloudFront distributions
- **Cost**: FREE (Open Source)

```hcl
# terraform/lambda.tf
resource "aws_lambda_function" "api_handler" {
  filename      = "lambda.zip"
  function_name = "api-handler"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  architectures = ["arm64"]  # 20% cheaper
  
  environment {
    variables = {
      NODE_ENV = "production"
    }
  }
}
```

### Containerization

#### **Docker 24.x**
- **Purpose**: Containerization for local dev and EC2
- **Why**: Consistent environments, easy deployment
- **Images Used**:
  - node:20-alpine (lightweight)
  - python:3.11-slim (lightweight)
  - chromadb/chroma (vector DB)
- **Cost**: FREE (Open Source)

#### **Docker Compose**
- **Purpose**: Multi-container local development
- **Why**: Easy local setup, matches production
- **Cost**: FREE (Open Source)

```yaml
# docker-compose.yml
version: '3.8'
services:
  chroma:
    image: chromadb/chroma:latest
    ports:
      - "8000:8000"
    volumes:
      - chroma-data:/chroma/chroma
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  chroma-data:
```

---

## Database & Storage

### NoSQL Database

#### **Amazon DynamoDB**
- **Purpose**: User data, sessions, progress tracking
- **Why**: Serverless, auto-scaling, pay-per-request
- **Billing**: On-Demand (no minimum cost)
- **Features Used**:
  - Single-table design
  - TTL for temporary data
  - Point-in-time recovery
  - Global secondary indexes
- **Cost**: ~$5/month for 1,000 students
- **Free Tier**: 25GB storage, 25 read/write units

**Tables:**
- Users (PK: userId)
- Sessions (PK: sessionId, TTL: 7 days)
- Progress (PK: userId, SK: topicId)
- Documents (PK: userId, SK: documentId)

### Object Storage

#### **Amazon S3**
- **Purpose**: Document storage, static website hosting
- **Why**: Durable, scalable, cheap
- **Storage Classes**:
  - Standard: Hot data
  - Intelligent-Tiering: Auto-optimization
  - Glacier: Backups
- **Features Used**:
  - Lifecycle policies
  - Versioning
  - Server-side encryption
  - CloudFront integration
- **Cost**: ~$6/month for 500GB (Intelligent-Tiering)
- **Free Tier**: 5GB Standard storage

**Buckets:**
- Static website (React build)
- User documents (PDFs, images)
- Backups (Glacier)

---

## Security Technologies

### Authentication

#### **Amazon Cognito**
- **Purpose**: User authentication and authorization
- **Why**: Managed service, MFA support, JWT tokens
- **Features Used**:
  - User Pools (authentication)
  - Identity Pools (AWS credentials)
  - MFA (SMS, TOTP)
  - Password policies
  - Social login (Google, Facebook)
- **Cost**: FREE for first 50,000 MAU
- **Pricing**: $0.0055 per MAU after free tier

#### **jsonwebtoken (JWT)**
- **Purpose**: Token generation and verification
- **Why**: Stateless authentication, standard
- **Cost**: FREE (Open Source)

### Encryption

#### **AWS KMS**
- **Purpose**: Encryption key management
- **Why**: Managed service, automatic rotation
- **Use Cases**:
  - S3 encryption
  - DynamoDB encryption
  - Secrets encryption
- **Cost**: $1/month per key + $0.03 per 10,000 requests

#### **AWS Secrets Manager**
- **Purpose**: Store API keys and credentials
- **Why**: Automatic rotation, encrypted
- **Cost**: $0.40 per secret per month

### Network Security

#### **AWS WAF**
- **Purpose**: Web application firewall
- **Why**: DDoS protection, rate limiting, SQL injection prevention
- **Rules**:
  - Rate limiting (100 req/5min per IP)
  - Geo-blocking (optional)
  - SQL injection protection
  - XSS protection
- **Cost**: $5/month + $1 per million requests

#### **AWS Shield Standard**
- **Purpose**: DDoS protection
- **Why**: Automatic, always-on
- **Cost**: FREE (included with AWS)

---

## Monitoring & Analytics

### Application Monitoring

#### **Amazon CloudWatch**
- **Purpose**: Logs, metrics, alarms
- **Why**: Integrated with AWS, free tier
- **Features Used**:
  - Lambda logs
  - Custom metrics
  - Alarms (cost, errors)
  - Dashboards
- **Cost**: FREE for 5GB logs, 10 custom metrics
- **Pricing**: $0.50 per GB ingested after free tier

#### **AWS X-Ray**
- **Purpose**: Distributed tracing
- **Why**: Debug performance issues, visualize service map
- **Cost**: $5 per million traces (first 100K free)

### Error Tracking

#### **Sentry**
- **Purpose**: Error tracking and monitoring
- **Why**: Real-time alerts, stack traces, user context
- **Cost**: FREE for 5,000 events/month
- **Pricing**: $26/month for 50,000 events

### Product Analytics

#### **PostHog**
- **Purpose**: Product analytics, feature flags
- **Why**: Open-source, self-hostable, privacy-friendly
- **Features**:
  - Event tracking
  - User funnels
  - Session recording
  - Feature flags
- **Cost**: FREE for 1M events/month (cloud)
- **Alternative**: Self-host for FREE

#### **Mixpanel** (Alternative)
- **Purpose**: User analytics
- **Cost**: FREE for 100K events/month

---

## Development Tools

### Code Quality

#### **ESLint**
- **Purpose**: JavaScript/TypeScript linting
- **Why**: Catch errors, enforce style
- **Cost**: FREE (Open Source)

#### **Prettier**
- **Purpose**: Code formatting
- **Why**: Consistent style, automatic
- **Cost**: FREE (Open Source)

### Testing

#### **Jest**
- **Purpose**: JavaScript unit testing
- **Why**: Fast, snapshot testing, mocking
- **Cost**: FREE (Open Source)

#### **Vitest**
- **Purpose**: Vite-native unit testing
- **Why**: Faster than Jest, better DX
- **Cost**: FREE (Open Source)

#### **Playwright**
- **Purpose**: End-to-end testing
- **Why**: Cross-browser, reliable, fast
- **Cost**: FREE (Open Source)

#### **pytest**
- **Purpose**: Python unit testing
- **Why**: Simple, powerful, fixtures
- **Cost**: FREE (Open Source)

### API Testing

#### **Postman**
- **Purpose**: API testing and documentation
- **Why**: Easy to use, collaboration
- **Cost**: FREE for personal use

#### **Thunder Client** (VS Code extension)
- **Purpose**: Lightweight API testing
- **Why**: Integrated with VS Code
- **Cost**: FREE

---

## Cost Optimization Technologies

### Caching Strategy

**Multi-Layer Caching:**
1. **Browser Cache**: LocalStorage, IndexedDB
2. **CDN Cache**: CloudFront (1TB free)
3. **Application Cache**: Redis (60% hit rate)
4. **Database Cache**: DynamoDB (embedding cache)

**Total Savings**: 60-70% reduction in backend costs

### Compute Optimization

**Lambda ARM64:**
- 20% cheaper than x86
- Better performance per dollar
- Same code, just change architecture

**EC2 Spot Instances:**
- 70% cheaper than on-demand
- Auto-failover to on-demand
- Perfect for stateless workloads (Chroma DB)

### Storage Optimization

**S3 Intelligent-Tiering:**
- Automatic cost optimization
- Moves data to cheaper tiers automatically
- 50% savings on infrequently accessed data

**DynamoDB TTL:**
- Automatic deletion of expired data
- No storage costs for temporary data
- Perfect for sessions, cache

### Network Optimization

**CloudFront Free Tier:**
- 1TB data transfer free
- Reduces origin requests
- Faster for users

**HTTP API vs REST API:**
- 70% cheaper
- Same functionality
- WebSocket support

---

## Technology Cost Summary

### FREE Technologies (Save $2,790/month)
- Web Speech API: $0 (saves $2,640)
- Tesseract/PaddleOCR: $0 (saves $150)
- All open-source libraries: $0

### Ultra-Low-Cost Technologies ($100/month)
- ChromaDB on EC2 Spot: $5 (saves $695)
- Bedrock Haiku + Cache: $30 (saves $220)
- Lambda ARM64: $20 (saves $65)
- HTTP API Gateway: $10 (saves $25)
- S3 Intelligent-Tiering: $6 (saves $6)
- DynamoDB On-Demand: $5 (saves $10)
- Other services: $24 (saves $79)

### Total Monthly Cost: $100 for 1,000 students
### Cost per Student: $0.10/month (₹8.30)
### Total Savings: 98% ($4,674/month)

---

## Technology Selection Rationale

### Why These Technologies?

1. **Cost-First Approach**
   - Every technology choice prioritizes cost
   - Free alternatives preferred (Browser APIs, open-source)
   - Managed services only when cost-effective

2. **Developer Experience**
   - Modern, well-documented tools
   - TypeScript for type safety
   - Fast feedback loops (Vite, HMR)

3. **Performance**
   - ARM64 for better performance per dollar
   - Caching at every layer
   - CDN for global distribution

4. **Scalability**
   - Serverless auto-scaling
   - Horizontal scaling (Lambda, DynamoDB)
   - Can handle 100,000+ students

5. **Maintainability**
   - Infrastructure as Code (Terraform)
   - Automated CI/CD (GitHub Actions)
   - Comprehensive monitoring (CloudWatch, Sentry)

---

## Getting Started

### Local Development Setup

```bash
# Clone repository
git clone https://github.com/your-org/ai-learning-assistant
cd ai-learning-assistant

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local

# Start development server
npm run dev

# Start backend services (Docker)
docker-compose up -d

# Run tests
npm test
```

### Deployment

```bash
# Build frontend
npm run build

# Deploy infrastructure
cd terraform
terraform init
terraform apply

# Deploy Lambda functions
npm run deploy:lambda

# Deploy frontend to S3
npm run deploy:frontend
```

---

## Conclusion

This technology stack achieves:

✅ **98% cost reduction** through smart technology choices
✅ **Modern developer experience** with TypeScript, React, Next.js
✅ **Production-ready** with monitoring, testing, CI/CD
✅ **Scalable** to 100,000+ students
✅ **Maintainable** with IaC, automated deployments
✅ **Affordable** for Indian middle-class students (₹49-99/month)

**Total Technology Cost**: $100/month for 1,000 students
**Cost per Student**: ₹8.30/month
**Profit Margin**: 80-85% at scale

This makes quality AI-powered education accessible to every Indian student! 🚀
