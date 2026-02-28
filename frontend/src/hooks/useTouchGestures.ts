/**
 * useTouchGestures Hook
 * Custom hook for handling touch gestures (swipe, pinch)
 * Requirements: 11.4
 */

import { useCallback, useRef } from 'react';

export interface SwipeGesture {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  velocity: number;
}

export interface PinchGesture {
  scale: number;
  center: { x: number; y: number };
}

export interface TouchGestureOptions {
  onSwipe?: (gesture: SwipeGesture) => void;
  onPinch?: (gesture: PinchGesture) => void;
  swipeThreshold?: number; // Minimum distance for swipe (px)
  velocityThreshold?: number; // Minimum velocity for swipe (px/ms)
  enableSwipe?: boolean;
  enablePinch?: boolean;
}

interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

/**
 * Custom hook for handling touch gestures
 * Supports swipe and pinch-to-zoom gestures
 */
export const useTouchGestures = (options: TouchGestureOptions = {}) => {
  const {
    onSwipe,
    onPinch,
    swipeThreshold = 50,
    velocityThreshold = 0.3,
    enableSwipe = true,
    enablePinch = true,
  } = options;

  const touchStartRef = useRef<TouchPoint | null>(null);
  const touchEndRef = useRef<TouchPoint | null>(null);
  const initialPinchDistanceRef = useRef<number | null>(null);
  const currentPinchDistanceRef = useRef<number | null>(null);

  /**
   * Calculate distance between two touch points
   */
  const getDistance = useCallback((touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  /**
   * Calculate center point between two touches
   */
  const getCenter = useCallback((touch1: Touch, touch2: Touch) => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  }, []);

  /**
   * Handle touch start
   */
  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length === 1 && enableSwipe) {
        // Single touch - potential swipe
        const touch = e.touches[0];
        if (touch) {
          touchStartRef.current = {
            x: touch.clientX,
            y: touch.clientY,
            timestamp: Date.now(),
          };
          touchEndRef.current = null;
        }
      } else if (e.touches.length === 2 && enablePinch) {
        // Two touches - potential pinch
        const touch0 = e.touches[0];
        const touch1 = e.touches[1];
        if (touch0 && touch1) {
          const distance = getDistance(touch0, touch1);
          initialPinchDistanceRef.current = distance;
          currentPinchDistanceRef.current = distance;
        }
      }
    },
    [enableSwipe, enablePinch, getDistance]
  );

  /**
   * Handle touch move
   */
  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length === 1 && enableSwipe && touchStartRef.current) {
        // Update end position for swipe
        const touch = e.touches[0];
        if (touch) {
          touchEndRef.current = {
            x: touch.clientX,
            y: touch.clientY,
            timestamp: Date.now(),
          };
        }
      } else if (e.touches.length === 2 && enablePinch && initialPinchDistanceRef.current) {
        // Calculate pinch scale
        const touch0 = e.touches[0];
        const touch1 = e.touches[1];
        if (touch0 && touch1) {
          const distance = getDistance(touch0, touch1);
          currentPinchDistanceRef.current = distance;

          const scale = distance / initialPinchDistanceRef.current;
          const center = getCenter(touch0, touch1);

          if (onPinch) {
            onPinch({ scale, center });
          }
        }
      }
    },
    [enableSwipe, enablePinch, getDistance, getCenter, onPinch]
  );

  /**
   * Handle touch end
   */
  const handleTouchEnd = useCallback(() => {
    if (enableSwipe && touchStartRef.current && touchEndRef.current) {
      const start = touchStartRef.current;
      const end = touchEndRef.current;

      // Calculate swipe distance and direction
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Calculate velocity
      const timeDiff = end.timestamp - start.timestamp;
      const velocity = distance / timeDiff;

      // Determine if it's a valid swipe
      if (distance >= swipeThreshold && velocity >= velocityThreshold) {
        // Determine direction (prioritize horizontal or vertical)
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);

        let direction: SwipeGesture['direction'];
        if (absX > absY) {
          direction = dx > 0 ? 'right' : 'left';
        } else {
          direction = dy > 0 ? 'down' : 'up';
        }

        if (onSwipe) {
          onSwipe({ direction, distance, velocity });
        }
      }
    }

    // Reset refs
    touchStartRef.current = null;
    touchEndRef.current = null;
    initialPinchDistanceRef.current = null;
    currentPinchDistanceRef.current = null;
  }, [enableSwipe, swipeThreshold, velocityThreshold, onSwipe]);

  /**
   * Attach event listeners to element
   */
  const attachGestureListeners = useCallback(
    (element: HTMLElement | null) => {
      if (!element) return;

      element.addEventListener('touchstart', handleTouchStart, { passive: true });
      element.addEventListener('touchmove', handleTouchMove, { passive: true });
      element.addEventListener('touchend', handleTouchEnd, { passive: true });
      element.addEventListener('touchcancel', handleTouchEnd, { passive: true });

      return () => {
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('touchmove', handleTouchMove);
        element.removeEventListener('touchend', handleTouchEnd);
        element.removeEventListener('touchcancel', handleTouchEnd);
      };
    },
    [handleTouchStart, handleTouchMove, handleTouchEnd]
  );

  return {
    attachGestureListeners,
  };
};
