import React, { createContext, useContext, ReactNode } from 'react'
import { useToast } from '../hooks/useToast'
import ToastContainer from '../components/common/ToastContainer'
import type { ToastType } from '../types/ui.types'

interface ToastContextValue {
  showToast: (
    message: string,
    type?: ToastType,
    duration?: number,
    action?: { label: string; onClick: () => void }
  ) => string
  dismissToast: (id: string) => void
  dismissAll: () => void
  success: (message: string, duration?: number) => string
  error: (message: string, duration?: number) => string
  warning: (message: string, duration?: number) => string
  info: (message: string, duration?: number) => string
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

interface ToastProviderProps {
  children: ReactNode
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
}

/**
 * Toast Provider Component
 * 
 * Provides global toast notification functionality throughout the app.
 * Renders the ToastContainer and manages toast state.
 * 
 * Requirements: 13.5
 */
export const ToastProvider: React.FC<ToastProviderProps> = ({ 
  children, 
  position = 'top-right' 
}) => {
  const toast = useToast()

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer 
        toasts={toast.toasts} 
        onDismiss={toast.dismissToast}
        position={position}
      />
    </ToastContext.Provider>
  )
}

/**
 * useToastContext Hook
 * 
 * Access toast notification methods from any component.
 * Must be used within a ToastProvider.
 * 
 * @example
 * const { success, error } = useToastContext()
 * success('File uploaded successfully!')
 * error('Failed to upload file')
 */
export const useToastContext = (): ToastContextValue => {
  const context = useContext(ToastContext)
  
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider')
  }
  
  return context
}

export default ToastContext
