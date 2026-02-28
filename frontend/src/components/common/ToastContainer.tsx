import React from 'react'
import Toast from './Toast'
import type { Toast as ToastType } from '../../types/ui.types'

interface ToastContainerProps {
  toasts: ToastType[]
  onDismiss: (id: string) => void
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
}

/**
 * Toast Container Component
 * 
 * Manages and displays multiple toast notifications in a fixed position.
 * Provides subtle, non-disruptive feedback for user actions.
 * 
 * Requirements: 13.5
 */
const ToastContainer: React.FC<ToastContainerProps> = ({ 
  toasts, 
  onDismiss,
  position = 'top-right'
}) => {
  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4'
      case 'top-left':
        return 'top-4 left-4'
      case 'bottom-right':
        return 'bottom-4 right-4'
      case 'bottom-left':
        return 'bottom-4 left-4'
      case 'top-center':
        return 'top-4 left-1/2 -translate-x-1/2'
      case 'bottom-center':
        return 'bottom-4 left-1/2 -translate-x-1/2'
      default:
        return 'top-4 right-4'
    }
  }

  if (toasts.length === 0) {
    return null
  }

  return (
    <div
      className={`fixed ${getPositionClasses()} z-50 w-full max-w-sm px-4 pointer-events-none`}
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="pointer-events-auto">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </div>
    </div>
  )
}

export default ToastContainer
