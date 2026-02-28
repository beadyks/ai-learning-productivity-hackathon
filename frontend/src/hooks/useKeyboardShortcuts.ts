/**
 * useKeyboardShortcuts Hook
 * Provides keyboard shortcut support for accessibility
 * Requirement: 15.2 (keyboard navigation)
 */

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  description: string;
  action: () => void;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

/**
 * Hook to register keyboard shortcuts
 * Requirement: 15.2 (keyboard shortcuts)
 */
export const useKeyboardShortcuts = ({
  shortcuts,
  enabled = true,
}: UseKeyboardShortcutsOptions) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Find matching shortcut
      const matchingShortcut = shortcuts.find((shortcut) => {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = shortcut.ctrlKey === undefined || event.ctrlKey === shortcut.ctrlKey;
        const shiftMatches = shortcut.shiftKey === undefined || event.shiftKey === shortcut.shiftKey;
        const altMatches = shortcut.altKey === undefined || event.altKey === shortcut.altKey;
        const metaMatches = shortcut.metaKey === undefined || event.metaKey === shortcut.metaKey;

        return keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches;
      });

      if (matchingShortcut) {
        event.preventDefault();
        matchingShortcut.action();
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);

  return { shortcuts };
};

/**
 * Common keyboard shortcuts for the application
 */
export const commonShortcuts = {
  // Navigation
  goToChat: { key: '1', altKey: true, description: 'Go to Chat' },
  goToDocuments: { key: '2', altKey: true, description: 'Go to Documents' },
  goToDashboard: { key: '3', altKey: true, description: 'Go to Dashboard' },
  
  // Actions
  focusSearch: { key: '/', description: 'Focus search' },
  focusInput: { key: 'i', altKey: true, description: 'Focus message input' },
  toggleVoice: { key: 'v', altKey: true, description: 'Toggle voice input' },
  sendMessage: { key: 'Enter', description: 'Send message' },
  
  // Help
  showHelp: { key: '?', shiftKey: true, description: 'Show keyboard shortcuts' },
  escape: { key: 'Escape', description: 'Close dialog/menu' },
};
