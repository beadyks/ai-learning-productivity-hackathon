# Screen 8: Settings

## Purpose
User preferences and account management

## Layout

```
┌─────────────────────────────────────────────────────────────┐
│ [←] Settings                            [🌐 EN] [Profile ▼]│
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 👤 Profile                                           │   │
│  │                                                       │   │
│  │ Name: Beady                                          │   │
│  │ Email: beadyka@gmail.com                            │   │
│  │ Plan: Basic (₹49/month)                             │   │
│  │                                                       │   │
│  │ [Edit Profile] [Upgrade Plan]                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🌐 Language & Voice                                  │   │
│  │                                                       │   │
│  │ Preferred Language:                                  │   │
│  │ [English ▼]                                          │   │
│  │ • English  • हिंदी  • Hinglish                      │   │
│  │                                                       │   │
│  │ Voice Settings:                                      │   │
│  │ Speech Speed: ◄───●─────► Normal                    │   │
│  │ Voice Gender: ○ Male  ● Female  ○ Neutral          │   │
│  │                                                       │   │
│  │ [Test Voice]                                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🎓 Learning Preferences                              │   │
│  │                                                       │   │
│  │ Skill Level:                                         │   │
│  │ ○ Beginner  ● Intermediate  ○ Advanced             │   │
│  │                                                       │   │
│  │ Explanation Style:                                   │   │
│  │ ● Simple  ○ Detailed  ○ Technical                  │   │
│  │                                                       │   │
│  │ Default Mode:                                        │   │
│  │ [Tutor ▼]                                            │   │
│  │ • Tutor  • Interviewer  • Mentor                    │   │
│  │                                                       │   │
│  │ Code Examples:                                       │   │
│  │ [✓] Include code in explanations                    │   │
│  │ [✓] Show real-world examples                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔔 Notifications                                     │   │
│  │                                                       │   │
│  │ [✓] Study reminders                                 │   │
│  │ [✓] Daily progress summary                          │   │
│  │ [ ] Weekly reports                                   │   │
│  │ [✓] Goal deadline alerts                            │   │
│  │                                                       │   │
│  │ Reminder Time: [09:00 AM ▼]                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🎨 Appearance                                        │   │
│  │                                                       │   │
│  │ Theme:                                               │   │
│  │ ● Light  ○ Dark  ○ Auto                            │   │
│  │                                                       │   │
│  │ Font Size:                                           │   │
│  │ ◄───●─────► Medium                                  │   │
│  │                                                       │   │
│  │ [✓] High contrast mode                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📊 Usage & Billing                                   │   │
│  │                                                       │   │
│  │ This Month:                                          │   │
│  │ • 12 hours studied                                   │   │
│  │ • 8 documents uploaded                               │   │
│  │ • 150 AI queries                                     │   │
│  │                                                       │   │
│  │ Plan: Basic (₹49/month)                             │   │
│  │ Next billing: March 1, 2026                         │   │
│  │                                                       │   │
│  │ [View Detailed Usage] [Manage Subscription]         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔒 Privacy & Security                                │   │
│  │                                                       │   │
│  │ [Change Password]                                    │   │
│  │ [Download My Data]                                   │   │
│  │ [Delete Account]                                     │   │
│  │                                                       │   │
│  │ [✓] Allow analytics for improvement                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  [Save Changes] [Cancel]                                     │
│                                                               │
│  [Logout]                                                    │
└─────────────────────────────────────────────────────────────┘
```

## Key Elements

### Profile Section
- Name and email display
- Current plan badge
- Edit profile button
- Upgrade plan CTA

### Language & Voice
- **Language selector**: English/Hindi/Hinglish
- **Speech speed**: Slider (0.5x - 2x)
- **Voice gender**: Male/Female/Neutral
- **Test button**: Preview voice settings

### Learning Preferences
- **Skill level**: Beginner/Intermediate/Advanced
- **Explanation style**: Simple/Detailed/Technical
- **Default mode**: Tutor/Interviewer/Mentor
- **Code examples**: Toggle options

### Notifications
- Study reminders toggle
- Progress summary toggle
- Weekly reports toggle
- Goal alerts toggle
- Reminder time picker

### Appearance
- **Theme**: Light/Dark/Auto
- **Font size**: Slider (Small/Medium/Large)
- **High contrast**: Toggle for accessibility

### Usage & Billing
- Current month stats
- Plan details
- Next billing date
- Usage details link
- Subscription management

### Privacy & Security
- Change password
- Download data (GDPR)
- Delete account
- Analytics opt-in

## Interactions

### Saving Changes
- Auto-save on toggle changes
- Manual save for text inputs
- Confirmation for critical changes
- Success notification

### Voice Testing
- Click "Test Voice"
- Plays sample text
- Uses current settings
- Adjustable in real-time

### Plan Upgrade
- Shows plan comparison
- Highlights benefits
- Secure payment flow
- Immediate activation

## Mobile Responsive
- Collapsible sections
- Sticky save button
- Swipe gestures
- Bottom sheet for pickers
