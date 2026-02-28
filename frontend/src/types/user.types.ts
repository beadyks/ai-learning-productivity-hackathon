/**
 * User-related type definitions
 * Covers authentication, user profiles, and user state management
 */

export type LanguageCode = 'en-IN' | 'hi-IN' | 'en-US';

export interface CognitoUser {
  username: string;
  userId: string;
  attributes: Record<string, string>;
}

export interface UserProfile {
  userId: string;
  email: string;
  name: string;
  preferredLanguage: LanguageCode;
  voiceEnabled: boolean;
  selectedVoice?: string;
  createdAt: Date;
  lastActive: Date;
}

export interface UserState {
  user: CognitoUser | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface UserAttributes {
  name?: string;
  preferredLanguage?: string;
  [key: string]: string | undefined;
}

export interface SignUpResult {
  user: CognitoUser;
  userConfirmed: boolean;
  userSub: string;
}

export interface SignInResult {
  user: CognitoUser;
  accessToken: string;
  idToken: string;
  refreshToken: string;
}

export interface UserActions {
  setUser: (user: CognitoUser | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  logout: () => void;
}
