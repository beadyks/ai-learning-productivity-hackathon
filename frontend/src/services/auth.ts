/**
 * Auth Service Entry Point
 * Exports the appropriate auth manager based on environment
 */

import type { AuthManager } from '../types/auth.types';

const isDevelopment = import.meta.env.VITE_DEV_MODE === 'true';

let authManager: AuthManager;

if (isDevelopment) {
  console.log('🔧 Development mode: Using mock authentication');
  const { mockAuthManager } = await import('./mockAuthService');
  authManager = mockAuthManager;
} else {
  const { authManager: cognitoAuthManager } = await import('./authService');
  authManager = cognitoAuthManager;
}

export { authManager };
