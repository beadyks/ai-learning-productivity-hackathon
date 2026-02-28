import React from 'react'
import { useNavigate } from 'react-router-dom'

interface RouteErrorBoundaryProps {
  error: Error
  resetError: () => void
}

/**
 * Route Error Boundary Fallback Component
 * 
 * Displays a user-friendly error message for route-level errors
 * with options to retry or navigate away.
 * 
 * Requirements: 13.1
 */
const RouteErrorBoundary: React.FC<RouteErrorBoundaryProps> = ({ error, resetError }) => {
  const navigate = useNavigate()

  const handleGoBack = () => {
    resetError()
    navigate(-1)
  }

  const handleGoHome = () => {
    resetError()
    navigate('/')
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full mb-4">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Page Error
        </h2>

        <p className="text-gray-600 mb-6">
          This page encountered an error and couldn't load properly.
        </p>

        {import.meta.env.DEV && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200 text-left">
            <p className="text-sm font-medium text-red-800 mb-2">
              Development Error Details:
            </p>
            <pre className="text-xs text-red-700 whitespace-pre-wrap break-words">
              {error.message}
            </pre>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={resetError}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            aria-label="Retry loading page"
          >
            Try Again
          </button>
          <button
            onClick={handleGoBack}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            aria-label="Go back to previous page"
          >
            Go Back
          </button>
          <button
            onClick={handleGoHome}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            aria-label="Go to home page"
          >
            Home
          </button>
        </div>
      </div>
    </div>
  )
}

export default RouteErrorBoundary
