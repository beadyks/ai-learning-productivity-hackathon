#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MinimalVoiceLearningStack } from './stacks/minimal-stack';

const app = new cdk.App();

new MinimalVoiceLearningStack(app, 'VoiceLearningMinimalStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'ap-south-1',
  },
  description: 'Minimal Voice-First AI Learning Assistant Infrastructure',
});

app.synth();
