/**
 * AuthContainer Component
 * Container for authentication forms with mode switching
 * Requirements: 5.1, 5.2
 */

import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';

export type AuthMode = 'login' | 'signup';

export interface AuthContainerProps {
  initialMode?: AuthMode;
  onAuthSuccess?: () => void;
}

export const AuthContainer: React.FC<AuthContainerProps> = ({
  initialMode = 'login',
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  return (
    <div className="auth-container min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        {mode === 'login' ? (
          <LoginForm
            onSuccess={onAuthSuccess}
            onSwitchToSignup={() => setMode('signup')}
          />
        ) : (
          <SignupForm
            onSuccess={onAuthSuccess}
            onSwitchToLogin={() => setMode('login')}
          />
        )}
      </div>
    </div>
  );
};
