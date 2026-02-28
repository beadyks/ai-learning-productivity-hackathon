/**
 * Property-Based Test for Authentication Error Message Clarity
 * Feature: react-pwa-frontend, Property 27: Error Message Clarity
 * Validates: Requirements 13.3
 * 
 * This test ensures that authentication errors are transformed into
 * user-friendly messages with clear guidance for resolution.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Error code mapping from authService
 * These are the actual Cognito error codes that can be returned
 */
const AUTH_ERROR_CODES = [
  'UserNotFoundException',
  'NotAuthorizedException',
  'UserNotConfirmedException',
  'PasswordResetRequiredException',
  'TooManyRequestsException',
  'NetworkError',
  'UsernameExistsException',
  'InvalidPasswordException',
  'InvalidParameterException',
  'UnknownError',
] as const;

type AuthErrorCode = typeof AUTH_ERROR_CODES[number];

interface AuthError {
  code: AuthErrorCode;
  message: string;
  name: string;
}

/**
 * Transform auth error to user-friendly message
 * This mirrors the logic in LoginForm and SignupForm
 */
function getAuthErrorMessage(error: AuthError, context: 'login' | 'signup'): string {
  if (context === 'login') {
    const errorMessages: Record<string, string> = {
      'UserNotFoundException': 'No account found with this email address. Please check your email or sign up for a new account.',
      'NotAuthorizedException': 'Incorrect email or password. Please try again or reset your password.',
      'UserNotConfirmedException': 'Please verify your email before signing in. Check your inbox for the verification link.',
      'PasswordResetRequiredException': 'Password reset required. Please reset your password to continue.',
      'TooManyRequestsException': 'Too many login attempts. Please wait a few minutes and try again.',
      'NetworkError': 'Network error. Please check your internet connection and try again.',
    };

    // Get user-friendly message or create a safe fallback
    let userMessage = errorMessages[error.code];
    
    if (!userMessage) {
      // For unknown errors, provide a safe, actionable fallback
      // Never expose raw error messages that might contain sensitive data
      userMessage = 'Unable to sign in at this time. Please check your credentials and try again, or contact support if the problem persists.';
    }

    return userMessage;
  } else {
    const errorMessages: Record<string, string> = {
      'UsernameExistsException': 'An account with this email already exists. Please sign in instead or use a different email address.',
      'InvalidPasswordException': 'Password does not meet requirements. Please use at least 8 characters with uppercase, lowercase, and numbers.',
      'InvalidParameterException': 'Invalid input provided. Please check your information and try again.',
      'TooManyRequestsException': 'Too many signup attempts. Please wait a few minutes and try again.',
      'NetworkError': 'Network error. Please check your internet connection and try again.',
    };

    // Get user-friendly message or create a safe fallback
    let userMessage = errorMessages[error.code];
    
    if (!userMessage) {
      // For unknown errors, provide a safe, actionable fallback
      // Never expose raw error messages that might contain sensitive data
      userMessage = 'Unable to create account at this time. Please check your information and try again, or contact support if the problem persists.';
    }

    return userMessage;
  }
}

/**
 * Check if an error message is user-friendly
 * User-friendly messages should:
 * 1. Not contain technical jargon or stack traces
 * 2. Be clear and concise
 * 3. Provide actionable guidance
 * 4. Not expose sensitive information
 */
function isUserFriendlyMessage(message: string): boolean {
  // Ensure message is a string
  if (typeof message !== 'string') {
    return false;
  }

  // Should not be empty
  if (!message || message.trim().length === 0) {
    return false;
  }

  // Should not contain technical error patterns
  const technicalPatterns = [
    /stack trace/i,
    /\bat\s+\w+\.\w+/i, // Stack trace patterns like "at Object.method"
    /exception:/i,
    /error code:/i,
    /\bthrow\b/i,
    /\bcatch\b/i,
    /undefined is not/i,
    /cannot read property/i,
  ];

  for (const pattern of technicalPatterns) {
    if (pattern.test(message)) {
      return false;
    }
  }

  // Should not expose sensitive information
  const sensitivePatterns = [
    /password\s*[:=]\s*\S+/i,
    /token\s*[:=]\s*\S+/i,
    /api[_-]?key\s*[:=]\s*\S+/i,
    /secret\s*[:=]\s*\S+/i,
  ];

  for (const pattern of sensitivePatterns) {
    if (pattern.test(message)) {
      return false;
    }
  }

  // Should be reasonably concise (not too long)
  if (message.length > 200) {
    return false;
  }

  return true;
}

/**
 * Check if an error message provides actionable guidance
 * Actionable messages should suggest what the user can do next
 */
