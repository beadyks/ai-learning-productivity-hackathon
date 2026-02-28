import React, { useState, useEffect } from 'react'
import { useNetworkMonitor } from '../../hooks/useNetworkMonitor'
import { useCacheStore } from '../../stores/cacheStore'

/**
 * Offline Banner Component
 * 
 * Displays a banner when the user goes offline, explaining:
 * - Current offline status
 * - Available offline capabilities
 * - Queued actions that will sync when online
 * - Reconnection notification when back online
 * 
 * Requirements: 13.2
 */
const OfflineBanner: React.FC = () => {
  const { isOnline } = useNetworkMonitor()
  const { queuedRequests } = useCacheStore()
  const [wasOffline, setWasOffline] = useState(false)
  const [showReconnected, setShowReconnected] = useState(false)

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true)
      setShowReconnected(false)
    } else if (wasOffline && isOnline) {
      // User just reconnected
      setShowReconnected(true)
      setWasOffline(false)
      
      // Hide reconnection message after 5 seconds
      const timer = setTimeout(() => {
        setShowReconnected(false)
      }, 5000)
      
      return () => clearTimeout(timer)
    }
    
    return undefined
  }, [isOnline, wasOffline])

  // Show reconnection notification
  if (showReconnected) {
    return (
      <div
        className="fixed top-0 left-0 right-0 z-40 bg-green-600 text-white shadow-lg animate-slide-down"
        role="alert"
        aria-live="polite"
      >
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between flex-wrap">
            <div className="flex items-center flex-1">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">
                  Back online!
                  {queuedRequests.length > 0 && (
                    <span className="ml-2">
                      Syncing {queuedRequests.length} queued {queuedRequests.length === 1 ? 'action' : 'actions'}...
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowReconnected(false)}
              className="flex-shrink-0 ml-3 text-green-200 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white rounded"
              aria-label="Dismiss reconnection notification"
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
      </div>
    )
  }

  // Show offline banner
  if (!isOnline) {
    return (
      <div
        className="fixed top-0 left-0 right-0 z-40 bg-yellow-600 text-white shadow-lg"
        role="alert"
        aria-live="assertive"
      >
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div className="flex items-start flex-1">
              <div className="flex-shrink-0 mt-0.5">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium mb-1">
                  You're offline
                </p>
                <p className="text-sm text-yellow-100">
                  You can still view cached content and your actions will be saved.
                  {queuedRequests.length > 0 && (
                    <span className="block mt-1">
                      {queuedRequests.length} {queuedRequests.length === 1 ? 'action' : 'actions'} queued for sync.
                    </span>
                  )}
                </p>
                <details className="mt-2">
                  <summary className="text-sm text-yellow-100 cursor-pointer hover:text-white transition-colors">
                    What can I do offline?
                  </summary>
                  <ul className="mt-2 text-sm text-yellow-100 space-y-1 ml-4 list-disc">
                    <li>View previously loaded conversations</li>
                    <li>Access cached study materials</li>
                    <li>Send messages (will sync when online)</li>
                    <li>View your dashboard and progress</li>
                  </ul>
                </details>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default OfflineBanner
