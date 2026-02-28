# Layout Components

This directory contains layout components that provide the application shell structure.

## Components

### AppLayout
Main application shell that wraps all authenticated pages.

**Usage:**
```tsx
<AppLayout>
  <YourPageContent />
</AppLayout>
```

**Features:**
- Consistent header with navigation
- Network status indicator
- Responsive design (mobile-first)
- Flex-based layout for proper height management

**Structure:**
```
┌─────────────────────────────────┐
│     Network Indicator           │
├─────────────────────────────────┤
│     AppHeader (Navigation)      │
├─────────────────────────────────┤
│                                 │
│     Main Content Area           │
│     (children)                  │
│                                 │
└─────────────────────────────────┘
```

### AppHeader
Responsive header with navigation menu and user controls.

**Features:**
- Logo and branding
- Navigation links (Chat, Documents, Dashboard)
- User menu with sign out
- Mobile hamburger menu
- Active route highlighting
- Responsive breakpoints (mobile/desktop)

**Navigation Items:**
- 💬 Chat (`/chat`)
- 📤 Documents (`/documents`)
- 📊 Dashboard (`/dashboard`)

**Mobile Behavior:**
- Hamburger menu button (< 768px)
- Slide-down mobile menu
- Touch-optimized tap targets
- Auto-close on navigation

**Desktop Behavior:**
- Horizontal navigation bar
- User email display
- Sign out button

## Requirements Validation

- **Requirement 11.1**: Mobile-first responsive design ✓
- **Requirement 11.2**: Desktop multi-column layouts ✓
- **Requirement 14.2**: Navigation menu with route highlighting ✓

## Styling

All components use Tailwind CSS with:
- Responsive breakpoints (`sm:`, `md:`, `lg:`)
- Touch-friendly sizing (minimum 44x44px targets)
- Smooth transitions
- Accessible color contrast

## Implementation Notes

1. **Responsive Design**: Mobile-first approach with progressive enhancement
2. **Navigation State**: Uses `useLocation` hook for active route detection
3. **Authentication**: Integrates with `useAuth` hook for user data and sign out
4. **Accessibility**: Proper ARIA labels and semantic HTML
5. **Performance**: Minimal re-renders, efficient event handlers
