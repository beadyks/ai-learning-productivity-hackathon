/**
 * Auth Manager Service
 * Handles user authentication with AWS Cognito
 * Requirements: 5.2, 5.3, 5.4, 5.5
 */

import {
  signUp as amplifySignUp,
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  getCurrentUser,
  fetchAuthSession,
  fetchUserAttributes,
  type SignUpInput,
  type SignInInput,
} from 'aws-amplify/auth';

import type {
  AuthManager,
  AuthError,
} from '../types/auth.types';
import type {
  CognitoUser,
  UserAttributes,
  SignUpResult,
  SignInResult,
} from '../types/user.types';

/**
 * Implementation of AuthManager using AWS Amplify Auth
 * Provides sign up, sign in, sign out, and token management
 */
class CognitoAuthManager implements AuthManager {
  private authStateListeners: Set<(user: CognitoUser | null) => void> = new Set();

  /**
   * Sign up a new user
   * Requirements: 5.2
   */
  async signUp(
    email: string,
    password: string,
    attributes?: UserAttributes
  ): Promise<SignUpResult> {
    try {
      const signUpInput: SignUpInput = {
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            ...attributes,
          },
        },
      };

      const { userId, isSignUpComplete } = await amplifySignUp(signUpInput);

      // Create CognitoUser object
      const user: CognitoUser = {
        username: email,
        userId: userId || '',
        attributes: {
          email,
          ...attributes,
        } as Record<string, string>,
      };

      return {
        user,
        userConfirmed: isSignUpComplete,
        userSub: userId || '',
      };
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign in an existing user
   * Requirements: 5.2, 5.3
   */
  async signIn(email: string, password: string): Promise<SignInResult> {
    try {
      const signInInput: SignInInput = {
        username: email,
        password,
      };

      const { isSignedIn } = await amplifySignIn(signInInput);

      if (!isSignedIn) {
        throw new Error('Sign in incomplete - additional steps required');
      }

      // Get user details and tokens
      const [currentUser, session] = await Promise.all([
        this.getCurrentUser(),
        fetchAuthSession(),
      ]);

      if (!currentUser) {
        throw new Error('Failed to retrieve user after sign in');
      }

      const tokens = session.tokens;
      if (!tokens) {
        throw new Error('Failed to retrieve tokens after sign in');
      }

      // Notify listeners
      this.notifyAuthStateChange(currentUser);

      return {
        user: currentUser,
        accessToken: tokens.accessToken.toString(),
        idToken: tokens.idToken?.toString() || '',
        refreshToken: '', // Refresh token is managed internally by Amplify
      };
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign out the current user
   * Requirements: 5.5
   */
  async signOut(): Promise<void> {
    try {
      await amplifySignOut();
      
      // Clear all session data
      this.clearSessionData();
      
      // Notify listeners
      this.notifyAuthStateChange(null);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Get the current authenticated user
   * Requirements: 5.3
   */
  async getCurrentUser(): Promise<CognitoUser | null> {
    try {
      const { username, userId } = await getCurrentUser();
      const attributes = await fetchUserAttributes();

      return {
        username,
        userId: userId || username,
        attributes: attributes as Record<string, string>,
      };
    } catch (error) {
      // User not authenticated
      return null;
    }
  }

  /**
   * Get the current access token
   * Requirements: 5.3
   */
  async getAccessToken(): Promise<string | null> {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.accessToken.toString() || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Refresh the authentication token
   * Requirements: 5.4
   */
  async refreshToken(): Promise<string> {
    try {
      // Force refresh the session
      const session = await fetchAuthSession({ forceRefresh: true });
      
      if (!session.tokens?.accessToken) {
        throw new Error('Failed to refresh token');
      }

      return session.tokens.accessToken.toString();
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Check if user is authenticated
   * Requirements: 5.3
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const session = await fetchAuthSession();
      return !!session.tokens?.accessToken;
    } catch (error) {
      return false;
    }
  }

  /**
   * Register a callback for auth state changes
   * Returns an unsubscribe function
   */
  onAuthStateChange(callback: (user: CognitoUser | null) => void): () => void {
    this.authStateListeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.authStateListeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of auth state change
   */
  private notifyAuthStateChange(user: CognitoUser | null): void {
    this.authStateListeners.forEach((listener) => {
      try {
        listener(user);
      } catch (error) {
        console.error('Error in auth state listener:', error);
      }
    });
  }

  /**
   * Clear all session data from storage
   * Requirements: 5.5
   */
  private clearSessionData(): void {
    try {
      // Clear user-related localStorage items
      const keysToRemove = [
        'user-storage',
        'session-storage',
        'voice-storage',
        'cache-storage',
      ];

      keysToRemove.forEach((key) => {
        localStorage.removeItem(key);
      });

      // Clear sessionStorage
      sessionStorage.clear();
    } catch (error) {
      console.error('Error clearing session data:', error);
    }
  }

  /**
   * Handle and transform auth errors
   */
  private handleAuthError(error: unknown): AuthError {
    const authError = error as any;
    
    return {
      code: authError.name || 'UnknownError',
      message: authError.message || 'An unknown error occurred',
      name: authError.name || 'AuthError',
    };
  }
}

// Export singleton instance based on environment
const isDevelopment = import.meta.env.VITE_DEV_MODE === 'true';

// Simple conditional export
export const authManager: AuthManager = isDevelopment 
  ? (() => {
      console.log('🔧 Development mode: Using mock authentication (no AWS required)');
      // Import and use mock auth manager
      const { mockAuthManager } = require('./mockAuthService');
      return mockAuthManager;
    })()
  : new CognitoAuthManager();

// Export class for testing
export { CognitoAuthManager };
