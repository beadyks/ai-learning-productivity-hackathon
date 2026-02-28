/**
 * UI component type definitions
 * Covers component props, UI state, and interaction types
 */

import { InteractionMode } from './message.types';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  action?: ToastAction;
}

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

export interface ErrorState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export interface NavigationItem {
  path: string;
  label: string;
  icon?: string;
  badge?: number;
}

export interface ModeConfig {
  mode: InteractionMode;
  label: string;
  description: string;
  icon: string;
  color: string;
}

export interface ViewportSize {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export interface TouchGesture {
  type: 'swipe' | 'pinch' | 'tap' | 'long-press';
  direction?: 'left' | 'right' | 'up' | 'down';
  distance?: number;
  scale?: number;
}
