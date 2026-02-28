# Screen 5: Voice Interface (Main Learning Screen)

## Purpose
Primary learning interface - voice-first interaction with AI tutor

## Layout

```
┌─────────────────────────────────────────────────────────────┐
│ [←] Voice Learning              [🌐 English] [⚙️] [Profile] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Mode: [Tutor ▼]  Topic: Data Structures                    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                       │   │
│  │              ╔═══════════════════╗                   │   │
│  │              ║                   ║                   │   │
│  │              ║        🎤         ║                   │   │
│  │              ║                   ║                   │   │
│  │              ║   TAP TO SPEAK    ║                   │   │
│  │              ║                   ║                   │   │
│  │              ╚═══════════════════╝                   │   │
│  │                                                       │   │
│  │         ▓▓▓▓▓░░░░░░░░░░░░░░░░░░░                    │   │
│  │         Voice waveform animation                     │   │
│  │                                                       │   │
│  │  "Explain binary search trees in simple terms"      │   │
│  │                                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🤖 AI Tutor:                                        │   │
│  │                                                       │   │
│  │ A binary search tree is like an organized filing    │   │
│  │ system. Imagine a library where books are sorted... │   │
│  │                                                       │   │
│  │ [🔊 Listen]  [📋 Copy]  [🔄 Regenerate]            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  💡 Follow-up suggestions:                                   │
│  • "Show me an example"                                      │
│  • "How does insertion work?"                                │
│  • "Compare with arrays"                                     │
│                                                               │
│  [💬 Switch to Text]  [📚 View Documents]                   │
└─────────────────────────────────────────────────────────────┘
```

## Key Elements

### Header
- **Back button**: Return to dashboard
- **Language selector**: 🌐 English/Hindi/Hinglish
- **Settings**: Quick access
- **Profile**: User menu

### Mode & Topic Bar
- **Mode selector**: Tutor / Interviewer / Mentor (dropdown)
- **Current topic**: Display active topic
- **Visual indicator**: Color-coded by mode

### Voice Input Area (Center, Prominent)
- **Large microphone button**: 
  - Size: 200x200px
  - Pulsing animation when listening
  - Color: Primary (Indigo) when inactive, Green when active
- **Waveform visualization**: Real-time audio feedback
- **Transcription display**: Show what user said
- **Status text**: "Tap to speak" / "Listening..." / "Processing..."

### AI Response Area
- **Avatar**: 🤖 AI Tutor icon
- **Response text**: Large, readable font
- **Action buttons**:
  - 🔊 Listen (text-to-speech)
  - 📋 Copy to clipboard
  - 🔄 Regenerate response
- **Source attribution**: If from uploaded docs

### Follow-up Suggestions
- **3 suggested questions**: Based on context
- **One-tap to ask**: Click to speak that question
- **Smart suggestions**: Relevant to current topic

### Bottom Actions
- **Switch to Text**: Fallback option
- **View Documents**: Access uploaded materials
- **Keyboard shortcut**: Space bar to activate voice

## Interactions

### Voice Activation
1. User taps microphone button
2. Button pulses, turns green
3. Waveform shows audio input
4. Transcription appears in real-time
5. User stops speaking or taps again
6. "Processing..." indicator
7. AI response appears with animation

### Text-to-Speech
1. User taps 🔊 Listen button
2. Response is read aloud
3. Highlight current word being spoken
4. Pause/resume controls

### Mode Switching
1. User selects different mode
2. UI color scheme changes
3. AI personality adapts
4. Confirmation message

## States

### Idle State
- Microphone button: Inactive (gray/indigo)
- Text: "Tap to speak"
- No waveform

### Listening State
- Microphone button: Active (green, pulsing)
- Text: "Listening..."
- Waveform animating
- Transcription appearing

### Processing State
- Microphone button: Disabled
- Text: "Processing..."
- Loading spinner
- Transcription visible

### Response State
- Microphone button: Inactive
- AI response displayed
- Follow-up suggestions shown
- Action buttons enabled

### Error State
- Microphone button: Red
- Error message displayed
- Retry button
- Fallback to text option

## Accessibility

- **Keyboard shortcuts**: Space to activate voice
- **Screen reader support**: All buttons labeled
- **High contrast mode**: Available in settings
- **Font size adjustment**: User preference
- **Voice feedback**: Audio confirmation of actions

## Mobile Responsive

- Microphone button: 150x150px on mobile
- Stack elements vertically
- Swipe gestures for mode switching
- Bottom sheet for suggestions
- Floating action button for voice

## Multilingual Support

- Language selector always visible
- Seamless switching mid-conversation
- Mixed language support (Hinglish)
- Technical terms in both languages
