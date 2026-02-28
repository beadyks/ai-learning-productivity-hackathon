/**
 * AWS Amplify Configuration
 * Configures Cognito user pool connection and authentication flow
 * Requirements: 5.1, 5.2, 5.3
 */

import { Amplify } from 'aws-amplify';

/**
 * Amplify configuration object
 * Uses environment variables for secure configuration
 */
export const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
      region: import.meta.env.VITE_AWS_REGION || 'ap-south-1',
      
      // Authentication flow configuration
      signUpVerificationMethod: 'code' as const, // Email verification
      
      // Token storage configuration
      // Amplify v6 uses secure browser storage by default
      cookieStorage: {
        domain: window.location.hostname,
        path: '/',
        expires: 365, // Days
        sameSite: 'strict' as const,
        secure: window.location.protocol === 'https:',
      },
    },
  },
};

/**
 * Initialize Amplify with configuration
 * Call this once at app startup
 */
export function configureAmplify(): void {
  try {
    Amplify.configure(amplifyConfig);
    console.log('✓ Amplify configured successfully');
  } catch (error) {
    console.error('✗ Failed to configure Amplify:', error);
    throw new Error('Amplify configuration failed');
  }
}

/**
 * Validate that required environment variables are set
 */
export function validateAmplifyConfig(): boolean {
  const required = [
    'VITE_COGNITO_USER_POOL_ID',
    'VITE_COGNITO_CLIENT_ID',
    'VITE_AWS_REGION',
  ];

  const missing = required.filter(
    (key) => !import.meta.env[key]
  );

  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    return false;
  }

  return true;
}
