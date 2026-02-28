/**
 * OptimizedImage Component
 * Responsive image with lazy loading and format optimization
 * Requirements: 10.2
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNetworkMonitor } from '../../hooks/useNetworkMonitor';

export interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean; // Skip lazy loading for above-the-fold images
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Optimized image component with responsive loading and lazy loading
 * Automatically adjusts quality based on network conditions
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  sizes,
  priority = false,
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority); // Load immediately if priority
  const imgRef = useRef<HTMLImageElement>(null);
  const networkMonitor = useNetworkMonitor();
  const networkInfo = {
    isOnline: networkMonitor.isOnline,
    quality: networkMonitor.quality,
    effectiveType: networkMonitor.effectiveType,
    downlink: networkMonitor.downlink,
    rtt: networkMonitor.rtt,
    saveData: networkMonitor.saveData,
  };

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
      }
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, [priority]);

  // Get optimized image URL based on network quality
  const getOptimizedSrc = (): string => {
    // If original src already has query params, append quality param
    const url = new URL(src, window.location.origin);
    
    // Adjust quality based on network
    const quality = networkInfo.quality === 'excellent' || networkInfo.quality === 'good'
      ? 'high'
      : networkInfo.quality === 'fair'
      ? 'medium'
      : 'low';

    // Add quality parameter if backend supports it
    url.searchParams.set('quality', quality);

    // Add width parameter for responsive images
    if (width) {
      url.searchParams.set('w', width.toString());
    }

    return url.toString();
  };

  // Handle image load
  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  // Handle image error
  const handleError = () => {
    setHasError(true);
    onError?.(new Error(`Failed to load image: ${src}`));
  };

  // Generate srcset for responsive images
  const generateSrcSet = (): string | undefined => {
    if (!width) return undefined;

    const widths = [width * 0.5, width, width * 1.5, width * 2];
    return widths
      .map((w) => {
        const url = new URL(src, window.location.origin);
        url.searchParams.set('w', Math.round(w).toString());
        return `${url.toString()} ${Math.round(w)}w`;
      })
      .join(', ');
  };

  // Show placeholder while loading
  if (!isInView) {
    return (
      <div
        ref={imgRef}
        className={`bg-gray-200 animate-pulse ${className}`}
        style={{ width, height }}
        aria-label={`Loading ${alt}`}
      />
    );
  }

  // Show error state
  if (hasError) {
    return (
      <div
        className={`bg-gray-100 flex items-center justify-center ${className}`}
        style={{ width, height }}
        role="img"
        aria-label={alt}
      >
        <span className="text-gray-400 text-sm">Failed to load image</span>
      </div>
    );
  }

  return (
    <>
      {/* Placeholder while loading */}
      {!isLoaded && (
        <div
          className={`bg-gray-200 animate-pulse absolute inset-0 ${className}`}
          style={{ width, height }}
        />
      )}

      {/* Actual image */}
      <img
        ref={imgRef}
        src={getOptimizedSrc()}
        srcSet={generateSrcSet()}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
      />
    </>
  );
};
