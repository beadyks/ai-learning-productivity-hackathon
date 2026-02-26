import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayIntegrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as path from 'path';

/**
 * Main infrastructure stack for Voice-First AI Learning Assistant
 * Implements ultra-low-cost architecture with security and scalability
 * Requirements: 9.1 (encryption), 9.3 (authentication), 11.2 (scalability)
 */
export class VoiceLearningAssistantStack extends cdk.Stack {
  public userProfilesTable: dynamodb.Table;
  public sessionsTable: dynamodb.Table;
  public progressTable: dynamodb.Table;
  public embeddingsTable: dynamodb.Table;
  public rateLimitsTable: dynamodb.Table;
  public documentBucket: s3.Bucket;
  public userPool: cognito.UserPool;
  public userPoolClient: cognito.UserPoolClient;
  public httpApi: apigateway.HttpApi;
  public encryptionKey: kms.Key;
  
  // Lambda functions
  public uploadHandlerFunction: lambdaNodejs.NodejsFunction;
  public uploadProgressFunction: lambdaNodejs.NodejsFunction;
  public textExtractionFunction: lambdaNodejs.NodejsFunction;
  public contentChunkingFunction: lambdaNodejs.NodejsFunction;
  
  // AI Response Lambda functions
  public responseGeneratorFunction: lambdaNodejs.NodejsFunction;
  public modeControllerFunction: lambdaNodejs.NodejsFunction;
  public semanticSearchFunction: lambdaNodejs.NodejsFunction;

  // Session Management Lambda functions
  public sessionPersistenceFunction: lambdaNodejs.NodejsFunction;
  public contextManagerFunction: lambdaNodejs.NodejsFunction;

  // Security Lambda functions
  public dataProtectionFunction: lambdaNodejs.NodejsFunction;
  public authManagerFunction: lambdaNodejs.NodejsFunction;

  // API Orchestrator Lambda function
  public apiOrchestratorFunction: lambdaNodejs.NodejsFunction;

  // Conversation Orchestrator Lambda function
  public conversationOrchestratorFunction: lambdaNodejs.NodejsFunction;

