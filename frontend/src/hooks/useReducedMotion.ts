/**
 * useReducedMotion Hook
 * Detects user's reduced motion preference
 * Requirement: 15.5 (reduced motion support)
 */

import { useState, useEffect } from 'react';

/**
 * Hook to detect if user prefers reduced motion
 * Returns true if user has enabled reduced motion in their OS settings
 */
export const useReducedMotion = (): boolean => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    // Check initial preference
    if (typeof window === 'undefined') return false;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    return mediaQuery.matches;
  });

  useEffect(() => {
    // Create media query
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Update state when preference changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
};

/**
 * Get animation duration based on reduced motion preference
 * Returns 0 if reduced motion is preferred, otherwise returns the specified duration
 */
export const getAnimationDuration = (
  duration: number,
  prefersReducedMotion: boolean
): number => {
  return prefersReducedMotion ? 0 : duration;
};

/**
 * Get transition class based on reduced motion preference
 * Returns empty string if reduced motion is preferred
 */
export const getTransitionClass = (
  transitionClass: string,
  prefersReducedMotion: boolean
): string => {
  return prefersReducedMotion ? '' : transitionClass;
};
