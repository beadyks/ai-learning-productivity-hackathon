import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

/**
 * Hook to manage PWA updates
 * Detects when a new service worker is available and provides update functionality
 */
export function usePWAUpdate() {
  const [needRefresh, setNeedRefresh] = useState(false)
  const [offlineReady, setOfflineReady] = useState(false)

  const {
    needRefresh: [needRefreshState, setNeedRefreshState],
    offlineReady: [offlineReadyState, setOfflineReadyState],
    updateServiceWorker
  } = useRegisterSW({
    onRegistered(registration) {
      console.log('Service Worker registered:', registration)
    },
    onRegisterError(error) {
      console.error('Service Worker registration error:', error)
    },
    onNeedRefresh() {
      console.log('New content available, please refresh.')
      setNeedRefresh(true)
    },
    onOfflineReady() {
      console.log('App ready to work offline')
      setOfflineReady(true)
    }
  })

  useEffect(() => {
    setNeedRefresh(needRefreshState)
  }, [needRefreshState])

  useEffect(() => {
    setOfflineReady(offlineReadyState)
  }, [offlineReadyState])

  const updateApp = async () => {
    await updateServiceWorker(true)
    setNeedRefresh(false)
  }

  const dismissUpdate = () => {
    setNeedRefresh(false)
    setNeedRefreshState(false)
  }

  const dismissOfflineReady = () => {
    setOfflineReady(false)
    setOfflineReadyState(false)
  }

  return {
    needRefresh,
    offlineReady,
    updateApp,
    dismissUpdate,
    dismissOfflineReady
  }
}
