# Chat Components

This directory contains all components for the Learning Arena chat interface.

## Components

### LearningArena
Main chat interface component that orchestrates all chat functionality.

**Features:**
- Message display and sending
- Mode switching (Tutor, Interviewer, Mentor)
- Voice input and output integration
- Error handling
- Typing indicators

**Requirements:** 7.1, 7.2, 7.3, 7.4, 7.5, 12.1, 12.5, 2.1, 2.2, 2.3, 3.1, 3.2, 13.1

### MessageList
Displays conversation messages with infinite scroll support.

**Features:**
- Message rendering with timestamps
- User/assistant message distinction
- Infinite scroll for loading history
- Auto-scroll to bottom for new messages
- Empty state display

**Requirements:** 7.1, 7.2, 7.5

### MessageItem
Individual message component with metadata display.

**Features:**
- User/assistant visual distinction
- Timestamp display
- Mode badges
- Source citations
- Confidence scores
- Cached response indicators

**Requirements:** 7.1, 7.2

### MessageInput
Text input with voice button for sending messages.

**Features:**
- Text input with auto-resize
- Voice input button
- Character count
- Input validation
- Keyboard shortcuts (Enter to send, Shift+Enter for new line)

**Requirements:** 2.1, 7.1

### ModeSelector
Dropdown selector for switching between interaction modes.

**Features:**
- Mode switching UI
- Mode descriptions
- Visual mode indication
- Mode change notifications

**Requirements:** 12.1, 12.2, 12.3, 12.4, 12.5

### TypingIndicator
Animated typing indicator for AI responses.

**Features:**
- Animated dots
- Show/hide logic
- Accessibility support

**Requirements:** 7.4

### VoiceControls
Voice output controls for the chat interface.

**Features:**
- Voice output toggle
- Playback controls (pause, resume, stop)
- Speaking indicator
- Voice preference persistence

**Requirements:** 2.1, 2.2, 2.3, 3.1, 3.2

## Usage

```tsx
import { LearningArena } from '@/components/chat';

function ChatPage() {
  return (
    <div className="h-screen">
      <LearningArena />
    </div>
  );
}
```

## State Management

The chat components use Zustand stores:
- `useSessionStore` - Conversation state (messages, mode, typing)
- `useVoiceStore` - Voice state (listening, speaking, preferences)

## Services

- `chatService` - API communication for sending messages and loading history
- `voiceEngine` - Browser-based speech recognition and synthesis

## Styling

All components use Tailwind CSS for styling with:
- Mobile-first responsive design
- Touch-friendly controls
- Accessibility features (ARIA labels, keyboard navigation)
- Smooth animations and transitions
