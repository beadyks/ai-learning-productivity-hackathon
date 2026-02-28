# Running the Application

## Quick Start (Recommended)

### Option 1: Using the Startup Script
```bash
./START_APP.sh
```

### Option 2: Manual Start (Two Terminals)

**Terminal 1 - Mock Backend:**
```bash
cd frontend
npm run mock-server
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Option 3: Using npm script (if concurrently works)
```bash
cd frontend
npm run dev:full
```

## Accessing the Application

- **Frontend**: http://localhost:5173
- **Mock API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/api/health

## Troubleshooting

### Port Already in Use

If you get "port already in use" errors:

```bash
# Kill process on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9

# Kill process on port 3001 (backend)
lsof -ti:3001 | xargs kill -9
```

### Dependencies Not Found

```bash
cd frontend
npm install --no-bin-links
```

### Mock Server Not Starting

Make sure you're in the frontend directory:
```bash
cd frontend
node mock-server.cjs
```

You should see:
```
🚀 Mock backend server running on http://localhost:3001
📝 API endpoints available at http://localhost:3001/api
✅ CORS enabled for frontend development
```

### Frontend Not Starting

```bash
cd frontend
node node_modules/vite/bin/vite.js
```

You should see:
```
VITE v5.4.21  ready in 296 ms
➜  Local:   http://localhost:5173/
```

## Testing the Setup

### 1. Test Mock API
```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{"status":"ok","timestamp":"2026-02-28T..."}
```

### 2. Test Frontend
Open http://localhost:5173 in your browser. You should see the login/signup page.

### 3. Test Full Flow
1. Sign up with any email/password
2. Navigate to chat
3. Send a message
4. You should get an AI response

## Current Status

✅ **Both servers are running successfully!**

- Mock backend: http://localhost:3001
- Frontend: http://localhost:5173

The application is fully functional and ready to use!
