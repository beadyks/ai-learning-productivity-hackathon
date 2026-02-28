# Screen 6: Chat Interface

## Purpose
Text-based conversation with AI (alternative to voice)

## Layout

```
┌─────────────────────────────────────────────────────────────┐
│ [←] Chat with AI Tutor          [🎤 Voice] [🌐 EN] [⚙️]    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Mode: Tutor • Topic: Binary Search Trees                   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                       │   │
│  │  👤 You (2:30 PM)                                    │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │ Explain binary search trees in simple terms │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │                                                       │   │
│  │  🤖 AI Tutor (2:30 PM)                              │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │ A binary search tree is like an organized   │   │   │
│  │  │ filing system. Imagine a library where      │   │   │
│  │  │ books are sorted...                          │   │   │
│  │  │                                              │   │   │
│  │  │ [Show Example] [More Details]               │   │   │
│  │  │                                              │   │   │
│  │  │ 📚 Source: Data_Structures.pdf (p. 45)      │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │                                                       │   │
│  │  👤 You (2:32 PM)                                    │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │ Show me an example                           │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │                                                       │   │
│  │  🤖 AI Tutor (2:32 PM)                              │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │ Here's a simple example:                     │   │   │
│  │  │                                              │   │   │
│  │  │ ```                                          │   │   │
│  │  │       5                                      │   │   │
│  │  │      / \                                     │   │   │
│  │  │     3   7                                    │   │   │
│  │  │    / \   \                                   │   │   │
│  │  │   1   4   9                                  │   │   │
│  │  │ ```                                          │   │   │
│  │  │                                              │   │   │
│  │  │ [🔊 Explain Aloud] [📋 Copy Code]          │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │                                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  💡 Suggested questions:                                     │
│  • How does insertion work?                                  │
│  • Compare with arrays                                       │
│  • Show deletion example                                     │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Type your question...                    [🎤] [Send]│   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Key Elements

### Header
- Back button
- Switch to Voice button (prominent)
- Language selector
- Settings

### Mode & Topic Bar
- Current mode indicator
- Active topic
- Visual color coding

### Chat Messages
**User Messages** (Right-aligned)
- Avatar: 👤
- Timestamp
- Message bubble (blue)
- Sent indicator

**AI Messages** (Left-aligned)
- Avatar: 🤖
- Timestamp
- Message bubble (gray)
- Action buttons
- Source attribution

### Message Actions
- **Show Example**: Request code/visual
- **More Details**: Deeper explanation
- **🔊 Explain Aloud**: Text-to-speech
- **📋 Copy**: Copy to clipboard
- **🔄 Regenerate**: New response

### Code Blocks
- Syntax highlighting
- Copy button
- Language indicator
- Monospace font

### Suggested Questions
- 3 contextual suggestions
- One-tap to send
- Updates based on conversation

### Input Area
- Text input field
- Voice button (quick switch)
- Send button
- Emoji support
- File attachment (optional)

## Interactions

### Sending Message
1. User types question
2. Press Enter or click Send
3. Message appears immediately
4. "Typing..." indicator
5. AI response streams in
6. Suggestions update

### Voice Toggle
- Click 🎤 button
- Switches to voice interface
- Maintains conversation context

### Code Interaction
- Click code block to expand
- Copy button copies to clipboard
- Syntax highlighting for readability

### Source Links
- Click source to view document
- Highlights relevant section
- Opens in side panel

## Message Types

### Text Message
- Plain text
- Markdown support
- Links clickable

### Code Block
```python
def binary_search(arr, target):
    # Implementation
```

### Image/Diagram
- Inline images
- Expandable on click
- Alt text for accessibility

### List/Steps
1. First step
2. Second step
3. Third step

## States

### Loading State
- "Typing..." indicator
- Animated dots
- Disable input

### Error State
- Error message in red
- Retry button
- Fallback suggestions

### Empty State
- Welcome message
- Suggested starter questions
- Quick actions

## Mobile Responsive
- Full-width messages
- Sticky input at bottom
- Swipe to see timestamp
- Pull-to-refresh for history
