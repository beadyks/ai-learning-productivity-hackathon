/**
 * App Component
 * Main application component with routing and layout
 * Implements code splitting and lazy loading for optimal performance
 * Requirements: 5.1, 10.1, 11.1, 11.2, 14.1, 14.2, 15.2
 */

import { Suspense, useState, lazy } from 'react';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import { AppLayout } from './components/layout';
import { RouteTransition, FullScreenLoading } from './components/routing';
import { PWAUpdatePrompt, PWAInstallPrompt, LowBandwidthBanner, ErrorBoundary, OfflineBanner } from './components/common';
import { ToastProvider } from './contexts/ToastContext';
import { AppRoutes } from './routes';
import { useAuth } from './hooks/useAuth';
import { useKeyboardShortcuts, commonShortcuts } from './hooks/useKeyboardShortcuts';
import type { KeyboardShortcut } from './hooks/useKeyboardShortcuts';

// Lazy load keyboard shortcuts dialog - not needed immediately
const KeyboardShortcutsDialog = lazy(() => 
  import('./components/common/KeyboardShortcutsDialog').then(module => ({ 
    default: module.KeyboardShortcutsDialog 
  }))
);

function AppContent() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);

  // Define keyboard shortcuts - Requirement 15.2
  const shortcuts: KeyboardShortcut[] = [
    {
      ...commonShortcuts.goToChat,
      action: () => navigate('/chat'),
    },
    {
      ...commonShortcuts.goToDocuments,
      action: () => navigate('/documents'),
    },
    {
      ...commonShortcuts.goToDashboard,
      action: () => navigate('/dashboard'),
    },
    {
      ...commonShortcuts.showHelp,
      action: () => setShowShortcutsDialog(true),
    },
    {
      ...commonShortcuts.escape,
      action: () => setShowShortcutsDialog(false),
    },
  ];

  // Register keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts,
    enabled: isAuthenticated,
  });

  return (
    <>
      {/* Skip to main content link - Requirement 15.2 */}
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>

      {/* Offline notification banner - Requirement 13.2 */}
      <OfflineBanner />

      {/* Low-bandwidth mode banner - Requirement 10.4, 10.5 */}
      <LowBandwidthBanner />

      <Suspense fallback={<FullScreenLoading message="Loading application..." />}>
        {isAuthenticated ? (
          <AppLayout>
            <RouteTransition>
              <main id="main-content">
                <AppRoutes />
              </main>
            </RouteTransition>
          </AppLayout>
        ) : (
          <RouteTransition>
            <main id="main-content">
              <AppRoutes />
            </main>
          </RouteTransition>
        )}
      </Suspense>

      {/* Keyboard shortcuts dialog - lazy loaded */}
      {showShortcutsDialog && (
        <Suspense fallback={null}>
          <KeyboardShortcutsDialog
            isOpen={showShortcutsDialog}
            onClose={() => setShowShortcutsDialog(false)}
            shortcuts={shortcuts}
          />
        </Suspense>
      )}

      {/* PWA Install Prompt - Requirement 1.1 */}
      <PWAInstallPrompt />

      {/* PWA Update Prompt - Requirement 1.4 */}
      <PWAUpdatePrompt />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider position="top-right">
          <AppContent />
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
