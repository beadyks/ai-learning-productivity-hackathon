/**
 * AuthPage Component
 * Authentication page with login/signup forms
 * Mobile-first: full-width on mobile, centered card on desktop
 * Requirements: 5.1, 5.2, 11.1, 11.2
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContainer } from '../components/auth';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleAuthSuccess = () => {
    // Redirect to the intended destination or dashboard
    const from = (location.state as any)?.from?.pathname || '/dashboard';
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <AuthContainer onAuthSuccess={handleAuthSuccess} />
    </div>
  );
};
