# Utils

This directory contains utility functions and helper methods.

## Utility Files

- **constants.ts** - Application constants
- **validators.ts** - Input validation functions
- **formatters.ts** - Data formatting utilities
- **storage.ts** - LocalStorage/SessionStorage helpers
- **errors.ts** - Error handling utilities
- **helpers.ts** - General helper functions

Example utility:
```typescript
/**
 * Formats a date to a readable string
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString()
}
```
