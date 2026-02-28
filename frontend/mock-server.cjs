/**
 * Mock Backend Server for Development
 * This provides a simple API for testing the frontend without AWS infrastructure
 */

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage
const users = new Map();
const messages = [];
const documents = [];
const studyPlans = new Map();

// Mock authentication endpoints
app.post('/api/auth/signup', (req, res) => {
  const { email, password, name } = req.body;
  
  if (users.has(email)) {
    return res.status(400).json({ error: 'User already exists' });
  }
  
  const user = {
    id: `user_${Date.now()}`,
    email,
    name,
    createdAt: new Date().toISOString()
  };
  
  users.set(email, { ...user, password });
  
  res.json({
    user,
    token: `mock_token_${user.id}`,
    refreshToken: `mock_refresh_${user.id}`
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = users.get(email);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const { password: _, ...userWithoutPassword } = user;
  
  res.json({
    user: userWithoutPassword,
    token: `mock_token_${user.id}`,
    refreshToken: `mock_refresh_${user.id}`
  });
});

app.post('/api/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;
  
  res.json({
    token: `mock_token_refreshed_${Date.now()}`,
    refreshToken: `mock_refresh_refreshed_${Date.now()}`
  });
});

// Chat/Messages endpoints
app.post('/api/chat/message', (req, res) => {
  const { content, mode } = req.body;
  
  const userMessage = {
    id: `msg_${Date.now()}`,
    content,
    role: 'user',
    timestamp: new Date().toISOString()
  };
  
  messages.push(userMessage);
  
  // Simulate AI response
  setTimeout(() => {
    const responses = {
      tutor: `As your tutor, I'll help you understand: ${content}. Let me break this down for you...`,
      interviewer: `That's an interesting point about "${content}". Can you elaborate on your experience with this?`,
      mentor: `I appreciate you sharing about "${content}". Based on my experience, here's what I'd suggest...`
    };
    
    const aiMessage = {
      id: `msg_${Date.now()}_ai`,
      content: responses[mode] || responses.tutor,
      role: 'assistant',
      timestamp: new Date().toISOString()
    };
    
    messages.push(aiMessage);
  }, 1000);
  
  res.json({ message: userMessage, success: true });
});

app.get('/api/chat/messages', (req, res) => {
  res.json({ messages: messages.slice(-50) }); // Return last 50 messages
});

// Document upload endpoints
app.post('/api/documents/upload', (req, res) => {
  const { fileName, fileSize, fileType } = req.body;
  
  const document = {
    id: `doc_${Date.now()}`,
    fileName,
    fileSize,
    fileType,
    uploadedAt: new Date().toISOString(),
    status: 'processing'
  };
  
  documents.push(document);
  
  // Simulate processing
  setTimeout(() => {
    document.status = 'completed';
  }, 2000);
  
  res.json({ document, uploadUrl: `http://localhost:3001/upload/${document.id}` });
});

app.get('/api/documents', (req, res) => {
  res.json({ documents });
});

// Dashboard/Study Plan endpoints
app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    streak: 7,
    totalStudyTime: 1250, // minutes
    completedTopics: 23,
    weeklyProgress: [
      { day: 'Mon', minutes: 45 },
      { day: 'Tue', minutes: 60 },
      { day: 'Wed', minutes: 30 },
      { day: 'Thu', minutes: 75 },
      { day: 'Fri', minutes: 50 },
      { day: 'Sat', minutes: 90 },
      { day: 'Sun', minutes: 40 }
    ]
  });
});

app.get('/api/study-plan', (req, res) => {
  const userId = req.headers.authorization?.split(' ')[1] || 'default';
  const plan = studyPlans.get(userId);
  
  if (!plan) {
    return res.json({ studyPlan: null });
  }
  
  res.json({ studyPlan: plan });
});

app.post('/api/study-plan', (req, res) => {
  const userId = req.headers.authorization?.split(' ')[1] || 'default';
  const { title, description, topics } = req.body;
  
  const plan = {
    id: `plan_${Date.now()}`,
    title,
    description,
    topics: topics || [],
    createdAt: new Date().toISOString(),
    progress: 0
  };
  
  studyPlans.set(userId, plan);
  
  res.json({ studyPlan: plan });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Mock backend server running on http://localhost:${PORT}`);
  console.log(`📝 API endpoints available at http://localhost:${PORT}/api`);
  console.log(`✅ CORS enabled for frontend development`);
});
