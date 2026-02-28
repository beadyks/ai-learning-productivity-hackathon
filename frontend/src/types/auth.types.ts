/**
 * Authentication type definitions
 * Covers authentication flows, token management, and auth state
 */

import { CognitoUser, UserAttributes, SignUpResult, SignInResult } from './user.types';

export interface AuthManager {
  // Authentication
  signUp(email: string, password: string, attributes?: UserAttributes): Promise<SignUpResult>;
  signIn(email: string, password: string): Promise<SignInResult>;
  signOut(): Promise<void>;
  
  // Token Management
  getCurrentUser(): Promise<CognitoUser | null>;
  getAccessToken(): Promise<string | null>;
  refreshToken(): Promise<string>;
  
  // Session
  isAuthenticated(): Promise<boolean>;
  onAuthStateChange(callback: (user: CognitoUser | null) => void): () => void;
}

export interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface AuthError {
  code: string;
  message: string;
  name: string;
}
