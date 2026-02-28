/**
 * useAuth Hook
 * React hook for authentication functionality
 * Integrates authService with userStore
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { useEffect, useCallback } from 'react';
import { authManager } from '../services/authService';
import { useUserStore } from '../stores/userStore';
import type { UserAttributes, CognitoUser, UserProfile } from '../types/user.types';

export interface UseAuthReturn {
  // State
  user: CognitoUser | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  signUp: (email: string, password: string, attributes?: UserAttributes) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<string>;
}

/**
 * Custom hook for authentication
 * Provides auth state and actions
 */
export function useAuth(): UseAuthReturn {
  const { user, profile, isAuthenticated, isLoading, setUser, setProfile, logout } = useUserStore();

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = await authManager.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        setUser(null);
      }
    };

    initAuth();
  }, [setUser]);

  /**
   * Listen for auth state changes
   */
  useEffect(() => {
    const unsubscribe = authManager.onAuthStateChange((user) => {
      setUser(user);
    });

    return unsubscribe;
  }, [setUser]);

  /**
   * Sign up a new user
   */
  const signUp = useCallback(
    async (email: string, password: string, attributes?: UserAttributes) => {
      try {
        const result = await authManager.signUp(email, password, attributes);
        setUser(result.user);
      } catch (error) {
        console.error('Sign up failed:', error);
        throw error;
      }
    },
    [setUser]
  );

  /**
   * Sign in an existing user
   */
  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        const result = await authManager.signIn(email, password);
        setUser(result.user);
        
        // Create profile from user data
        const newProfile = {
          userId: result.user.userId,
          email: result.user.attributes.email || email,
          name: result.user.attributes.name || '',
          preferredLanguage: (result.user.attributes.preferredLanguage as any) || 'en-IN',
          voiceEnabled: true,
          createdAt: new Date(),
          lastActive: new Date(),
        };
        setProfile(newProfile);
      } catch (error) {
        console.error('Sign in failed:', error);
        throw error;
      }
    },
    [setUser, setProfile]
  );

  /**
   * Sign out the current user
   */
  const signOut = useCallback(async () => {
    try {
      await authManager.signOut();
      logout();
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  }, [logout]);

  /**
   * Refresh authentication token
   */
  const refreshToken = useCallback(async () => {
    try {
      return await authManager.refreshToken();
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }, []);

  return {
    user,
    profile,
    isAuthenticated,
    isLoading,
    signUp,
    signIn,
    signOut,
    refreshToken,
  };
}
