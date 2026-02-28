/**
 * SignupForm Component
 * User registration form with validation and error handling
 * Requirements: 5.1, 5.2, 13.3
 */

import React, { useState, FormEvent } from 'react';
import { FormInput } from './FormInput';
import { useAuth } from '../../hooks/useAuth';
import type { AuthError } from '../../types/auth.types';
import type { LanguageCode } from '../../types/user.types';

export interface SignupFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({
  onSuccess,
  onSwitchToLogin,
}) => {
  const { signUp } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState<LanguageCode>('en-IN');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  /**
   * Validate form inputs
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

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
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await signUp(email, password, {
        name: name.trim(),
        preferredLanguage,
      });

      // Signup successful - user may need to verify email
      setSuccessMessage('Account created! Please check your email to verify your account.');
      setTimeout(() => onSuccess?.(), 2000);
    } catch (error) {
      const authError = error as AuthError;
      
      // Map error codes to user-friendly messages with actionable guidance
      const errorMessages: Record<string, string> = {
        'UsernameExistsException': 'An account with this email already exists. Please sign in instead or use a different email address.',
        'InvalidPasswordException': 'Password does not meet requirements. Please use at least 8 characters with uppercase, lowercase, and numbers.',
        'InvalidParameterException': 'Invalid input provided. Please check your information and try again.',
        'TooManyRequestsException': 'Too many signup attempts. Please wait a few minutes and try again.',
        'NetworkError': 'Network error. Please check your internet connection and try again.',
      };

      // Get user-friendly message or create a safe fallback
      let userMessage = errorMessages[authError.code];
      
      if (!userMessage) {
        // For unknown errors, provide a safe, actionable fallback
        // Never expose raw error messages that might contain sensitive data
        userMessage = 'Unable to create account at this time. Please check your information and try again, or contact support if the problem persists.';
      }

      setGeneralError(userMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="signup-form-container max-w-md mx-auto p-6" role="region" aria-labelledby="signup-heading">
      <h2 id="signup-heading" className="text-2xl font-bold text-center mb-6">
        Create Account
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

      {successMessage && (
        <div
          className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <p className="text-sm text-green-800">{successMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate aria-label="Sign up form">
        <div className="space-y-4">
          <FormInput
            id="signup-name"
            name="name"
            type="text"
            label="Full Name"
            value={name}
            onChange={setName}
            error={errors.name}
            placeholder="John Doe"
            required
            autoComplete="name"
            disabled={isSubmitting}
          />

          <FormInput
            id="signup-email"
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
            id="signup-password"
            name="password"
            type="password"
            label="Password"
            value={password}
            onChange={setPassword}
            error={errors.password}
            placeholder="At least 8 characters"
            required
            autoComplete="new-password"
            disabled={isSubmitting}
          />

          <FormInput
            id="signup-confirm-password"
            name="confirmPassword"
            type="password"
            label="Confirm Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            error={errors.confirmPassword}
            placeholder="Re-enter your password"
            required
            autoComplete="new-password"
            disabled={isSubmitting}
          />

          <div className="form-input-group">
            <label
              htmlFor="signup-language"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Preferred Language
            </label>
            <select
              id="signup-language"
              name="preferredLanguage"
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value as LanguageCode)}
              disabled={isSubmitting}
              aria-label="Select your preferred language for the application"
              className="
                w-full px-4 py-2 border border-gray-300 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-indigo-500
                disabled:bg-gray-100 disabled:cursor-not-allowed
              "
            >
              <option value="en-IN">English (India)</option>
              <option value="hi-IN">Hindi (हिंदी)</option>
              <option value="en-US">English (US)</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          aria-label={isSubmitting ? 'Creating account, please wait' : 'Create new account'}
          className="
            w-full mt-6 px-4 py-3 
            bg-indigo-600 text-white font-medium rounded-lg
            hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500
            disabled:bg-gray-400 disabled:cursor-not-allowed
            transition-colors
          "
        >
          {isSubmitting ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      {onSwitchToLogin && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              aria-label="Switch to sign in form"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Sign in
            </button>
          </p>
        </div>
      )}
    </div>
  );
};
