/**
 * PinchZoomImage Component
 * Image component with pinch-to-zoom gesture support
 * Requirements: 11.4
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTouchGestures } from '../../hooks/useTouchGestures';

interface PinchZoomImageProps {
  src: string;
  alt: string;
  className?: string;
  maxScale?: number;
  minScale?: number;
}

/**
 * Image component that supports pinch-to-zoom gestures
 * Allows users to zoom in/out on images using pinch gestures
 */
export const PinchZoomImage: React.FC<PinchZoomImageProps> = ({
  src,
  alt,
  className = '',
  maxScale = 3,
  minScale = 1,
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);
  const initialScaleRef = useRef(1);

  // Touch gesture support
  const { attachGestureListeners } = useTouchGestures({
    onPinch: (gesture) => {
      // Calculate new scale
      const newScale = Math.max(
        minScale,
        Math.min(maxScale, initialScaleRef.current * gesture.scale)
      );
      setScale(newScale);

      // Calculate position to keep zoom centered on pinch center
      if (imageRef.current) {
        const rect = imageRef.current.getBoundingClientRect();
        const centerX = gesture.center.x - rect.left;
        const centerY = gesture.center.y - rect.top;

        // Adjust position to zoom towards pinch center
        const scaleChange = newScale / scale;
        setPosition((prev) => ({
          x: prev.x + (centerX - prev.x) * (1 - scaleChange),
          y: prev.y + (centerY - prev.y) * (1 - scaleChange),
        }));
      }
    },
    enableSwipe: false,
    enablePinch: true,
  });

  // Attach gesture listeners
  useEffect(() => {
    if (imageRef.current) {
      const cleanup = attachGestureListeners(imageRef.current);
      return cleanup;
    }
    return undefined;
  }, [attachGestureListeners]);

  // Update initial scale when pinch starts
  useEffect(() => {
    initialScaleRef.current = scale;
  }, [scale]);

  // Reset zoom on double tap
  const handleDoubleClick = () => {
    if (scale > 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(2);
    }
  };

  return (
    <div
      ref={imageRef}
      className={`relative overflow-hidden ${className}`}
      onDoubleClick={handleDoubleClick}
      style={{
        touchAction: 'none', // Prevent default touch behaviors
      }}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-contain transition-transform duration-200"
        style={{
          transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
          transformOrigin: 'center',
        }}
        draggable={false}
      />

      {/* Zoom indicator */}
      {scale > 1 && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
          {Math.round(scale * 100)}%
        </div>
      )}

      {/* Instructions overlay (shown briefly on first interaction) */}
      {scale === 1 && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white text-xs px-3 py-1 rounded pointer-events-none">
          Pinch to zoom • Double tap to reset
        </div>
      )}
    </div>
  );
};
