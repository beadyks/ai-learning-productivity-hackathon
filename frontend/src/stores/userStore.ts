/**
 * User Store - Zustand state management for authentication
 * Manages user authentication state, profile data, and auth status
 * Requirements: 5.1, 5.2, 5.3, 5.5
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserState, UserActions, CognitoUser, UserProfile } from '../types/user.types';

type UserStore = UserState & UserActions;

/**
 * User store for managing authentication state
 * Persists user data to localStorage for session continuity
 */
export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      profile: null,
      isAuthenticated: false,
      isLoading: true,

      // Actions
      setUser: (user: CognitoUser | null) =>
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        }),

      setProfile: (profile: UserProfile | null) =>
        set({ profile }),

      logout: () =>
        set({
          user: null,
          profile: null,
          isAuthenticated: false,
          isLoading: false,
        }),
    }),
    {
      name: 'user-storage', // localStorage key
      partialize: (state) => ({
        // Only persist user and profile, not loading state
        user: state.user,
        profile: state.profile,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
