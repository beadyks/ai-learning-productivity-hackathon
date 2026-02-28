# Authentication Components

This directory contains all authentication-related components for the React PWA Frontend.

## Components

### AuthContainer
Main container component that manages switching between login and signup modes.

**Usage:**
```tsx
import { AuthContainer } from './components/auth';

<AuthContainer 
  initialMode="login"
  onAuthSuccess={() => navigate('/dashboard')}
/>
```

### LoginForm
User login form with email/password validation and error handling.

**Features:**
- Email and password validation
- User-friendly error messages
- Loading states
- Switch to signup option

### SignupForm
User registration form with comprehensive validation.

**Features:**
- Name, email, password validation
- Password strength requirements
- Confirm password matching
- Language preference selection
- User-friendly error messages
- Email verification flow

### FormInput
Reusable form input component with validation and error display.

**Props:**
- `id`: Input element ID
- `name`: Input name attribute
- `type`: Input type (text, email, password)
- `label`: Input label text
- `value`: Current input value
- `onChange`: Value change handler
- `error`: Error message to display
- `placeholder`: Placeholder text
- `required`: Whether field is required
- `autoComplete`: Autocomplete attribute
- `disabled`: Whether input is disabled

## Authentication Service

### authService.ts
Core authentication service using AWS Amplify Auth.

**Methods:**
- `signUp(email, password, attributes)`: Register new user
- `signIn(email, password)`: Sign in existing user
- `signOut()`: Sign out current user
- `getCurrentUser()`: Get current authenticated user
- `getAccessToken()`: Get current access token
- `refreshToken()`: Refresh authentication token
- `isAuthenticated()`: Check if user is authenticated
- `onAuthStateChange(callback)`: Listen for auth state changes

## Custom Hook

### useAuth
React hook for authentication functionality.

**Usage:**
```tsx
import { useAuth } from '../hooks/useAuth';

function MyComponent() {
  const { 
    user, 
    profile, 
    isAuthenticated, 
    isLoading,
    signIn, 
    signOut 
  } = useAuth();

  // Use authentication state and methods
}
```

**Returns:**
- `user`: Current Cognito user object
- `profile`: User profile data
- `isAuthenticated`: Boolean authentication status
- `isLoading`: Boolean loading state
- `signUp`: Function to register new user
- `signIn`: Function to sign in user
- `signOut`: Function to sign out user
- `refreshToken`: Function to refresh auth token

## Configuration

### Environment Variables
Required environment variables in `.env`:

```env
VITE_AWS_REGION=ap-south-1
VITE_COGNITO_USER_POOL_ID=your-user-pool-id
VITE_COGNITO_CLIENT_ID=your-client-id
```

### Amplify Configuration
Amplify is configured in `src/config/amplify.config.ts` and initialized in `src/main.tsx`.

## Error Handling

All authentication errors are mapped to user-friendly messages:

- **UserNotFoundException**: "No account found with this email address"
- **NotAuthorizedException**: "Incorrect email or password"
- **UserNotConfirmedException**: "Please verify your email before signing in"
- **UsernameExistsException**: "An account with this email already exists"
- **InvalidPasswordException**: "Password does not meet requirements"
- **TooManyRequestsException**: "Too many attempts. Please try again later"

## Validation Rules

### Email
- Required field
- Must be valid email format

### Password (Login)
- Required field
- Minimum 8 characters

### Password (Signup)
- Required field
- Minimum 8 characters
- Must contain uppercase letter
- Must contain lowercase letter
- Must contain number

### Name
- Required field
- Minimum 2 characters

## Security Features

- Secure token storage using Amplify's built-in storage
- Automatic token refresh
- Session cleanup on logout
- HTTPS-only cookies in production
- SameSite cookie policy

## Accessibility

All components follow accessibility best practices:
- Proper ARIA labels and roles
- Error announcements with `role="alert"`
- Keyboard navigation support
- Focus management
- Descriptive error messages

## Requirements Validation

This implementation satisfies the following requirements:

- **5.1**: Login/signup interface displayed on app visit
- **5.2**: User signup and signin with AWS Cognito
- **5.3**: JWT token storage and management
- **5.4**: Automatic token refresh
- **5.5**: Session data cleanup on logout
- **13.3**: Clear error messages with guidance

## Testing

To test the authentication flow:

1. Set up environment variables
2. Configure AWS Cognito user pool
3. Run the development server: `npm run dev`
4. Navigate to the auth page
5. Test signup flow
6. Verify email (if required)
7. Test login flow
8. Test logout flow

## Next Steps

After implementing authentication:
1. Add protected routes using React Router
2. Implement password reset flow
3. Add email verification UI
4. Integrate with backend API for user profile
5. Add social authentication (optional)
