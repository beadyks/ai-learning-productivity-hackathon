# AI Learning Assistant - Frontend

Progressive Web App (PWA) frontend for the Voice-First AI Learning Assistant.

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Zustand** - Lightweight state management
- **React Router v6** - Client-side routing
- **Axios** - HTTP client
- **AWS Amplify Auth** - Cognito authentication
- **vite-plugin-pwa** - PWA capabilities

## Project Structure

```
frontend/
├── src/
│   ├── components/     # React components
│   ├── services/       # External service integrations
│   ├── stores/         # Zustand state stores
│   ├── hooks/          # Custom React hooks
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   ├── assets/         # Static assets
│   ├── App.tsx         # Root component
│   ├── main.tsx        # Entry point
│   └── index.css       # Global styles
├── public/             # Public static files
├── index.html          # HTML template
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript configuration
├── tailwind.config.js  # Tailwind CSS configuration
└── package.json        # Dependencies
```

## Getting Started

### Prerequisites

- Node.js 18+ (recommended: 20+)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Format code
npm run format
```

## Development

The application runs on `http://localhost:5173` by default.

### Key Features

- **Browser-Based Voice Processing** - Uses Web Speech API (zero AWS costs)
- **Offline Support** - Service Worker caching for offline functionality
- **Mobile-First Design** - Optimized for budget smartphones
- **Low-Bandwidth Mode** - Aggressive caching for 3G networks
- **PWA Capabilities** - Installable, works offline, push notifications

### TypeScript Configuration

The project uses TypeScript strict mode with additional checks:
- `strict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noFallthroughCasesInSwitch: true`
- `noImplicitReturns: true`

### Code Style

- ESLint for code quality
- Prettier for code formatting
- Run `npm run lint` before committing
- Run `npm run format` to auto-format code

## Architecture

### State Management

Uses Zustand for lightweight, performant state management:
- **userStore** - Authentication and user profile
- **sessionStore** - Conversation and chat state
- **voiceStore** - Voice interaction state
- **cacheStore** - Offline and cache state

### Services

- **authService** - AWS Cognito authentication
- **apiClient** - Backend API communication
- **voiceService** - Web Speech API wrapper
- **cacheService** - Client-side caching

### PWA Features

- Service Worker for offline support
- Cache-first strategy for static assets
- Network-first strategy for API calls
- Background sync for offline actions
- Install prompt for home screen

## Bundle Size Target

< 200KB gzipped for optimal 3G performance

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers with Web Speech API support

## License

Proprietary - AWS AI for Bharat Hackathon Project
