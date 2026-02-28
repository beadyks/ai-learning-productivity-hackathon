# Figma Wireframe Creation Guide

## Quick Start

### 1. Open Figma
- Go to: https://figma.com
- Sign up/Login (free account works)
- Click "New Design File"

### 2. Set Up Artboards
Create 8 frames (one for each screen):
- Press `F` or click Frame tool
- Select "Desktop" (1440x1024) or "iPhone 14" (390x844)
- Name each frame: "01-Landing", "02-Auth", etc.

### 3. Use Our Design System

#### Colors
```
Primary: #4F46E5 (Indigo)
Secondary: #10B981 (Green)
Background: #F9FAFB (Light Gray)
Text: #111827 (Dark Gray)
Accent: #F59E0B (Amber)
Error: #EF4444 (Red)
```

#### Typography
- Headings: Inter Bold, 32px
- Subheadings: Inter Semibold, 24px
- Body: Inter Regular, 16px
- Small: Inter Regular, 14px

#### Spacing
- Use 8px grid system
- Padding: 16px, 24px, 32px
- Margins: 16px, 24px, 32px, 48px

## Screen-by-Screen Guide

### Screen 1: Landing Page

**Steps:**
1. Create frame (1440x1024)
2. Add header:
   - Rectangle (1440x80, white)
   - Logo text (32px, bold)
   - Navigation links (16px)
3. Add hero section:
   - Large heading (48px, bold)
   - Subheading (24px)
   - CTA buttons (rounded, 16px padding)
4. Add feature cards:
   - 4 rectangles (300x200)
   - Icons (use emoji or Iconify plugin)
   - Text (16px)
5. Add pricing section:
   - 3 cards (350x400)
   - Price (32px, bold)
   - Features list (14px)

**Figma Tips:**
- Use Auto Layout for cards (Shift+A)
- Create components for reusable elements
- Use constraints for responsive design

### Screen 5: Voice Interface (Most Important!)

**Steps:**
1. Create frame (390x844 for mobile)
2. Add header (80px height)
3. Add large microphone button:
   - Circle (200x200)
   - Microphone icon (80px)
   - Add drop shadow
   - Create hover state
4. Add waveform:
   - Use rectangles of varying heights
   - Animate with prototype
5. Add transcription area:
   - Text box (full width)
   - Light background
6. Add AI response card:
   - Rounded rectangle
   - Avatar icon
   - Text content
   - Action buttons
7. Add suggestions:
   - 3 pill-shaped buttons
   - Light background
   - Hover states

**Animation:**
- Select microphone button
- Click Prototype tab
- Add "While Pressing" interaction
- Scale to 1.1, duration 200ms

### All Other Screens

Follow the detailed descriptions in each screen's markdown file:
- 02-authentication.md
- 03-dashboard.md
- 04-document-upload.md
- 06-chat-interface.md
- 07-study-planner.md
- 08-settings.md

## Figma Plugins to Use

### Essential Plugins
1. **Iconify** - Free icons
   - Search "microphone", "upload", "settings"
   - Drag and drop into design

2. **Unsplash** - Free images
   - For hero sections
   - User avatars

3. **Content Reel** - Generate fake data
   - User names
   - Email addresses
   - Dates

4. **Stark** - Accessibility checker
   - Check color contrast
   - Ensure readability

### Nice-to-Have Plugins
- **Autoflow** - Draw arrows between screens
- **Wireframe** - Quick wireframe components
- **Lorem Ipsum** - Generate placeholder text

## Creating Components

### Reusable Components to Create

1. **Button Component**
   - Primary (filled, indigo)
   - Secondary (outlined)
   - Text button
   - States: Default, Hover, Pressed, Disabled

2. **Input Field Component**
   - Default state
   - Focus state
   - Error state
   - With label and helper text

3. **Card Component**
   - White background
   - Rounded corners (8px)
   - Drop shadow
   - Padding (24px)

4. **Navigation Component**
   - Header with logo
   - Navigation links
   - User menu

## Prototyping

### Create Interactive Prototype

1. **Link Screens:**
   - Select element (e.g., "Login" button)
   - Click Prototype tab
   - Drag to target frame
   - Set interaction: "On Click" → "Navigate to"

2. **Add Animations:**
   - Transition: "Smart Animate"
   - Duration: 300ms
   - Easing: "Ease Out"

3. **Voice Button Animation:**
   - Create 2 states: Inactive, Active
   - Add "While Pressing" interaction
   - Scale and color change

4. **Present:**
   - Click Play button (top right)
   - Share link with team

## Export for GitHub

### Export Images

1. Select frame
2. Click Export (bottom right)
3. Settings:
   - Format: PNG
   - Scale: 2x (for retina)
4. Export all screens

### Save to Repository

```bash
# Create images folder
mkdir -p docs/wireframes/images

# Add exported images
# Name them: 01-landing-page.png, 02-authentication.png, etc.
```

## Tips for Voice-First Design

### Emphasize Voice Elements

1. **Large Microphone Button**
   - Size: 200x200px minimum
   - Center of screen
   - High contrast color
   - Pulsing animation

2. **Visual Feedback**
   - Waveform animation
   - Color changes (gray → green)
   - Transcription display
   - Status text

3. **Fallback Options**
   - Text input always visible
   - "Switch to Text" button
   - Keyboard shortcuts

4. **Multilingual Indicators**
   - Language selector prominent
   - Flag icons
   - Clear labels

## Accessibility Checklist

- [ ] Color contrast ratio ≥ 4.5:1
- [ ] Touch targets ≥ 44x44px
- [ ] Clear focus indicators
- [ ] Readable font sizes (≥16px)
- [ ] Alt text for icons
- [ ] Keyboard navigation support

## Time Estimate

- **Setup**: 15 minutes
- **Screen 1 (Landing)**: 30 minutes
- **Screen 2 (Auth)**: 15 minutes
- **Screen 3 (Dashboard)**: 25 minutes
- **Screen 4 (Upload)**: 20 minutes
- **Screen 5 (Voice)**: 40 minutes ⭐ Most important
- **Screen 6 (Chat)**: 25 minutes
- **Screen 7 (Planner)**: 30 minutes
- **Screen 8 (Settings)**: 20 minutes
- **Prototyping**: 20 minutes
- **Export**: 10 minutes

**Total**: ~3.5 hours

## Next Steps

1. Create wireframes in Figma
2. Export as PNG (2x)
3. Save to `docs/wireframes/images/`
4. Update README with image links
5. Add to GitHub
6. Include in hackathon submission

## Resources

- **Figma Tutorial**: https://help.figma.com/
- **Design Inspiration**: https://dribbble.com/
- **Icons**: https://iconify.design/
- **Colors**: https://coolors.co/

Good luck creating your wireframes! 🎨
