/**
 * LoadingFallback Component
 * Loading state displayed during route transitions and lazy loading
 * Requirements: 14.2
 */

import React from 'react';

interface LoadingFallbackProps {
  message?: string;
}

/**
 * Loading fallback component for Suspense boundaries
 */
export const LoadingFallback: React.FC<LoadingFallbackProps> = ({ 
  message = 'Loading...' 
}) => {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="text-center">
        {/* Spinner */}
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        </div>

        {/* Loading Message */}
        <p className="text-gray-600 font-medium">{message}</p>
        <p className="text-sm text-gray-500 mt-2">Please wait...</p>
      </div>
    </div>
  );
};

/**
 * Full-screen loading fallback for initial app load
 */
export const FullScreenLoading: React.FC<LoadingFallbackProps> = ({ 
  message = 'Loading...' 
}) => {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        {/* Logo */}
        <div className="text-6xl mb-6">🎓</div>

        {/* Spinner */}
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        </div>

        {/* Loading Message */}
        <h2 className="text-xl font-semibold text-gray-800 mb-2">AI Learning Assistant</h2>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
};
