/**
 * Auth Manager - Environment-aware authentication
 * Uses mock auth in development, real Cognito in production
 */

import type { AuthManager } from '../types/auth.types';
import { mockAuthManager } from './mockAuthService';
import { CognitoAuthManager } from './authService';

const isDevelopment = import.meta.env.VITE_DEV_MODE === 'true';

console.log(`🔐 Auth Mode: ${isDevelopment ? 'DEVELOPMENT (Mock API)' : 'PRODUCTION (AWS Cognito)'}`);

export const authManager: AuthManager = isDevelopment 
  ? mockAuthManager
  : new CognitoAuthManager();
