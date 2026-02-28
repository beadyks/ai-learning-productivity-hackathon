/**
 * Mock Auth Service for Development
 * Bypasses AWS Cognito and uses local mock API
 */

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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

class MockAuthManager implements AuthManager {
  private authStateListeners: Set<(user: CognitoUser | null) => void> = new Set();
  private currentUser: CognitoUser | null = null;
  private accessToken: string | null = null;

  constructor() {
    // Restore session from localStorage
    this.restoreSession();
  }

  async signUp(
    email: string,
    password: string,
    attributes?: UserAttributes
  ): Promise<SignUpResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name: attributes?.name || email.split('@')[0],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Signup failed');
      }

      const data = await response.json();

      const user: CognitoUser = {
        username: email,
        userId: data.user.id,
        attributes: {
          email: data.user.email,
          name: data.user.name,
        },
      };

      // Store session
      this.currentUser = user;
      this.accessToken = data.token;
      this.saveSession();

      // Notify listeners
      this.notifyAuthStateChange(user);

      return {
        user,
        userConfirmed: true,
        userSub: data.user.id,
      };
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  async signIn(email: string, password: string): Promise<SignInResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();

      const user: CognitoUser = {
        username: email,
        userId: data.user.id,
        attributes: {
          email: data.user.email,
          name: data.user.name,
        },
      };

      // Store session
      this.currentUser = user;
      this.accessToken = data.token;
      this.saveSession();

      // Notify listeners
      this.notifyAuthStateChange(user);

      return {
        user,
        accessToken: data.token,
        idToken: data.token,
        refreshToken: data.refreshToken || '',
      };
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  async signOut(): Promise<void> {
    try {
      this.currentUser = null;
      this.accessToken = null;
      this.clearSessionData();
      this.notifyAuthStateChange(null);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  async getCurrentUser(): Promise<CognitoUser | null> {
    return this.currentUser;
  }

  async getAccessToken(): Promise<string | null> {
    return this.accessToken;
  }

  async refreshToken(): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: this.accessToken,
        }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      this.accessToken = data.token;
      this.saveSession();

      return data.token;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  async isAuthenticated(): Promise<boolean> {
    return this.currentUser !== null && this.accessToken !== null;
  }

  onAuthStateChange(callback: (user: CognitoUser | null) => void): () => void {
    this.authStateListeners.add(callback);
    return () => {
      this.authStateListeners.delete(callback);
    };
  }

  private notifyAuthStateChange(user: CognitoUser | null): void {
    this.authStateListeners.forEach((listener) => {
      try {
        listener(user);
      } catch (error) {
        console.error('Error in auth state listener:', error);
      }
    });
  }

  private saveSession(): void {
    try {
      if (this.currentUser && this.accessToken) {
        localStorage.setItem('mock-auth-user', JSON.stringify(this.currentUser));
        localStorage.setItem('mock-auth-token', this.accessToken);
      }
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }

  private restoreSession(): void {
    try {
      const userStr = localStorage.getItem('mock-auth-user');
      const token = localStorage.getItem('mock-auth-token');

      if (userStr && token) {
        this.currentUser = JSON.parse(userStr);
        this.accessToken = token;
      }
    } catch (error) {
      console.error('Error restoring session:', error);
      this.clearSessionData();
    }
  }

  private clearSessionData(): void {
    try {
      localStorage.removeItem('mock-auth-user');
      localStorage.removeItem('mock-auth-token');
      
      const keysToRemove = [
        'user-storage',
        'session-storage',
        'voice-storage',
        'cache-storage',
      ];

      keysToRemove.forEach((key) => {
        localStorage.removeItem(key);
      });

      sessionStorage.clear();
    } catch (error) {
      console.error('Error clearing session data:', error);
    }
  }

  private handleAuthError(error: unknown): AuthError {
    const authError = error as any;
    
    return {
      code: authError.name || 'UnknownError',
      message: authError.message || 'An unknown error occurred',
      name: authError.name || 'AuthError',
    };
  }
}

// Export singleton instance
export const mockAuthManager = new MockAuthManager();
