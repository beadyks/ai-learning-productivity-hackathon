# Getting Started - AI Learning Assistant Frontend

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Install dependencies:**
```bash
npm install --no-bin-links
```

2. **Set up environment variables:**
```bash
# Copy the example environment file
cp .env.example .env

# The .env file is already configured for local development
```

### Running the Application

#### Option 1: Full Stack Development (Recommended)
Run both the frontend and mock backend server:

```bash
npm run dev:full
```

This will start:
- Frontend dev server on `http://localhost:5173`
- Mock backend API on `http://localhost:3001`

#### Option 2: Frontend Only
Run just the frontend (requires separate backend):

```bash
npm run dev
```

#### Option 3: Mock Backend Only
Run just the mock API server:

```bash
npm run mock-server
```

### 🌐 Access the Application

Once running, open your browser to:
- **Frontend**: http://localhost:5173
- **Mock API**: http://localhost:3001/api

### 📱 Features Available

1. **Authentication**
   - Sign up with email/password
   - Login with existing credentials
   - Mock authentication (no real AWS Cognito needed)

2. **Learning Arena (Chat)**
   - Send messages to AI tutor
   - Switch between modes: Tutor, Interviewer, Mentor
   - Voice input/output (browser-based)

3. **Document Upload**
   - Drag and drop files
   - File validation
   - Upload progress tracking

4. **Study Dashboard**
   - View study streak
   - Weekly progress charts
   - Study plan management

5. **PWA Features**
   - Install as app
   - Offline support
   - Service worker caching

### 🧪 Testing

Run the test suite:

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

### 🏗️ Building for Production

```bash
npm run build
```

The build output will be in the `dist/` directory.

Preview the production build:

```bash
npm run preview
```

### 🔧 Development Tools

**Linting:**
```bash
npm run lint
```

**Code Formatting:**
```bash
npm run format
```

### 📝 Mock API Endpoints

The mock server provides these endpoints:

- `POST /api/auth/signup` - Create new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh token
- `POST /api/chat/message` - Send chat message
- `GET /api/chat/messages` - Get message history
- `POST /api/documents/upload` - Upload document
- `GET /api/documents` - List documents
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/study-plan` - Get study plan
- `POST /api/study-plan` - Create/update study plan
- `GET /api/health` - Health check

### 🎯 Test Credentials

For the mock backend, you can use any email/password combination:

```
Email: test@example.com
Password: password123
```

Or create a new account through the signup form.

### 🐛 Troubleshooting

**Port already in use:**
```bash
# Kill process on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9

# Kill process on port 3001 (backend)
lsof -ti:3001 | xargs kill -9
```

**Dependencies not installing:**
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install --no-bin-links
```

**Build errors:**
```bash
# Check TypeScript compilation
npx tsc --noEmit
```

### 📚 Project Structure

```
frontend/
├── src/
│   ├── components/     # React components
│   ├── pages/          # Page components
│   ├── services/       # API and service layer
│   ├── hooks/          # Custom React hooks
│   ├── stores/         # State management (Zustand)
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   └── config/         # Configuration files
├── public/             # Static assets
├── mock-server.js      # Development mock API
└── .env                # Environment variables
```

### 🔐 Environment Variables

Key environment variables in `.env`:

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:3001/api

# AWS Cognito (for production)
VITE_AWS_REGION=ap-south-1
VITE_COGNITO_USER_POOL_ID=your-pool-id
VITE_COGNITO_CLIENT_ID=your-client-id

# Feature Flags
VITE_ENABLE_VOICE=true
VITE_ENABLE_OFFLINE=true
VITE_ENABLE_PWA=true

# Development Mode
VITE_DEV_MODE=true
```

### 🚢 Deployment

For production deployment:

1. Update `.env` with production AWS credentials
2. Build the application: `npm run build`
3. Deploy the `dist/` folder to your hosting service
4. Ensure backend API is deployed and accessible

### 📖 Additional Documentation

- [PWA Implementation](./PWA_IMPLEMENTATION.md)
- [Performance Optimizations](./PERFORMANCE_OPTIMIZATIONS.md)
- [Error Handling](./ERROR_HANDLING_IMPLEMENTATION.md)
- [Final Validation Report](./FINAL_VALIDATION_REPORT.md)

### 💡 Tips

- Use Chrome DevTools for PWA testing
- Enable "Offline" mode in DevTools to test offline functionality
- Check Application tab in DevTools for service worker status
- Use React DevTools extension for component debugging

### 🤝 Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines.

### 📄 License

See [LICENSE](../LICENSE) for license information.
