import { useEffect, useState } from 'react'

/**
 * BeforeInstallPromptEvent interface
 * Extended Event interface for PWA install prompt
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

/**
 * Hook to manage PWA installation
 * Detects when the app can be installed and provides install functionality
 * 
 * Requirements: 1.1
 */
export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    const checkIfInstalled = () => {
      // Check if running in standalone mode (installed PWA)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isIOSStandalone = (window.navigator as any).standalone === true
      
      if (isStandalone || isIOSStandalone) {
        setIsInstalled(true)
        setIsInstallable(false)
      }
    }

    checkIfInstalled()

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      
      const promptEvent = e as BeforeInstallPromptEvent
      console.log('PWA install prompt available')
      
      // Store the event for later use
      setInstallPrompt(promptEvent)
      setIsInstallable(true)
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('PWA installed successfully')
      setIsInstalled(true)
      setIsInstallable(false)
      setInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  /**
   * Trigger the install prompt
   * Shows the browser's native install dialog
   */
  const promptInstall = async (): Promise<boolean> => {
    if (!installPrompt) {
      console.warn('Install prompt not available')
      return false
    }

    try {
      // Show the install prompt
      await installPrompt.prompt()

      // Wait for the user's response
      const { outcome } = await installPrompt.userChoice
      
      console.log(`User ${outcome} the install prompt`)

      if (outcome === 'accepted') {
        setIsInstallable(false)
        setInstallPrompt(null)
        return true
      }

      return false
    } catch (error) {
      console.error('Error showing install prompt:', error)
      return false
    }
  }

  /**
   * Dismiss the install prompt
   * Hides the install prompt without installing
   */
  const dismissInstall = () => {
    setIsInstallable(false)
  }

  return {
    isInstallable,
    isInstalled,
    promptInstall,
    dismissInstall
  }
}