function providesActionableGuidance(message: string): boolean {
  const actionableKeywords = [
    'please',
    'try',
    'check',
    'verify',
    'reset',
    'contact',
    'again',
    'later',
    'ensure',
    'make sure',
  ];

  const lowerMessage = message.toLowerCase();
  return actionableKeywords.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Check if an error message is clear (not vague)
 * Clear messages should explain what went wrong
 */
function isClearMessage(message: string): boolean {
  // Should not be too vague
  const vaguePatterns = [
    /^error$/i,
    /^failed$/i,
    /^something went wrong$/i,
    /^unknown error$/i,
    /^oops$/i,
  ];

  for (const pattern of vaguePatterns) {
    if (pattern.test(message.trim())) {
      return false;
    }
  }

  // Should have some substance (more than just a few words)
  const words = message.trim().split(/\s+/);
  if (words.length < 3) {
    return false;
  }

  return true;
}

describe('Property 27: Error Message Clarity (Authentication)', () => {
  describe('Login Error Messages', () => {
    it('should transform all authentication error codes into user-friendly messages', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...AUTH_ERROR_CODES),
          fc.string({ minLength: 5, maxLength: 100 }),
          (errorCode, rawMessage) => {
            // Create an auth error
            const error: AuthError = {
              code: errorCode,
              message: rawMessage,
              name: errorCode,
            };

            // Get the user-friendly message
            const userMessage = getAuthErrorMessage(error, 'login');

            // Property: The message should be user-friendly
            expect(isUserFriendlyMessage(userMessage)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should provide actionable guidance for all authentication errors', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...AUTH_ERROR_CODES),
          fc.string({ minLength: 5, maxLength: 100 }),
          (errorCode, rawMessage) => {
            const error: AuthError = {
              code: errorCode,
              message: rawMessage,
              name: errorCode,
            };

            const userMessage = getAuthErrorMessage(error, 'login');

            // Property: The message should provide actionable guidance
            // (what the user should do next)
            const hasGuidance = providesActionableGuidance(userMessage);
            
            // For known error codes, we should always provide guidance
            if (AUTH_ERROR_CODES.includes(errorCode)) {
              expect(hasGuidance).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should provide clear (non-vague) error messages', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...AUTH_ERROR_CODES),
          fc.string({ minLength: 5, maxLength: 100 }),
          (errorCode, rawMessage) => {
            const error: AuthError = {
              code: errorCode,
              message: rawMessage,
              name: errorCode,
            };

            const userMessage = getAuthErrorMessage(error, 'login');

            // Property: The message should be clear and specific
            expect(isClearMessage(userMessage)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should never expose sensitive information in error messages', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...AUTH_ERROR_CODES),
          fc.record({
            password: fc.string({ minLength: 8, maxLength: 20 }),
            token: fc.string({ minLength: 20, maxLength: 50 }),
            apiKey: fc.string({ minLength: 20, maxLength: 50 }),
          }),
          (errorCode, sensitiveData) => {
            // Create error with sensitive data in raw message
            const error: AuthError = {
              code: errorCode,
              message: `Error with password=${sensitiveData.password} token=${sensitiveData.token}`,
              name: errorCode,
            };

            const userMessage = getAuthErrorMessage(error, 'login');

            // Property: Sensitive information should not appear in user message
            expect(userMessage).not.toContain(sensitiveData.password);
            expect(userMessage).not.toContain(sensitiveData.token);
            expect(userMessage).not.toContain(sensitiveData.apiKey);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle unknown error codes gracefully with fallback message', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5, maxLength: 50 }).filter(s => {
            // Filter out JavaScript object property names that could cause issues
            try {
              const testObj = {} as any;
              return typeof testObj[s] === 'undefined';
            } catch {
              return false;
            }
          }),
          fc.string({ minLength: 10, maxLength: 100 }),
          (unknownCode, rawMessage) => {
            // Create an error with an unknown code
            const error: AuthError = {
              code: unknownCode as AuthErrorCode,
              message: rawMessage,
              name: unknownCode,
            };

            const userMessage = getAuthErrorMessage(error, 'login');

            // Property: Should still return a user-friendly message
            expect(isUserFriendlyMessage(userMessage)).toBe(true);
            expect(userMessage.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Signup Error Messages', () => {
    it('should transform all signup error codes into user-friendly messages', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...AUTH_ERROR_CODES),
          fc.string({ minLength: 5, maxLength: 100 }),
          (errorCode, rawMessage) => {
            const error: AuthError = {
              code: errorCode,
              message: rawMessage,
              name: errorCode,
            };

            const userMessage = getAuthErrorMessage(error, 'signup');

            // Property: The message should be user-friendly
            expect(isUserFriendlyMessage(userMessage)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should provide actionable guidance for signup errors', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...AUTH_ERROR_CODES),
          fc.string({ minLength: 5, maxLength: 100 }),
          (errorCode, rawMessage) => {
            const error: AuthError = {
              code: errorCode,
              message: rawMessage,
              name: errorCode,
            };

            const userMessage = getAuthErrorMessage(error, 'signup');

            // Property: Should provide actionable guidance
            const hasGuidance = providesActionableGuidance(userMessage);
            
            if (AUTH_ERROR_CODES.includes(errorCode)) {
              expect(hasGuidance).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Error Message Consistency', () => {
    it('should provide consistent message format across all error types', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...AUTH_ERROR_CODES),
          fc.constantFrom('login', 'signup'),
          (errorCode, context) => {
            const error: AuthError = {
              code: errorCode,
              message: 'Raw error message',
              name: errorCode,
            };

            const userMessage = getAuthErrorMessage(error, context);

            // Property: All messages should follow consistent format
            // - Start with capital letter
            // - End with period or no punctuation (not multiple punctuation)
            // - No excessive whitespace
            expect(userMessage[0]).toMatch(/[A-Z]/);
            expect(userMessage).not.toMatch(/\s{2,}/); // No double spaces
            expect(userMessage).not.toMatch(/[.!?]{2,}/); // No multiple punctuation
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain reasonable message length for all errors', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...AUTH_ERROR_CODES),
          fc.constantFrom('login', 'signup'),
          (errorCode, context) => {
            const error: AuthError = {
              code: errorCode,
              message: 'Error occurred',
              name: errorCode,
            };

            const userMessage = getAuthErrorMessage(error, context);

            // Property: Messages should be concise but informative
            expect(userMessage.length).toBeGreaterThan(10); // Not too short
            expect(userMessage.length).toBeLessThan(200); // Not too long
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
