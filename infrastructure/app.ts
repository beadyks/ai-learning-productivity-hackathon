#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { VoiceLearningAssistantStack } from './stacks/voice-learning-assistant-stack';

const app = new cdk.App();

new VoiceLearningAssistantStack(app, 'VoiceLearningAssistantStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'Voice-First AI Learning & Developer Productivity Assistant Infrastructure',
});

app.synth();
