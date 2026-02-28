/**
 * AnimatedContainer Component
 * Container that respects reduced motion preferences
 * Requirement: 15.5 (reduced motion support)
 */

import React, { ReactNode } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface AnimatedContainerProps {
  children: ReactNode;
  animation?: 'fade' | 'slide-up' | 'slide-down' | 'none';
  className?: string;
}

/**
 * Container that applies animations only when user hasn't requested reduced motion
 * Requirement: 15.5 (respect prefers-reduced-motion)
 */
export const AnimatedContainer: React.FC<AnimatedContainerProps> = ({
  children,
  animation = 'fade',
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();

  // Map animation types to CSS classes
  const animationClasses: Record<string, string> = {
    fade: 'animate-fade-in',
    'slide-up': 'animate-slide-up',
    'slide-down': 'animate-slide-down',
    none: '',
  };

  // Apply animation class only if user hasn't requested reduced motion
  const animationClass = prefersReducedMotion ? '' : animationClasses[animation];

  return <div className={`${animationClass} ${className}`}>{children}</div>;
};
