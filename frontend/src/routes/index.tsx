/**
 * Routes Configuration
 * Centralized route definitions with protection and navigation guards
 * Implements code splitting and lazy loading for optimal performance
 * Requirements: 5.1, 10.1, 14.1, 14.2
 */

import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from '../components/routing';
import { LoadingFallback } from '../components/routing/LoadingFallback';

// Lazy load page components for code splitting - Requirement 10.1, 14.1
const AuthPage = lazy(() => import('../pages/AuthPage').then(module => ({ default: module.AuthPage })));
const ChatPage = lazy(() => import('../pages/ChatPage').then(module => ({ default: module.ChatPage })));
const DocumentPage = lazy(() => import('../pages/DocumentPage').then(module => ({ default: module.DocumentPage })));
const DashboardPage = lazy(() => import('../pages/DashboardPage').then(module => ({ default: module.DashboardPage })));

/**
 * Application routes with authentication guards
 * Wrapped in Suspense for lazy loading support
 */
export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<LoadingFallback message="Loading page..." />}>
      <Routes>
        {/* Public Routes - Redirect to dashboard if authenticated */}
        <Route
          path="/auth"
          element={
            <PublicRoute>
              <AuthPage />
            </PublicRoute>
          }
        />

        {/* Protected Routes - Require authentication */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/documents"
          element={
            <ProtectedRoute>
              <DocumentPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Catch-all route - Redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};
