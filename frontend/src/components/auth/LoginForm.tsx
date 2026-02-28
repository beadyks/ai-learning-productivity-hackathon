/**
 * LoginForm Component
 * User login form with validation and error handling
 * Requirements: 5.1, 5.2, 13.3
 */

import React, { useState, FormEvent } from 'react';
import { FormInput } from './FormInput';
import { useAuth } from '../../hooks/useAuth';
import type { AuthError } from '../../types/auth.types';

export interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToSignup?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onSwitchToSignup,
}) => {
  const { signIn } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState('');

  /**
   * Validate form inputs
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setGeneralError('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await signIn(email, password);
      onSuccess?.();
    } catch (error) {
      const authError = error as AuthError;
      
      // Map error codes to user-friendly messages with actionable guidance
      const errorMessages: Record<string, string> = {
        'UserNotFoundException': 'No account found with this email address. Please check your email or sign up for a new account.',
        'NotAuthorizedException': 'Incorrect email or password. Please try again or reset your password.',
        'UserNotConfirmedException': 'Please verify your email before signing in. Check your inbox for the verification link.',
        'PasswordResetRequiredException': 'Password reset required. Please reset your password to continue.',
        'TooManyRequestsException': 'Too many login attempts. Please wait a few minutes and try again.',
        'NetworkError': 'Network error. Please check your internet connection and try again.',
      };

      // Get user-friendly message or create a safe fallback
      let userMessage = errorMessages[authError.code];
      
      if (!userMessage) {
        // For unknown errors, provide a safe, actionable fallback
        // Never expose raw error messages that might contain sensitive data
        userMessage = 'Unable to sign in at this time. Please check your credentials and try again, or contact support if the problem persists.';
      }

      setGeneralError(userMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-form-container max-w-md mx-auto p-6" role="region" aria-labelledby="login-heading">
      <h2 id="login-heading" className="text-2xl font-bold text-center mb-6">
        Sign In
      </h2>

      {generalError && (
        <div
          className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <p className="text-sm text-red-800">{generalError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate aria-label="Sign in form">
        <div className="space-y-4">
          <FormInput
            id="login-email"
            name="email"
            type="email"
            label="Email"
            value={email}
            onChange={setEmail}
            error={errors.email}
            placeholder="you@example.com"
            required
            autoComplete="email"
            disabled={isSubmitting}
          />

          <FormInput
            id="login-password"
            name="password"
            type="password"
            label="Password"
            value={password}
            onChange={setPassword}
            error={errors.password}
            placeholder="Enter your password"
            required
            autoComplete="current-password"
            disabled={isSubmitting}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          aria-label={isSubmitting ? 'Signing in, please wait' : 'Sign in to your account'}
          className="
            w-full mt-6 px-4 py-3 
            bg-indigo-600 text-white font-medium rounded-lg
            hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500
            disabled:bg-gray-400 disabled:cursor-not-allowed
            transition-colors
          "
        >
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      {onSwitchToSignup && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToSignup}
              aria-label="Switch to sign up form"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Sign up
            </button>
          </p>
        </div>
      )}
    </div>
  );
};
