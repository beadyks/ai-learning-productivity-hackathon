import React from 'react'
import { usePWAUpdate } from '@hooks/usePWAUpdate'

/**
 * PWA Update Prompt Component
 * Displays notifications when:
 * 1. A new version of the app is available
 * 2. The app is ready to work offline
 */
export const PWAUpdatePrompt: React.FC = () => {
  const { needRefresh, offlineReady, updateApp, dismissUpdate, dismissOfflineReady } = usePWAUpdate()

  if (!needRefresh && !offlineReady) {
    return null
  }

  return (
    <>
      {/* Update Available Notification */}
      {needRefresh && (
        <div
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-indigo-600 text-white rounded-lg shadow-lg p-4 z-50 animate-slide-up"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">New Version Available</h3>
              <p className="text-sm text-indigo-100 mb-3">
                A new version of the app is ready. Update now to get the latest features and improvements.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={updateApp}
                  className="px-4 py-2 bg-white text-indigo-600 rounded-md text-sm font-medium hover:bg-indigo-50 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
                  aria-label="Update app now"
                >
                  Update Now
                </button>
                <button
                  onClick={dismissUpdate}
                  className="px-4 py-2 bg-indigo-700 text-white rounded-md text-sm font-medium hover:bg-indigo-800 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
                  aria-label="Dismiss update notification"
                >
                  Later
                </button>
              </div>
            </div>
            <button
              onClick={dismissUpdate}
              className="flex-shrink-0 text-indigo-200 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white rounded"
              aria-label="Close notification"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Offline Ready Notification */}
      {offlineReady && (
        <div
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-green-600 text-white rounded-lg shadow-lg p-4 z-50 animate-slide-up"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Ready to Work Offline</h3>
              <p className="text-sm text-green-100">
                The app is now cached and ready to work offline. You can continue learning even without an internet connection.
              </p>
            </div>
            <button
              onClick={dismissOfflineReady}
              className="flex-shrink-0 text-green-200 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white rounded"
              aria-label="Close notification"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
