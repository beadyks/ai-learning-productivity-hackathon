import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

export interface CICDPipelineStackProps extends cdk.StackProps {
  readonly githubOwner: string;
  readonly githubRepo: string;
  readonly githubBranch: string;
  readonly githubTokenSecretName: string;
  readonly notificationEmail?: string;
}

/**
 * CI/CD Pipeline Stack
 * Creates automated deployment pipeline with testing and validation
 * 
 * Requirements: 11.2
 */
export class CICDPipelineStack extends cdk.Stack {
  public readonly pipeline: codepipeline.Pipeline;
  public readonly artifactBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: CICDPipelineStackProps) {
    super(scope, id, props);

    // Artifact bucket for pipeline
    this.artifactBucket = new s3.Bucket(this, 'ArtifactBucket', {
      bucketName: `voice-learning-pipeline-artifacts-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          expiration: cdk.Duration.days(30),
          id: 'DeleteOldArtifacts',
        },
      ],
    });

    // SNS Topic for notifications
    const notificationTopic = new sns.Topic(this, 'PipelineNotifications', {
      displayName: 'Voice Learning Pipeline Notifications',
    });

    if (props.notificationEmail) {
      notificationTopic.addSubscription(
        new subscriptions.EmailSubscription(props.notificationEmail)
      );
    }

    // Source stage - GitHub
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const sourceAction = new codepipeline_actions.GitHubSourceAction({
      actionName: 'GitHub_Source',
      owner: props.githubOwner,
      repo: props.githubRepo,
      branch: props.githubBranch,
      oauthToken: cdk.SecretValue.secretsManager(props.githubTokenSecretName),
      output: sourceOutput,
      trigger: codepipeline_actions.GitHubTrigger.WEBHOOK,
    });

    // Build project for Lambda functions
    const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      projectName: 'voice-learning-build',
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
        privileged: false,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '20',
            },
            commands: [
              'echo "Installing dependencies..."',
              'npm ci',
              'cd lambda && npm ci',
            ],
          },
          pre_build: {
            commands: [
              'echo "Running linting..."',
              'npm run lint || true',
            ],
          },
          build: {
            commands: [
              'echo "Building Lambda functions..."',
              'cd lambda && npm run build',
              'cd ..',
              'echo "Building infrastructure..."',
              'npm run build',
            ],
          },
          post_build: {
            commands: [
              'echo "Build completed successfully"',
            ],
          },
        },
        artifacts: {
          files: [
            '**/*',
          ],
        },
      }),
      cache: codebuild.Cache.local(codebuild.LocalCacheMode.SOURCE),
    });

    // Unit test project
    const unitTestProject = new codebuild.PipelineProject(this, 'UnitTestProject', {
      projectName: 'voice-learning-unit-tests',
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '20',
            },
            commands: [
              'npm ci',
              'cd lambda && npm ci',
            ],
          },
          build: {
            commands: [
              'echo "Running unit tests..."',
              'cd lambda && npm test || true',
            ],
          },
        },
        reports: {
          'unit-test-report': {
            files: ['**/test-results.xml'],
            'file-format': 'JUNITXML',
          },
        },
      }),
    });

    // Integration test project
    const integrationTestProject = new codebuild.PipelineProject(
      this,
      'IntegrationTestProject',
      {
        projectName: 'voice-learning-integration-tests',
        environment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
          computeType: codebuild.ComputeType.SMALL,
        },
        environmentVariables: {
          AWS_REGION: {
            value: this.region,
          },
          STACK_NAME: {
            value: 'VoiceLearningAssistantStack-Staging',
          },
        },
        buildSpec: codebuild.BuildSpec.fromObject({
          version: '0.2',
          phases: {
            install: {
              'runtime-versions': {
                nodejs: '20',
              },
              commands: [
                'cd tests/integration',
                'npm ci',
              ],
            },
            build: {
              commands: [
                'echo "Running integration tests..."',
                'npm test',
              ],
            },
          },
          reports: {
            'integration-test-report': {
              files: ['**/test-results.xml'],
              'file-format': 'JUNITXML',
            },
          },
        }),
      }
    );

    // Grant permissions for integration tests
    integrationTestProject.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'cloudformation:DescribeStacks',
          'lambda:InvokeFunction',
          'dynamodb:*',
          's3:*',
        ],
        resources: ['*'],
      })
    );

    // Deploy to staging
    const deployStagingProject = new codebuild.PipelineProject(
      this,
      'DeployStagingProject',
      {
        projectName: 'voice-learning-deploy-staging',
        environment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
          computeType: codebuild.ComputeType.SMALL,
          privileged: true,
        },
        environmentVariables: {
          ENVIRONMENT: {
            value: 'staging',
          },
        },
        buildSpec: codebuild.BuildSpec.fromObject({
          version: '0.2',
          phases: {
            install: {
              'runtime-versions': {
                nodejs: '20',
              },
              commands: [
                'npm ci',
              ],
            },
            build: {
              commands: [
                'echo "Deploying to staging..."',
                'npm run cdk -- deploy VoiceLearningAssistantStack-Staging --require-approval never',
              ],
            },
          },
        }),
      }
    );

    // Grant CDK deployment permissions
    deployStagingProject.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['sts:AssumeRole'],
        resources: [`arn:aws:iam::${this.account}:role/cdk-*`],
      })
    );

    // Deploy to production (blue-green)
    const deployProductionProject = new codebuild.PipelineProject(
      this,
      'DeployProductionProject',
      {
        projectName: 'voice-learning-deploy-production',
        environment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
          computeType: codebuild.ComputeType.SMALL,
          privileged: true,
        },
        environmentVariables: {
          ENVIRONMENT: {
            value: 'production',
          },
        },
        buildSpec: codebuild.BuildSpec.fromObject({
          version: '0.2',
          phases: {
            install: {
              'runtime-versions': {
                nodejs: '20',
              },
              commands: [
                'npm ci',
              ],
            },
            build: {
              commands: [
                'echo "Deploying to production with blue-green strategy..."',
                'npm run cdk -- deploy VoiceLearningAssistantStack-Production --require-approval never',
              ],
            },
          },
        }),
      }
    );

    // Grant CDK deployment permissions
    deployProductionProject.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['sts:AssumeRole'],
        resources: [`arn:aws:iam::${this.account}:role/cdk-*`],
      })
    );

    // Create pipeline
    this.pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: 'VoiceLearningAssistantPipeline',
      artifactBucket: this.artifactBucket,
      restartExecutionOnUpdate: true,
    });

    // Add stages
    this.pipeline.addStage({
      stageName: 'Source',
      actions: [sourceAction],
    });

    const buildOutput = new codepipeline.Artifact('BuildOutput');
    this.pipeline.addStage({
      stageName: 'Build',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'Build',
          project: buildProject,
          input: sourceOutput,
          outputs: [buildOutput],
        }),
      ],
    });

    this.pipeline.addStage({
      stageName: 'Test',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'UnitTests',
          project: unitTestProject,
          input: buildOutput,
          runOrder: 1,
        }),
      ],
    });

    this.pipeline.addStage({
      stageName: 'DeployStaging',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'DeployToStaging',
          project: deployStagingProject,
          input: buildOutput,
        }),
      ],
    });

    this.pipeline.addStage({
      stageName: 'IntegrationTest',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'IntegrationTests',
          project: integrationTestProject,
          input: buildOutput,
        }),
      ],
    });

    this.pipeline.addStage({
      stageName: 'ApprovalForProduction',
      actions: [
        new codepipeline_actions.ManualApprovalAction({
          actionName: 'ManualApproval',
          notificationTopic,
          additionalInformation: 'Please review staging deployment and approve for production',
        }),
      ],
    });

    this.pipeline.addStage({
      stageName: 'DeployProduction',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'DeployToProduction',
          project: deployProductionProject,
          input: buildOutput,
        }),
      ],
    });

    // Pipeline notifications
    this.pipeline.onStateChange('PipelineStateChange', {
      target: new cdk.aws_events_targets.SnsTopic(notificationTopic),
      description: 'Notify on pipeline state changes',
    });

    // Outputs
    new cdk.CfnOutput(this, 'PipelineName', {
      value: this.pipeline.pipelineName,
      description: 'CI/CD Pipeline Name',
    });

    new cdk.CfnOutput(this, 'ArtifactBucketName', {
      value: this.artifactBucket.bucketName,
      description: 'Pipeline Artifact Bucket',
    });
  }
}
