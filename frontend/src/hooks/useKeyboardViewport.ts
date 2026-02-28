/**
 * useKeyboardViewport Hook
 * Detects keyboard show/hide and adjusts viewport to keep inputs visible
 * Requirements: 11.5
 */

import { useEffect, useCallback, useRef } from 'react';

interface KeyboardViewportOptions {
  /**
   * Callback when keyboard is shown
   */
  onKeyboardShow?: (keyboardHeight: number) => void;

  /**
   * Callback when keyboard is hidden
   */
  onKeyboardHide?: () => void;

  /**
   * Whether to automatically scroll focused input into view
   */
  autoScroll?: boolean;

  /**
   * Additional offset from top when scrolling (px)
   */
  scrollOffset?: number;
}

/**
 * Custom hook to handle keyboard viewport adjustments
 * Detects when virtual keyboard appears and adjusts viewport accordingly
 */
export const useKeyboardViewport = (options: KeyboardViewportOptions = {}) => {
  const {
    onKeyboardShow,
    onKeyboardHide,
    autoScroll = true,
    scrollOffset = 20,
  } = options;

  const initialViewportHeightRef = useRef<number>(0);
  const keyboardVisibleRef = useRef(false);
  const focusedElementRef = useRef<HTMLElement | null>(null);

  /**
   * Scroll element into view with offset
   */
  const scrollIntoView = useCallback(
    (element: HTMLElement) => {
      if (!autoScroll) return;

      // Use setTimeout to ensure keyboard is fully shown
      setTimeout(() => {
        const rect = element.getBoundingClientRect();
        const viewportHeight = window.visualViewport?.height || window.innerHeight;

        // Check if element is below the visible viewport
        if (rect.bottom > viewportHeight) {
          const scrollTop = window.scrollY + rect.bottom - viewportHeight + scrollOffset;
          window.scrollTo({
            top: scrollTop,
            behavior: 'smooth',
          });
        }
      }, 300); // Delay to allow keyboard animation
    },
    [autoScroll, scrollOffset]
  );

  /**
   * Handle viewport resize (keyboard show/hide detection)
   */
  const handleViewportResize = useCallback(() => {
    const currentHeight = window.visualViewport?.height || window.innerHeight;

    // Initialize on first call
    if (initialViewportHeightRef.current === 0) {
      initialViewportHeightRef.current = currentHeight;
      return;
    }

    const heightDifference = initialViewportHeightRef.current - currentHeight;

    // Keyboard is shown if viewport height decreased significantly (>150px)
    if (heightDifference > 150 && !keyboardVisibleRef.current) {
      keyboardVisibleRef.current = true;
      onKeyboardShow?.(heightDifference);

      // Scroll focused element into view
      if (focusedElementRef.current) {
        scrollIntoView(focusedElementRef.current);
      }
    }
    // Keyboard is hidden if viewport height increased back
    else if (heightDifference < 50 && keyboardVisibleRef.current) {
      keyboardVisibleRef.current = false;
      onKeyboardHide?.();
    }
  }, [onKeyboardShow, onKeyboardHide, scrollIntoView]);

  /**
   * Handle focus on input elements
   */
  const handleFocus = useCallback(
    (event: FocusEvent) => {
      const target = event.target as HTMLElement;

      // Check if focused element is an input
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        focusedElementRef.current = target;

        // If keyboard is already visible, scroll immediately
        if (keyboardVisibleRef.current) {
          scrollIntoView(target);
        }
      }
    },
    [scrollIntoView]
  );

  /**
   * Handle blur on input elements
   */
  const handleBlur = useCallback(() => {
    focusedElementRef.current = null;
  }, []);

  /**
   * Set up event listeners
   */
  useEffect(() => {
    // Store initial viewport height
    initialViewportHeightRef.current = window.visualViewport?.height || window.innerHeight;

    // Listen for viewport resize (keyboard show/hide)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportResize);
    } else {
      // Fallback for browsers without visualViewport API
      window.addEventListener('resize', handleViewportResize);
    }

    // Listen for focus events on inputs
    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportResize);
      } else {
        window.removeEventListener('resize', handleViewportResize);
      }
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
    };
  }, [handleViewportResize, handleFocus, handleBlur]);

  /**
   * Manually trigger scroll to focused element
   */
  const scrollToFocusedElement = useCallback(() => {
    if (focusedElementRef.current) {
      scrollIntoView(focusedElementRef.current);
    }
  }, [scrollIntoView]);

  return {
    isKeyboardVisible: keyboardVisibleRef.current,
    scrollToFocusedElement,
  };
};
