# Screen 7: Study Planner

## Purpose
Create and manage personalized study plans

## Layout

```
┌─────────────────────────────────────────────────────────────┐
│ [←] Study Planner                       [🌐 EN] [Profile ▼]│
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Create Your Study Plan 📅                                   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Step 1: What's your goal?                           │   │
│  │                                                       │   │
│  │ Goal Type:                                           │   │
│  │ ○ Exam Preparation                                   │   │
│  │ ● Job Interview                                      │   │
│  │ ○ Learn New Skill                                    │   │
│  │ ○ Project Completion                                 │   │
│  │                                                       │   │
│  │ Subject/Topic:                                       │   │
│  │ [Data Structures & Algorithms_____________]         │   │
│  │                                                       │   │
│  │ Target Date:                                         │   │
│  │ [📅 March 15, 2026___________]                      │   │
│  │ (30 days from now)                                   │   │
│  │                                                       │   │
│  │ Current Level:                                       │   │
│  │ ○ Beginner  ● Intermediate  ○ Advanced             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Step 2: Your availability                           │   │
│  │                                                       │   │
│  │ Daily study time:                                    │   │
│  │ [2] hours per day                                    │   │
│  │ ◄─────●─────────────────────► (1-8 hours)          │   │
│  │                                                       │   │
│  │ Study days:                                          │   │
│  │ [✓] Mon [✓] Tue [✓] Wed [✓] Thu [✓] Fri           │   │
│  │ [ ] Sat [ ] Sun                                      │   │
│  │                                                       │   │
│  │ Preferred time:                                      │   │
│  │ ● Morning (6-12)  ○ Afternoon (12-6)  ○ Evening    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  [Generate Plan]                                             │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Generated Plan View

```
┌─────────────────────────────────────────────────────────────┐
│  Your Study Plan 🎯                                          │
│                                                               │
│  Goal: Job Interview - Data Structures                       │
│  Duration: 30 days • 2 hours/day • 60 total hours           │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Week 1: Fundamentals                                 │   │
│  │ ├─ Day 1: Arrays & Strings (2h)                     │   │
│  │ ├─ Day 2: Linked Lists (2h)                         │   │
│  │ ├─ Day 3: Stacks & Queues (2h)                      │   │
│  │ ├─ Day 4: Hash Tables (2h)                          │   │
│  │ └─ Day 5: Practice Problems (2h)                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Week 2: Trees & Graphs                               │   │
│  │ ├─ Day 6: Binary Trees (2h)                         │   │
│  │ ├─ Day 7: Binary Search Trees (2h) ← Current        │   │
│  │ ├─ Day 8: Tree Traversals (2h)                      │   │
│  │ ├─ Day 9: Graph Basics (2h)                         │   │
│  │ └─ Day 10: Graph Algorithms (2h)                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  [▼ Show All Weeks]                                          │
│                                                               │
│  Progress: ████████░░░░░░░░░░ 40% (12/30 days)              │
│                                                               │
│  [Start Today's Session] [Modify Plan] [Export Calendar]    │
└─────────────────────────────────────────────────────────────┘
```

## Key Elements

### Step 1: Goal Definition
- **Goal type**: Radio buttons (Exam, Interview, Skill, Project)
- **Subject**: Text input with autocomplete
- **Target date**: Date picker with countdown
- **Current level**: Beginner/Intermediate/Advanced

### Step 2: Availability
- **Daily hours**: Slider (1-8 hours)
- **Study days**: Checkbox for each day
- **Preferred time**: Morning/Afternoon/Evening

### Generated Plan
- **Overview**: Goal, duration, total hours
- **Weekly breakdown**: Collapsible sections
- **Daily topics**: With time allocation
- **Current indicator**: Shows progress
- **Progress bar**: Visual completion

### Actions
- **Start Session**: Begin today's topic
- **Modify Plan**: Adjust schedule
- **Export**: Add to Google Calendar

## Interactions

### Plan Generation
1. User fills form
2. Click "Generate Plan"
3. AI analyzes requirements
4. Plan appears with animation
5. User can modify

### Plan Modification
- Drag to reorder topics
- Click to edit duration
- Add/remove topics
- Adjust daily hours

### Progress Tracking
- Auto-updates on completion
- Visual indicators
- Celebration on milestones

## Mobile Responsive
- Vertical layout
- Swipe between weeks
- Floating action button
- Bottom sheet for details