  // Response Quality Optimizer Lambda function
  public responseQualityOptimizerFunction: lambdaNodejs.NodejsFunction;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create KMS key for encryption (Requirement 9.1)
    this.encryptionKey = new kms.Key(this, 'EncryptionKey', {
      description: 'Encryption key for Voice Learning Assistant data',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // DynamoDB Tables with encryption and cost optimization
    this.createDynamoDBTables();

    // S3 Bucket for document storage with encryption
    this.createDocumentStorage();

    // Cognito User Pool for authentication (Requirement 9.3)
    this.createCognitoUserPool();

    // HTTP API Gateway with CORS and authentication (Requirement 11.2)
    this.createApiGateway();

    // Create Lambda functions for document processing
    this.createDocumentProcessingLambdas();
    
    // Create Lambda functions for AI response generation
    this.createAIResponseLambdas();

    // Create Lambda functions for session management
    this.createSessionManagementLambdas();

    // Create Lambda functions for security and compliance
    this.createSecurityLambdas();

    // Create API orchestrator Lambda
    this.createApiOrchestratorLambda();

    // Create conversation orchestrator Lambda
    this.createConversationOrchestratorLambda();

    // Create response quality optimizer Lambda
    this.createResponseQualityOptimizerLambda();

    // Output important values
    this.createOutputs();
  }

  /**
   * Create DynamoDB tables for user profiles, sessions, and progress tracking
   * Uses on-demand billing for cost optimization
   * Implements TTL for automatic data cleanup
   */
  private createDynamoDBTables(): void {
    // User Profiles Table
    this.userProfilesTable = new dynamodb.Table(this, 'UserProfilesTable', {
      tableName: 'voice-learning-user-profiles',
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // Cost optimization
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: this.encryptionKey,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Add GSI for email lookup
    this.userProfilesTable.addGlobalSecondaryIndex({
      indexName: 'EmailIndex',
      partitionKey: {
        name: 'email',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Sessions Table with TTL for automatic cleanup
    this.sessionsTable = new dynamodb.Table(this, 'SessionsTable', {
      tableName: 'voice-learning-sessions',
      partitionKey: {
        name: 'sessionId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.NUMBER,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: this.encryptionKey,
      timeToLiveAttribute: 'ttl', // Auto-delete old sessions (cost optimization)
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Sessions are temporary
    });

    // Add GSI for user session lookup
    this.sessionsTable.addGlobalSecondaryIndex({
      indexName: 'UserSessionIndex',
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.NUMBER,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Progress Tracking Table
    this.progressTable = new dynamodb.Table(this, 'ProgressTable', {
      tableName: 'voice-learning-progress',
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'topicId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: this.encryptionKey,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Add GSI for topic-based queries
    this.progressTable.addGlobalSecondaryIndex({
      indexName: 'TopicProgressIndex',
      partitionKey: {
        name: 'topicId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'lastUpdated',
        type: dynamodb.AttributeType.NUMBER,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Embeddings Table for vector storage
    this.embeddingsTable = new dynamodb.Table(this, 'EmbeddingsTable', {
      tableName: 'voice-learning-embeddings',
      partitionKey: {
        name: 'chunkId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: this.encryptionKey,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Add GSI for document-based queries
    this.embeddingsTable.addGlobalSecondaryIndex({
      indexName: 'DocumentIndex',
      partitionKey: {
        name: 'documentId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'position',
        type: dynamodb.AttributeType.NUMBER,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Add GSI for user-based queries
    this.embeddingsTable.addGlobalSecondaryIndex({
      indexName: 'UserIndex',
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'createdAt',
        type: dynamodb.AttributeType.NUMBER,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Rate Limits Table with TTL for automatic cleanup
    this.rateLimitsTable = new dynamodb.Table(this, 'RateLimitsTable', {
      tableName: 'voice-learning-rate-limits',
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'window',
        type: dynamodb.AttributeType.NUMBER,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl', // Auto-delete old rate limit records
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Rate limits are temporary
    });
  }

  /**
   * Create S3 bucket for document storage with encryption
   * Implements intelligent tiering for cost optimization
   * Requirement 9.1: Encryption at rest
   */
  private createDocumentStorage(): void {
    this.documentBucket = new s3.Bucket(this, 'DocumentBucket', {
      bucketName: `voice-learning-documents-${cdk.Aws.ACCOUNT_ID}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          // Move to Intelligent-Tiering after 0 days (immediate cost optimization)
          transitions: [
            {
              storageClass: s3.StorageClass.INTELLIGENT_TIERING,
              transitionAfter: cdk.Duration.days(0),
            },
          ],
        },
        {
          // Move old versions to Glacier after 90 days
          noncurrentVersionTransitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
          noncurrentVersionExpiration: cdk.Duration.days(365),
        },
      ],
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.DELETE,
          ],
          allowedOrigins: ['*'], // Configure with actual domain in production
          allowedHeaders: ['*'],
          exposedHeaders: ['ETag'],
          maxAge: 3000,
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Enable server access logging for security
    const logBucket = new s3.Bucket(this, 'DocumentBucketLogs', {
      bucketName: `voice-learning-documents-logs-${cdk.Aws.ACCOUNT_ID}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          expiration: cdk.Duration.days(90), // Delete logs after 90 days
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.documentBucket.enableServerAccessLogging(logBucket);
  }

  /**
   * Create Cognito User Pool for authentication
   * Requirement 9.3: Secure user authentication
   * Uses free tier (50K MAU)
   */
  private createCognitoUserPool(): void {
    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: 'voice-learning-users',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
        username: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        givenName: {
          required: true,
          mutable: true,
        },
        familyName: {
          required: false,
          mutable: true,
        },
        preferredUsername: {
          required: false,
          mutable: true,
        },
      },
      customAttributes: {
        preferredLanguage: new cognito.StringAttribute({ mutable: true }),
        skillLevel: new cognito.StringAttribute({ mutable: true }),
        subscriptionTier: new cognito.StringAttribute({ mutable: true }),
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create user pool client
    this.userPoolClient = this.userPool.addClient('UserPoolClient', {
      userPoolClientName: 'voice-learning-web-client',
      authFlows: {
        userPassword: true,
        userSrp: true,
        custom: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: true,
        },
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: ['http://localhost:3000/callback'], // Update with actual URLs
        logoutUrls: ['http://localhost:3000/logout'],
      },
      preventUserExistenceErrors: true,
      generateSecret: false, // For web/mobile clients
    });

    // Add domain for hosted UI
    this.userPool.addDomain('UserPoolDomain', {
      cognitoDomain: {
        domainPrefix: `voice-learning-${cdk.Aws.ACCOUNT_ID}`,
      },
    });
  }

  /**
   * Create HTTP API Gateway with CORS and authentication
   * Uses HTTP API (70% cheaper than REST API)
   * Requirement 11.2: Scalable API infrastructure
   */
  private createApiGateway(): void {
    // Create HTTP API (cost-optimized)
    this.httpApi = new apigateway.HttpApi(this, 'HttpApi', {
      apiName: 'voice-learning-api',
      description: 'Voice-First AI Learning Assistant API',
      corsPreflight: {
        allowOrigins: ['*'], // Configure with actual domain in production
        allowMethods: [
          apigateway.CorsHttpMethod.GET,
          apigateway.CorsHttpMethod.POST,
          apigateway.CorsHttpMethod.PUT,
          apigateway.CorsHttpMethod.DELETE,
          apigateway.CorsHttpMethod.OPTIONS,
        ],
        allowHeaders: [
          'Content-Type',
          'Authorization',
          'X-Amz-Date',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
        maxAge: cdk.Duration.days(1),
      },
    });

    // Create Cognito authorizer for HTTP API
    const authorizer = new apigateway.HttpUserPoolAuthorizer(
      'CognitoAuthorizer',
      this.userPool,
      {
        userPoolClients: [this.userPoolClient],
        identitySource: ['$request.header.Authorization'],
      }
    );

    // Store authorizer for use in Lambda integrations
    new cdk.CfnOutput(this, 'AuthorizerId', {
      value: authorizer.authorizerId,
      description: 'Cognito Authorizer ID for HTTP API',
    });
  }

  /**
   * Create Lambda functions for document processing
   * Requirements: 1.1 (document upload), 8.3 (progress tracking)
   */
  private createDocumentProcessingLambdas(): void {
    // Common Lambda environment variables
    const commonEnvironment = {
      DOCUMENT_BUCKET: this.documentBucket.bucketName,
      PROGRESS_TABLE: this.progressTable.tableName,
      EMBEDDINGS_TABLE: this.embeddingsTable.tableName,
      AWS_REGION: cdk.Aws.REGION,
    };

    // Upload Handler Lambda (ARM64 for 20% cost savings)
    this.uploadHandlerFunction = new lambdaNodejs.NodejsFunction(
      this,
      'UploadHandler',
      {
        functionName: 'voice-learning-upload-handler',
        runtime: lambda.Runtime.NODEJS_18_X,
        architecture: lambda.Architecture.ARM_64, // Cost optimization
        entry: path.join(__dirname, '../../lambda/document-processing/upload-handler/index.ts'),
        handler: 'handler',
        timeout: cdk.Duration.seconds(30),
        memorySize: 512,
        environment: commonEnvironment,
        bundling: {
          minify: true,
          sourceMap: false,
          target: 'es2020',
        },
      }
    );

    // Grant permissions to upload handler
    this.documentBucket.grantPut(this.uploadHandlerFunction);
    this.documentBucket.grantRead(this.uploadHandlerFunction);
    this.progressTable.grantWriteData(this.uploadHandlerFunction);
    this.encryptionKey.grantEncryptDecrypt(this.uploadHandlerFunction);

    // Upload Progress Lambda
    this.uploadProgressFunction = new lambdaNodejs.NodejsFunction(
      this,
      'UploadProgress',
      {
        functionName: 'voice-learning-upload-progress',
        runtime: lambda.Runtime.NODEJS_18_X,
        architecture: lambda.Architecture.ARM_64,
        entry: path.join(__dirname, '../../lambda/document-processing/upload-progress/index.ts'),
        handler: 'handler',
        timeout: cdk.Duration.seconds(10),
        memorySize: 256,
        environment: commonEnvironment,
        bundling: {
          minify: true,
          sourceMap: false,
          target: 'es2020',
        },
      }
    );

    // Grant permissions to progress handler
    this.progressTable.grantReadWriteData(this.uploadProgressFunction);

    // Text Extraction Lambda (triggered by S3 events)
    this.textExtractionFunction = new lambdaNodejs.NodejsFunction(
      this,
      'TextExtraction',
      {
        functionName: 'voice-learning-text-extraction',
        runtime: lambda.Runtime.NODEJS_18_X,
        architecture: lambda.Architecture.ARM_64,
        entry: path.join(__dirname, '../../lambda/document-processing/text-extraction/index.ts'),
        handler: 'handler',
        timeout: cdk.Duration.minutes(5), // Longer timeout for document processing
        memorySize: 1024, // More memory for document processing
        environment: commonEnvironment,
        bundling: {
          minify: true,
          sourceMap: false,
          target: 'es2020',
        },
      }
    );

    // Grant permissions to text extraction handler
    this.documentBucket.grantRead(this.textExtractionFunction);
    this.documentBucket.grantPut(this.textExtractionFunction);
    this.progressTable.grantReadWriteData(this.textExtractionFunction);
    this.encryptionKey.grantEncryptDecrypt(this.textExtractionFunction);
    
    // Grant Textract permissions
    this.textExtractionFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'textract:DetectDocumentText',
          'textract:AnalyzeDocument',
        ],
        resources: ['*'],
      })
    );

    // Add S3 event notification to trigger text extraction
    this.documentBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(this.textExtractionFunction),
      {
        suffix: '.pdf',
      }
    );
    
    this.documentBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(this.textExtractionFunction),
      {
        suffix: '.doc',
      }
    );
    
    this.documentBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(this.textExtractionFunction),
      {
        suffix: '.docx',
      }
    );
    
    this.documentBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(this.textExtractionFunction),
      {
        suffix: '.txt',
      }
    );
    
    this.documentBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(this.textExtractionFunction),
      {
        suffix: '.jpg',
      }
    );
    
    this.documentBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(this.textExtractionFunction),
      {
        suffix: '.jpeg',
      }
    );
    
    this.documentBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(this.textExtractionFunction),
      {
        suffix: '.png',
      }
    );

    // Content Chunking and Embedding Lambda (triggered by DynamoDB stream)
    this.contentChunkingFunction = new lambdaNodejs.NodejsFunction(
      this,
      'ContentChunking',
      {
        functionName: 'voice-learning-content-chunking',
        runtime: lambda.Runtime.NODEJS_18_X,
        architecture: lambda.Architecture.ARM_64,
        entry: path.join(__dirname, '../../lambda/document-processing/content-chunking/index.ts'),
        handler: 'handler',
        timeout: cdk.Duration.minutes(10), // Longer timeout for embedding generation
        memorySize: 2048, // More memory for embedding processing
        environment: commonEnvironment,
        bundling: {
          minify: true,
          sourceMap: false,
          target: 'es2020',
        },
      }
    );

    // Grant permissions to content chunking handler
    this.documentBucket.grantRead(this.contentChunkingFunction);
    this.documentBucket.grantPut(this.contentChunkingFunction);
    this.progressTable.grantReadWriteData(this.contentChunkingFunction);
    this.embeddingsTable.grantWriteData(this.contentChunkingFunction);
    this.encryptionKey.grantEncryptDecrypt(this.contentChunkingFunction);
    
    // Grant Bedrock permissions for embedding generation
    this.contentChunkingFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'bedrock:InvokeModel',
        ],
        resources: [
          `arn:aws:bedrock:${cdk.Aws.REGION}::foundation-model/amazon.titan-embed-text-v1`,
        ],
      })
    );

    // Add DynamoDB stream event source to trigger chunking
    this.contentChunkingFunction.addEventSource(
      new lambdaEventSources.DynamoEventSource(this.progressTable, {
        startingPosition: lambda.StartingPosition.LATEST,
        batchSize: 1,
        retryAttempts: 3,
        filters: [
          lambda.FilterCriteria.filter({
            eventName: lambda.FilterRule.isEqual('MODIFY'),
            dynamodb: {
              NewImage: {
                status: {
                  S: lambda.FilterRule.isEqual('extracted'),
                },
              },
            },
          }),
        ],
      })
    );

    // Create API routes
    this.createDocumentProcessingRoutes();
  }

  /**
   * Create Lambda functions for AI response generation
   * Requirements: 7.1, 7.2, 7.3 (content prioritization), 10.1-10.4 (adaptive modes)
   */
  private createAIResponseLambdas(): void {
    // Common Lambda environment variables
    const commonEnvironment = {
      EMBEDDINGS_TABLE: this.embeddingsTable.tableName,
      SESSIONS_TABLE: this.sessionsTable.tableName,
      USER_PROFILES_TABLE: this.userProfilesTable.tableName,
      AWS_REGION: cdk.Aws.REGION,
    };

    // Response Generator Lambda (ARM64 for cost optimization)
    this.responseGeneratorFunction = new lambdaNodejs.NodejsFunction(
      this,
      'ResponseGenerator',
      {
        functionName: 'voice-learning-response-generator',
        runtime: lambda.Runtime.NODEJS_18_X,
        architecture: lambda.Architecture.ARM_64,
        entry: path.join(__dirname, '../../lambda/ai-response/response-generator/index.ts'),
        handler: 'handler',
        timeout: cdk.Duration.seconds(30),
        memorySize: 1024,
        environment: commonEnvironment,
        bundling: {
          minify: true,
          sourceMap: false,
          target: 'es2020',
        },
      }
    );

    // Grant permissions to response generator
    this.embeddingsTable.grantReadData(this.responseGeneratorFunction);
    this.sessionsTable.grantReadWriteData(this.responseGeneratorFunction);
    this.encryptionKey.grantEncryptDecrypt(this.responseGeneratorFunction);

    // Grant Bedrock permissions for LLM and embeddings
    this.responseGeneratorFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['bedrock:InvokeModel'],
        resources: [
          `arn:aws:bedrock:${cdk.Aws.REGION}::foundation-model/anthropic.claude-3-haiku-20240307-v1:0`,
          `arn:aws:bedrock:${cdk.Aws.REGION}::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0`,
        ],
      })
    );

    // Mode Controller Lambda
    this.modeControllerFunction = new lambdaNodejs.NodejsFunction(
      this,
      'ModeController',
      {
        functionName: 'voice-learning-mode-controller',
        runtime: lambda.Runtime.NODEJS_18_X,
        architecture: lambda.Architecture.ARM_64,
        entry: path.join(__dirname, '../../lambda/ai-response/mode-controller/index.ts'),
        handler: 'handler',
        timeout: cdk.Duration.seconds(10),
        memorySize: 512,
        environment: commonEnvironment,
        bundling: {
          minify: true,
          sourceMap: false,
          target: 'es2020',
        },
      }
    );

    // Grant permissions to mode controller
    this.userProfilesTable.grantReadWriteData(this.modeControllerFunction);
    this.sessionsTable.grantReadWriteData(this.modeControllerFunction);
    this.encryptionKey.grantEncryptDecrypt(this.modeControllerFunction);

    // Semantic Search Lambda
    this.semanticSearchFunction = new lambdaNodejs.NodejsFunction(
      this,
      'SemanticSearch',
      {
        functionName: 'voice-learning-semantic-search',
        runtime: lambda.Runtime.NODEJS_18_X,
        architecture: lambda.Architecture.ARM_64,
        entry: path.join(__dirname, '../../lambda/ai-response/semantic-search/index.ts'),
        handler: 'handler',
        timeout: cdk.Duration.seconds(30),
        memorySize: 1024,
        environment: commonEnvironment,
        bundling: {
          minify: true,
          sourceMap: false,
          target: 'es2020',
        },
      }
    );

    // Grant permissions to semantic search
    this.embeddingsTable.grantReadData(this.semanticSearchFunction);
    this.encryptionKey.grantEncryptDecrypt(this.semanticSearchFunction);

    // Grant Bedrock permissions for embedding generation
    this.semanticSearchFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['bedrock:InvokeModel'],
        resources: [
          `arn:aws:bedrock:${cdk.Aws.REGION}::foundation-model/amazon.titan-embed-text-v1`,
        ],
      })
    );

    // Create API routes for AI response services
    this.createAIResponseRoutes();
  }

  /**
   * Create API Gateway routes for AI response services
   */
  private createAIResponseRoutes(): void {
    // Create Cognito authorizer
    const authorizer = new apigateway.HttpUserPoolAuthorizer(
      'AIResponseApiAuthorizer',
      this.userPool,
      {
        userPoolClients: [this.userPoolClient],
        identitySource: ['$request.header.Authorization'],
      }
    );

    // POST /ai/generate - Generate AI response
    this.httpApi.addRoutes({
      path: '/ai/generate',
      methods: [apigateway.HttpMethod.POST],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        'ResponseGeneratorIntegration',
        this.responseGeneratorFunction
      ),
      authorizer,
    });

    // POST /mode/switch - Switch interaction mode
    this.httpApi.addRoutes({
      path: '/mode/switch',
      methods: [apigateway.HttpMethod.POST],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        'ModeSwitchIntegration',
        this.modeControllerFunction
      ),
      authorizer,
    });

    // GET /mode/current - Get current mode
    this.httpApi.addRoutes({
      path: '/mode/current',
      methods: [apigateway.HttpMethod.GET],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        'ModeCurrentIntegration',
        this.modeControllerFunction
      ),
      authorizer,
    });

    // POST /mode/validate - Validate mode transition
    this.httpApi.addRoutes({
      path: '/mode/validate',
      methods: [apigateway.HttpMethod.POST],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        'ModeValidateIntegration',
        this.modeControllerFunction
      ),
      authorizer,
    });

