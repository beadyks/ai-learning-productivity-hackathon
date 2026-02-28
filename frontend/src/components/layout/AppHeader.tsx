/**
 * AppHeader Component
 * Responsive header with navigation and user menu
 * Mobile-first with touch-optimized controls (min 44x44px touch targets)
 * Supports swipe gestures to close mobile menu
 * Requirements: 11.1, 11.2, 11.4, 15.4
 */

import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTouchGestures } from '../../hooks/useTouchGestures';

export const AppHeader: React.FC = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Touch gesture support for mobile menu
  const { attachGestureListeners } = useTouchGestures({
    onSwipe: (gesture) => {
      // Close menu on left swipe
      if (gesture.direction === 'left' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    },
    enableSwipe: true,
    enablePinch: false,
  });

  // Attach gesture listeners to mobile menu
  useEffect(() => {
    if (mobileMenuRef.current && mobileMenuOpen) {
      const cleanup = attachGestureListeners(mobileMenuRef.current);
      return cleanup;
    }
    return undefined;
  }, [mobileMenuOpen, attachGestureListeners]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const navItems = [
    { path: '/chat', label: 'Chat', icon: '💬' },
    { path: '/documents', label: 'Documents', icon: '📤' },
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  ];

  const isActive = (path: string) => {
    return location.pathname === path || (path === '/chat' && location.pathname === '/');
  };

  return (
    <header className="bg-white border-b border-gray-200 flex-shrink-0" role="banner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center min-h-touch" aria-label="AI Learning Assistant home">
              <div className="text-2xl mr-2" aria-hidden="true">🎓</div>
              <div>
                <h1 className="text-xl font-bold text-indigo-600">AI Learning Assistant</h1>
                <p className="text-xs text-gray-600 hidden sm:block">Voice-first learning experience</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-2" aria-label="Main navigation">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-2 min-h-touch rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-indigo-100 text-indigo-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                aria-current={isActive(item.path) ? 'page' : undefined}
              >
                <span className="mr-2" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4" role="region" aria-label="User menu">
            <div className="text-sm text-gray-600" aria-label="Current user email">
              {user?.attributes?.email || 'User'}
            </div>
            <button
              onClick={handleSignOut}
              aria-label="Sign out of your account"
              className="px-4 py-2 min-h-touch text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>

          {/* Mobile Menu Button - Touch optimized (44x44px) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 min-w-touch min-h-touch rounded-lg text-gray-600 hover:bg-gray-100 flex items-center justify-center"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Navigation - Touch optimized with swipe support */}
        {mobileMenuOpen && (
          <div 
            ref={mobileMenuRef} 
            id="mobile-menu"
            className="md:hidden py-4 border-t border-gray-200"
            role="navigation"
            aria-label="Mobile navigation"
          >
            <div className="text-xs text-gray-500 mb-2 px-4" aria-live="polite">
              Swipe left to close
            </div>
            <nav className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-4 py-3 min-h-touch rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-indigo-100 text-indigo-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  aria-current={isActive(item.path) ? 'page' : undefined}
                >
                  <span className="mr-3 text-xl" aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
              <div className="pt-4 border-t border-gray-200">
                <div className="px-4 py-2 text-sm text-gray-600" aria-label="Current user email">
                  {user?.attributes?.email || 'User'}
                </div>
                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  aria-label="Sign out of your account"
                  className="w-full text-left px-4 py-3 min-h-touch text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
