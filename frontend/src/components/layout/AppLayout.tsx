/**
 * AppLayout Component
 * Main application shell with header and content area
 * Mobile-first responsive layout with touch-optimized controls
 * Requirements: 11.1, 11.2, 15.4
 */

import React from 'react';
import { AppHeader } from './AppHeader';
import { NetworkIndicator } from '../NetworkIndicator';

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * Main application layout component
 * Provides consistent structure across all pages
 * Mobile-first: single-column on mobile, multi-column on desktop
 */
export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="h-screen flex flex-col bg-gray-50 touch-manipulation">
      {/* Network Status Indicator */}
      <NetworkIndicator />

      {/* Header with Navigation - Touch optimized */}
      <AppHeader />

      {/* Main Content Area - Mobile-first responsive */}
      <main className="flex-1 overflow-hidden w-full">
        {children}
      </main>
    </div>
  );
};
