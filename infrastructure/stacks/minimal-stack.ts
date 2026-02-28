import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayIntegrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';

/**
 * Minimal infrastructure stack for Voice-First AI Learning Assistant
 * This is a simplified version for quick deployment without Docker
 */
export class MinimalVoiceLearningStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create DynamoDB table for user profiles
    const userProfilesTable = new dynamodb.Table(this, 'UserProfiles', {
      tableName: 'voice-learning-user-profiles',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create DynamoDB table for sessions
    const sessionsTable = new dynamodb.Table(this, 'Sessions', {
      tableName: 'voice-learning-sessions',
      partitionKey: { name: 'sessionId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create S3 bucket for document storage
    const documentBucket = new s3.Bucket(this, 'DocumentBucket', {
      bucketName: `voice-learning-documents-${cdk.Aws.ACCOUNT_ID}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create Cognito User Pool
    const userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: 'voice-learning-users',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
        username: true,
      },
      autoVerify: {
        email: true,
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

    // Create User Pool Client
    const userPoolClient = userPool.addClient('WebClient', {
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [cognito.OAuthScope.OPENID, cognito.OAuthScope.EMAIL, cognito.OAuthScope.PROFILE],
      },
    });

    // Create HTTP API Gateway
    const httpApi = new apigateway.HttpApi(this, 'HttpApi', {
      apiName: 'voice-learning-api',
      description: 'Voice-First AI Learning Assistant API',
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [
          apigateway.CorsHttpMethod.GET,
          apigateway.CorsHttpMethod.POST,
          apigateway.CorsHttpMethod.PUT,
          apigateway.CorsHttpMethod.DELETE,
        ],
        allowHeaders: ['*'],
        maxAge: cdk.Duration.days(1),
      },
    });

    // Create Lambda execution role
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant permissions to Lambda role
    userProfilesTable.grantReadWriteData(lambdaRole);
    sessionsTable.grantReadWriteData(lambdaRole);
    documentBucket.grantReadWrite(lambdaRole);

    // Create Health Check Lambda
    const healthCheckFunction = new lambda.Function(this, 'HealthCheckFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      role: lambdaRole,
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
              status: 'healthy',
              message: 'Voice-First AI Learning Assistant API is running',
              timestamp: new Date().toISOString(),
              version: '1.0.0'
            })
          };
        };
      `),
      timeout: cdk.Duration.seconds(10),
    });

    // Create User Profile Lambda
    const userProfileFunction = new lambda.Function(this, 'UserProfileFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      role: lambdaRole,
      environment: {
        USER_PROFILES_TABLE: userProfilesTable.tableName,
      },
      code: lambda.Code.fromInline(`
        const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
        const { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
        
        const client = new DynamoDBClient({});
        const docClient = DynamoDBDocumentClient.from(client);
        
        exports.handler = async (event) => {
          const tableName = process.env.USER_PROFILES_TABLE;
          
          try {
            const method = event.requestContext.http.method;
            const path = event.requestContext.http.path;
            
            if (method === 'GET' && path.includes('/profile/')) {
              const userId = path.split('/').pop();
              const result = await docClient.send(new GetCommand({
                TableName: tableName,
                Key: { userId }
              }));
              
              return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify(result.Item || { message: 'Profile not found' })
              };
            }
            
            if (method === 'POST' && path.includes('/profile')) {
              const body = JSON.parse(event.body || '{}');
              const profile = {
                userId: body.userId || \`user-\${Date.now()}\`,
                name: body.name,
                email: body.email,
                createdAt: new Date().toISOString(),
                preferences: body.preferences || {}
              };
              
              await docClient.send(new PutCommand({
                TableName: tableName,
                Item: profile
              }));
              
              return {
                statusCode: 201,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify(profile)
              };
            }
            
            return {
              statusCode: 400,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
              body: JSON.stringify({ error: 'Invalid request' })
            };
          } catch (error) {
            console.error('Error:', error);
            return {
              statusCode: 500,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
              body: JSON.stringify({ error: error.message })
            };
          }
        };
      `),
      timeout: cdk.Duration.seconds(30),
    });

    // Create Session Management Lambda
    const sessionFunction = new lambda.Function(this, 'SessionFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      role: lambdaRole,
      environment: {
        SESSIONS_TABLE: sessionsTable.tableName,
      },
      code: lambda.Code.fromInline(`
        const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
        const { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
        
        const client = new DynamoDBClient({});
        const docClient = DynamoDBDocumentClient.from(client);
        
        exports.handler = async (event) => {
          const tableName = process.env.SESSIONS_TABLE;
          
          try {
            const method = event.requestContext.http.method;
            const path = event.requestContext.http.path;
            
            if (method === 'POST' && path.includes('/session')) {
              const body = JSON.parse(event.body || '{}');
              const session = {
                sessionId: \`session-\${Date.now()}\`,
                timestamp: Date.now(),
                userId: body.userId,
                mode: body.mode || 'tutor',
                context: body.context || {},
                createdAt: new Date().toISOString()
              };
              
              await docClient.send(new PutCommand({
                TableName: tableName,
                Item: session
              }));
              
              return {
                statusCode: 201,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify(session)
              };
            }
            
            if (method === 'GET' && path.includes('/sessions/')) {
              const userId = path.split('/').pop();
              const result = await docClient.send(new QueryCommand({
                TableName: tableName,
                KeyConditionExpression: 'sessionId = :sessionId',
                ExpressionAttributeValues: {
                  ':sessionId': userId
                },
                Limit: 10
              }));
              
              return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ sessions: result.Items || [] })
              };
            }
            
            return {
              statusCode: 400,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
              body: JSON.stringify({ error: 'Invalid request' })
            };
          } catch (error) {
            console.error('Error:', error);
            return {
              statusCode: 500,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
              body: JSON.stringify({ error: error.message })
            };
          }
        };
      `),
      timeout: cdk.Duration.seconds(30),
    });

    // Create Document Upload Lambda
    const documentUploadFunction = new lambda.Function(this, 'DocumentUploadFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      role: lambdaRole,
      environment: {
        DOCUMENT_BUCKET: documentBucket.bucketName,
      },
      code: lambda.Code.fromInline(`
        const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
        const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
        
        const s3Client = new S3Client({});
        
        exports.handler = async (event) => {
          const bucketName = process.env.DOCUMENT_BUCKET;
          
          try {
            const method = event.requestContext.http.method;
            const body = JSON.parse(event.body || '{}');
            
            if (method === 'POST' && event.requestContext.http.path.includes('/upload-url')) {
              const fileName = body.fileName || \`document-\${Date.now()}.pdf\`;
              const userId = body.userId || 'anonymous';
              const key = \`\${userId}/\${fileName}\`;
              
              const command = new PutObjectCommand({
                Bucket: bucketName,
                Key: key,
                ContentType: body.contentType || 'application/pdf'
              });
              
              const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
              
              return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({
                  uploadUrl,
                  key,
                  bucket: bucketName,
                  expiresIn: 3600
                })
              };
            }
            
            return {
              statusCode: 400,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
              body: JSON.stringify({ error: 'Invalid request' })
            };
          } catch (error) {
            console.error('Error:', error);
            return {
              statusCode: 500,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
              body: JSON.stringify({ error: error.message })
            };
          }
        };
      `),
      timeout: cdk.Duration.seconds(30),
    });

    // Add API Routes
    httpApi.addRoutes({
      path: '/health',
      methods: [apigateway.HttpMethod.GET],
      integration: new apigatewayIntegrations.HttpLambdaIntegration('HealthCheckIntegration', healthCheckFunction),
    });

    httpApi.addRoutes({
      path: '/profile',
      methods: [apigateway.HttpMethod.POST],
      integration: new apigatewayIntegrations.HttpLambdaIntegration('CreateProfileIntegration', userProfileFunction),
    });

    httpApi.addRoutes({
      path: '/profile/{userId}',
      methods: [apigateway.HttpMethod.GET],
      integration: new apigatewayIntegrations.HttpLambdaIntegration('GetProfileIntegration', userProfileFunction),
    });

    httpApi.addRoutes({
      path: '/session',
      methods: [apigateway.HttpMethod.POST],
      integration: new apigatewayIntegrations.HttpLambdaIntegration('CreateSessionIntegration', sessionFunction),
    });

    httpApi.addRoutes({
      path: '/sessions/{userId}',
      methods: [apigateway.HttpMethod.GET],
      integration: new apigatewayIntegrations.HttpLambdaIntegration('GetSessionsIntegration', sessionFunction),
    });

    httpApi.addRoutes({
      path: '/upload-url',
      methods: [apigateway.HttpMethod.POST],
      integration: new apigatewayIntegrations.HttpLambdaIntegration('UploadUrlIntegration', documentUploadFunction),
    });

    // Outputs
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });

    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: httpApi.apiEndpoint,
      description: 'HTTP API Gateway Endpoint',
    });

    new cdk.CfnOutput(this, 'DocumentBucketName', {
      value: documentBucket.bucketName,
      description: 'S3 Document Bucket Name',
    });

    new cdk.CfnOutput(this, 'UserProfilesTableName', {
      value: userProfilesTable.tableName,
      description: 'DynamoDB User Profiles Table',
    });

    new cdk.CfnOutput(this, 'SessionsTableName', {
      value: sessionsTable.tableName,
      description: 'DynamoDB Sessions Table',
    });
  }
}
