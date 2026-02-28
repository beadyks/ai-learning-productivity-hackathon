# Routing Components

This directory contains routing-related components for the React PWA Frontend.

## Components

### ProtectedRoute
Route wrapper that requires authentication. Redirects unauthenticated users to `/auth` while preserving their intended destination.

**Usage:**
```tsx
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  }
/>
```

**Features:**
- Checks authentication status using `useAuth` hook
- Shows loading state while checking authentication
- Redirects to `/auth` with return URL preserved
- Automatically redirects back after successful login

### PublicRoute
Route wrapper for public pages (like authentication). Redirects authenticated users to their intended destination or dashboard.

**Usage:**
```tsx
<Route
  path="/auth"
  element={
    <PublicRoute>
      <AuthPage />
    </PublicRoute>
  }
/>
```

**Features:**
- Prevents authenticated users from accessing auth pages
- Redirects to intended destination after login
- Shows loading state while checking authentication

### RouteTransition
Provides smooth fade transitions between routes.

**Usage:**
```tsx
<RouteTransition>
  <AppRoutes />
</RouteTransition>
```

**Features:**
- Smooth opacity fade effect (150ms)
- Prevents jarring route changes
- Minimal performance impact

### LoadingFallback
Loading state components for Suspense boundaries and route loading.

**Usage:**
```tsx
// Standard loading fallback
<Suspense fallback={<LoadingFallback message="Loading page..." />}>
  <LazyComponent />
</Suspense>

// Full-screen loading (for app initialization)
<FullScreenLoading message="Initializing app..." />
```

**Features:**
- Animated spinner
- Customizable message
- Full-screen variant for app initialization
- Consistent loading UX

## Requirements Validation

- **Requirement 5.1**: Authentication interface with protected routes ✓
- **Requirement 14.2**: Navigation guards and route protection ✓
- **Requirement 14.2**: Smooth route transitions with loading states ✓

## Implementation Notes

1. **Authentication Flow**: Uses Zustand `userStore` for auth state management
2. **Route Guards**: Implemented via wrapper components (ProtectedRoute/PublicRoute)
3. **Transitions**: CSS-based opacity transitions for performance
4. **Loading States**: Suspense-compatible fallback components
5. **Mobile-First**: All components are responsive and touch-friendly