    // POST /search/semantic - Perform semantic search
    this.httpApi.addRoutes({
      path: '/search/semantic',
      methods: [apigateway.HttpMethod.POST],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        'SemanticSearchIntegration',
        this.semanticSearchFunction
      ),
      authorizer,
    });
  }

  /**
   * Create API Gateway routes for document processing
   */
  private createDocumentProcessingRoutes(): void {
    // Create Cognito authorizer
    const authorizer = new apigateway.HttpUserPoolAuthorizer(
      'DocumentApiAuthorizer',
      this.userPool,
      {
        userPoolClients: [this.userPoolClient],
        identitySource: ['$request.header.Authorization'],
      }
    );

    // POST /documents/upload - Initiate document upload
    this.httpApi.addRoutes({
      path: '/documents/upload',
      methods: [apigateway.HttpMethod.POST],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        'UploadIntegration',
        this.uploadHandlerFunction
      ),
      authorizer,
    });

    // PUT /documents/progress - Update upload progress
    this.httpApi.addRoutes({
      path: '/documents/progress',
      methods: [apigateway.HttpMethod.PUT],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        'ProgressIntegration',
        this.uploadProgressFunction
      ),
      authorizer,
    });
  }

  /**
   * Create Lambda functions for session management
   * Requirements: 5.1 (session restoration), 5.4 (data persistence), 4.4 (context preservation)
   */
  private createSessionManagementLambdas(): void {
    // Common Lambda environment variables
    const commonEnvironment = {
      SESSIONS_TABLE: this.sessionsTable.tableName,
      USER_PROFILES_TABLE: this.userProfilesTable.tableName,
      AWS_REGION: cdk.Aws.REGION,
    };

    // Session Persistence Lambda (ARM64 for cost optimization)
    this.sessionPersistenceFunction = new lambdaNodejs.NodejsFunction(
      this,
      'SessionPersistence',
      {
        functionName: 'voice-learning-session-persistence',
        runtime: lambda.Runtime.NODEJS_18_X,
        architecture: lambda.Architecture.ARM_64,
        entry: path.join(__dirname, '../../lambda/session-management/session-persistence/index.ts'),
        handler: 'handler',
        timeout: cdk.Duration.seconds(10),
        memorySize: 512,
        environment: commonEnvironment,
        bundling: {
          minify: true,
          sourceMap: false,
          target: 'es2020',
        },
      }
    );

    // Grant permissions to session persistence
    this.sessionsTable.grantReadWriteData(this.sessionPersistenceFunction);
    this.userProfilesTable.grantReadData(this.sessionPersistenceFunction);
    this.encryptionKey.grantEncryptDecrypt(this.sessionPersistenceFunction);

    // Context Manager Lambda
    this.contextManagerFunction = new lambdaNodejs.NodejsFunction(
      this,
      'ContextManager',
      {
        functionName: 'voice-learning-context-manager',
        runtime: lambda.Runtime.NODEJS_18_X,
        architecture: lambda.Architecture.ARM_64,
        entry: path.join(__dirname, '../../lambda/session-management/context-manager/index.ts'),
        handler: 'handler',
        timeout: cdk.Duration.seconds(10),
        memorySize: 512,
        environment: commonEnvironment,
        bundling: {
          minify: true,
          sourceMap: false,
          target: 'es2020',
        },
      }
    );

    // Grant permissions to context manager
    this.sessionsTable.grantReadWriteData(this.contextManagerFunction);
    this.encryptionKey.grantEncryptDecrypt(this.contextManagerFunction);

    // Create API routes for session management
    this.createSessionManagementRoutes();
  }

  /**
   * Create API Gateway routes for session management
   */
  private createSessionManagementRoutes(): void {
    // Create Cognito authorizer
    const authorizer = new apigateway.HttpUserPoolAuthorizer(
      'SessionManagementApiAuthorizer',
      this.userPool,
      {
        userPoolClients: [this.userPoolClient],
        identitySource: ['$request.header.Authorization'],
      }
    );

    // POST /sessions - Session persistence operations
    this.httpApi.addRoutes({
      path: '/sessions',
      methods: [apigateway.HttpMethod.POST],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        'SessionPersistenceIntegration',
        this.sessionPersistenceFunction
      ),
      authorizer,
    });

    // POST /context - Context management operations
    this.httpApi.addRoutes({
      path: '/context',
      methods: [apigateway.HttpMethod.POST],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        'ContextManagerIntegration',
        this.contextManagerFunction
      ),
      authorizer,
    });
  }

  /**
   * Create Lambda functions for security and compliance
   * Requirements: 9.1 (encryption), 9.2 (data protection), 9.3 (authentication), 9.4 (secure deletion), 9.5 (data sharing)
   */
  private createSecurityLambdas(): void {
    // Common Lambda environment variables
    const commonEnvironment = {
      DOCUMENT_BUCKET: this.documentBucket.bucketName,
      USER_PROFILES_TABLE: this.userProfilesTable.tableName,
      SESSIONS_TABLE: this.sessionsTable.tableName,
      PROGRESS_TABLE: this.progressTable.tableName,
      EMBEDDINGS_TABLE: this.embeddingsTable.tableName,
      ENCRYPTION_KEY_ID: this.encryptionKey.keyId,
      USER_POOL_ID: this.userPool.userPoolId,
      PERMISSIONS_TABLE: this.userProfilesTable.tableName,
      AWS_REGION: cdk.Aws.REGION,
    };

    // Data Protection Lambda (ARM64 for cost optimization)
    this.dataProtectionFunction = new lambdaNodejs.NodejsFunction(
      this,
      'DataProtection',
      {
        functionName: 'voice-learning-data-protection',
        runtime: lambda.Runtime.NODEJS_18_X,
        architecture: lambda.Architecture.ARM_64,
        entry: path.join(__dirname, '../../lambda/security/data-protection/index.ts'),
        handler: 'handler',
        timeout: cdk.Duration.minutes(5), // Longer timeout for bulk operations
        memorySize: 1024,
        environment: commonEnvironment,
        bundling: {
          minify: true,
          sourceMap: false,
          target: 'es2020',
        },
      }
    );

    // Grant comprehensive permissions to data protection function
    this.documentBucket.grantReadWrite(this.dataProtectionFunction);
    this.documentBucket.grantDelete(this.dataProtectionFunction);
    this.userProfilesTable.grantReadWriteData(this.dataProtectionFunction);
    this.sessionsTable.grantReadWriteData(this.dataProtectionFunction);
    this.progressTable.grantReadWriteData(this.dataProtectionFunction);
    this.embeddingsTable.grantReadWriteData(this.dataProtectionFunction);
    this.encryptionKey.grantEncryptDecrypt(this.dataProtectionFunction);

    // Grant KMS permissions for encryption/decryption
    this.dataProtectionFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'kms:Encrypt',
          'kms:Decrypt',
          'kms:GenerateDataKey',
          'kms:DescribeKey',
        ],
        resources: [this.encryptionKey.keyArn],
      })
    );

    // Auth Manager Lambda
    this.authManagerFunction = new lambdaNodejs.NodejsFunction(
      this,
      'AuthManager',
      {
        functionName: 'voice-learning-auth-manager',
        runtime: lambda.Runtime.NODEJS_18_X,
        architecture: lambda.Architecture.ARM_64,
        entry: path.join(__dirname, '../../lambda/security/auth-manager/index.ts'),
        handler: 'handler',
        timeout: cdk.Duration.seconds(30),
        memorySize: 512,
        environment: commonEnvironment,
        bundling: {
          minify: true,
          sourceMap: false,
          target: 'es2020',
        },
      }
    );

    // Grant permissions to auth manager
    this.userProfilesTable.grantReadWriteData(this.authManagerFunction);
    this.encryptionKey.grantEncryptDecrypt(this.authManagerFunction);

    // Grant Cognito permissions for user management
    this.authManagerFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cognito-idp:AdminGetUser',
          'cognito-idp:AdminUpdateUserAttributes',
          'cognito-idp:AdminAddUserToGroup',
          'cognito-idp:AdminRemoveUserFromGroup',
          'cognito-idp:ListUsersInGroup',
          'cognito-idp:CreateGroup',
          'cognito-idp:GetGroup',
          'cognito-idp:AdminListGroupsForUser',
        ],
        resources: [this.userPool.userPoolArn],
      })
    );

    // Create API routes for security services
    this.createSecurityRoutes();
  }

  /**
   * Create API Gateway routes for security services
   */
  private createSecurityRoutes(): void {
    // Create Cognito authorizer
    const authorizer = new apigateway.HttpUserPoolAuthorizer(
      'SecurityApiAuthorizer',
      this.userPool,
      {
        userPoolClients: [this.userPoolClient],
        identitySource: ['$request.header.Authorization'],
      }
    );

    // POST /security/data-protection - Data protection operations
    this.httpApi.addRoutes({
      path: '/security/data-protection',
      methods: [apigateway.HttpMethod.POST],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        'DataProtectionIntegration',
        this.dataProtectionFunction
      ),
      authorizer,
    });

    // POST /security/auth - Authentication and authorization operations
    this.httpApi.addRoutes({
      path: '/security/auth',
      methods: [apigateway.HttpMethod.POST],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        'AuthManagerIntegration',
        this.authManagerFunction
      ),
      authorizer,
    });

    // GET /security/auth - Get user roles and permissions
    this.httpApi.addRoutes({
      path: '/security/auth',
      methods: [apigateway.HttpMethod.GET],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        'AuthManagerGetIntegration',
        this.authManagerFunction
      ),
      authorizer,
    });
  }

  /**
   * Create API Orchestrator Lambda function
   * Requirements: 11.1 (unified API endpoints), 11.2 (request routing and validation)
   */
  private createApiOrchestratorLambda(): void {
    // Common Lambda environment variables
    const commonEnvironment = {
      RATE_LIMIT_TABLE: this.rateLimitsTable.tableName,
      USER_PROFILES_TABLE: this.userProfilesTable.tableName,
      AWS_REGION: cdk.Aws.REGION,
    };

    // API Orchestrator Lambda (ARM64 for cost optimization)
    this.apiOrchestratorFunction = new lambdaNodejs.NodejsFunction(
      this,
      'ApiOrchestrator',
      {
        functionName: 'voice-learning-api-orchestrator',
        runtime: lambda.Runtime.NODEJS_18_X,
        architecture: lambda.Architecture.ARM_64,
        entry: path.join(__dirname, '../../lambda/api-orchestrator/index.ts'),
        handler: 'handler',
        timeout: cdk.Duration.seconds(30),
        memorySize: 512,
        environment: commonEnvironment,
        bundling: {
          minify: true,
          sourceMap: false,
          target: 'es2020',
        },
      }
    );

    // Grant permissions to API orchestrator
    this.rateLimitsTable.grantReadWriteData(this.apiOrchestratorFunction);
    this.userProfilesTable.grantReadData(this.apiOrchestratorFunction);

    // Create API routes for orchestrator
    this.createApiOrchestratorRoutes();
  }

  /**
   * Create API Gateway routes for API orchestrator
   */
  private createApiOrchestratorRoutes(): void {
    // Create Cognito authorizer
    const authorizer = new apigateway.HttpUserPoolAuthorizer(
      'ApiOrchestratorAuthorizer',
      this.userPool,
      {
        userPoolClients: [this.userPoolClient],
        identitySource: ['$request.header.Authorization'],
      }
    );

    // Catch-all route for API orchestration
    // This will handle all requests and route them appropriately
    this.httpApi.addRoutes({
      path: '/api/{proxy+}',
      methods: [
        apigateway.HttpMethod.GET,
        apigateway.HttpMethod.POST,
        apigateway.HttpMethod.PUT,
        apigateway.HttpMethod.DELETE,
      ],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        'ApiOrchestratorIntegration',
        this.apiOrchestratorFunction
      ),
      authorizer,
    });
  }

  /**
   * Create Conversation Orchestrator Lambda function
   * Requirements: 3.4 (confirmation waiting mechanisms)
   */
  private createConversationOrchestratorLambda(): void {
    // Common Lambda environment variables
    const commonEnvironment = {
      SESSIONS_TABLE: this.sessionsTable.tableName,
      PROGRESS_TABLE: this.progressTable.tableName,
      RESPONSE_GENERATOR_FUNCTION: this.responseGeneratorFunction.functionName,
      MODE_CONTROLLER_FUNCTION: this.modeControllerFunction.functionName,
      AWS_REGION: cdk.Aws.REGION,
    };

    // Conversation Orchestrator Lambda (ARM64 for cost optimization)
    this.conversationOrchestratorFunction = new lambdaNodejs.NodejsFunction(
      this,
      'ConversationOrchestrator',
      {
        functionName: 'voice-learning-conversation-orchestrator',
        runtime: lambda.Runtime.NODEJS_18_X,
        architecture: lambda.Architecture.ARM_64,
        entry: path.join(__dirname, '../../lambda/conversation-orchestrator/index.ts'),
        handler: 'handler',
        timeout: cdk.Duration.seconds(30),
        memorySize: 512,
        environment: commonEnvironment,
        bundling: {
          minify: true,
          sourceMap: false,
          target: 'es2020',
        },
      }
    );

    // Grant permissions to conversation orchestrator
    this.sessionsTable.grantReadWriteData(this.conversationOrchestratorFunction);
    this.progressTable.grantReadWriteData(this.conversationOrchestratorFunction);
    this.encryptionKey.grantEncryptDecrypt(this.conversationOrchestratorFunction);

    // Grant permission to invoke other Lambda functions
    this.responseGeneratorFunction.grantInvoke(this.conversationOrchestratorFunction);
    this.modeControllerFunction.grantInvoke(this.conversationOrchestratorFunction);

    // Create API routes for conversation orchestrator
    this.createConversationOrchestratorRoutes();
  }

  /**
   * Create API Gateway routes for conversation orchestrator
   */
  private createConversationOrchestratorRoutes(): void {
    // Create Cognito authorizer
    const authorizer = new apigateway.HttpUserPoolAuthorizer(
      'ConversationOrchestratorAuthorizer',
      this.userPool,
      {
        userPoolClients: [this.userPoolClient],
        identitySource: ['$request.header.Authorization'],
      }
    );

    // POST /conversation - Main conversation endpoint
    this.httpApi.addRoutes({
      path: '/conversation',
      methods: [apigateway.HttpMethod.POST],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        'ConversationOrchestratorIntegration',
        this.conversationOrchestratorFunction
      ),
      authorizer,
    });

    // GET /conversation/state - Get conversation state
    this.httpApi.addRoutes({
      path: '/conversation/state',
      methods: [apigateway.HttpMethod.GET],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        'ConversationStateIntegration',
        this.conversationOrchestratorFunction
      ),
      authorizer,
    });
  }

  /**
   * Create Response Quality Optimizer Lambda function
   * Requirements: 3.1, 3.2, 3.3, 3.5 (beginner-friendly responses with examples)
   */
  private createResponseQualityOptimizerLambda(): void {
    // Response Quality Optimizer Lambda (ARM64 for cost optimization)
    this.responseQualityOptimizerFunction = new lambdaNodejs.NodejsFunction(
      this,
      'ResponseQualityOptimizer',
      {
        functionName: 'voice-learning-response-quality-optimizer',
        runtime: lambda.Runtime.NODEJS_18_X,
        architecture: lambda.Architecture.ARM_64,
        entry: path.join(__dirname, '../../lambda/response-quality-optimizer/index.ts'),
        handler: 'handler',
        timeout: cdk.Duration.seconds(30),
        memorySize: 512,
        environment: {
          AWS_REGION: cdk.Aws.REGION,
        },
        bundling: {
          minify: true,
          sourceMap: false,
          target: 'es2020',
        },
      }
    );

    // Create API routes for response quality optimizer
    this.createResponseQualityOptimizerRoutes();
  }

  /**
   * Create API Gateway routes for response quality optimizer
   */
  private createResponseQualityOptimizerRoutes(): void {
    // Create Cognito authorizer
    const authorizer = new apigateway.HttpUserPoolAuthorizer(
      'ResponseQualityOptimizerAuthorizer',
      this.userPool,
      {
        userPoolClients: [this.userPoolClient],
        identitySource: ['$request.header.Authorization'],
      }
    );

    // POST /optimize/response - Optimize response quality
    this.httpApi.addRoutes({
      path: '/optimize/response',
      methods: [apigateway.HttpMethod.POST],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        'ResponseQualityOptimizerIntegration',
        this.responseQualityOptimizerFunction
      ),
      authorizer,
    });
  }

  /**
   * Create CloudFormation outputs for easy reference
   */
  private createOutputs(): void {
    new cdk.CfnOutput(this, 'UserProfilesTableName', {
      value: this.userProfilesTable.tableName,
      description: 'DynamoDB table for user profiles',
    });

    new cdk.CfnOutput(this, 'SessionsTableName', {
      value: this.sessionsTable.tableName,
      description: 'DynamoDB table for sessions',
    });

    new cdk.CfnOutput(this, 'ProgressTableName', {
      value: this.progressTable.tableName,
      description: 'DynamoDB table for progress tracking',
    });

    new cdk.CfnOutput(this, 'EmbeddingsTableName', {
      value: this.embeddingsTable.tableName,
      description: 'DynamoDB table for embeddings storage',
    });

    new cdk.CfnOutput(this, 'RateLimitsTableName', {
      value: this.rateLimitsTable.tableName,
      description: 'DynamoDB table for rate limiting',
    });

    new cdk.CfnOutput(this, 'DocumentBucketName', {
      value: this.documentBucket.bucketName,
      description: 'S3 bucket for document storage',
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });

    new cdk.CfnOutput(this, 'HttpApiUrl', {
      value: this.httpApi.url || '',
      description: 'HTTP API Gateway URL',
    });

    new cdk.CfnOutput(this, 'HttpApiId', {
      value: this.httpApi.httpApiId,
      description: 'HTTP API Gateway ID',
    });

    new cdk.CfnOutput(this, 'EncryptionKeyId', {
      value: this.encryptionKey.keyId,
      description: 'KMS encryption key ID',
    });

    new cdk.CfnOutput(this, 'Region', {
      value: cdk.Aws.REGION,
      description: 'AWS Region',
    });
  }
}
