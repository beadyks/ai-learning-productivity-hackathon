/**
 * RouteTransition Component
 * Provides smooth transitions between routes with loading states
 * Requirements: 14.2
 */

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface RouteTransitionProps {
  children: React.ReactNode;
}

/**
 * Route transition wrapper with fade effect and loading state
 */
export const RouteTransition: React.FC<RouteTransitionProps> = ({ children }) => {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayLocation, setDisplayLocation] = useState(location);

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      // Start transition
      setIsTransitioning(true);

      // Short delay for fade out
      const timer = setTimeout(() => {
        setDisplayLocation(location);
        setIsTransitioning(false);
      }, 150);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [location, displayLocation]);

  return (
    <div
      className={`h-full transition-opacity duration-150 ${
        isTransitioning ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {children}
    </div>
  );
};
