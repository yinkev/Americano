# Study Session UI Wireframes

**Story 1.6 - Pending UI Pages (Tasks 7 & 9)**

---

## 1. Study History Page (`/study/history`)

**Task 7: Build study history page with filters and pagination**

### Desktop Layout (1200px+)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ← Back to Study                                    [Kevy ▼]             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Study History                                                            │
│  Track your learning journey over time                                   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  📊 Total Study Time: 12h 34m                                    │   │
│  │  🔥 Current Streak: 7 days                                       │   │
│  │  📅 Sessions This Week: 5                                        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  Filters:  [Today ▼]  [All Courses ▼]  [Search sessions...]            │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ October 14, 2025                                                 │   │
│  │                                                                   │   │
│  │ ┌───────────────────────────────────────────────────────────┐  │   │
│  │ │ 🕐 2:45 PM - 4:15 PM  │  1h 30m  │  Pharmacology          │  │   │
│  │ │ 45 cards reviewed • 12 new cards                           │  │   │
│  │ │ "Focused on cardiac drugs - need to review beta blockers" │  │   │
│  │ │                                            [View Details →] │  │   │
│  │ └───────────────────────────────────────────────────────────┘  │   │
│  │                                                                   │   │
│  │ ┌───────────────────────────────────────────────────────────┐  │   │
│  │ │ 🕐 9:30 AM - 10:15 AM  │  45m     │  Gross Anatomy        │  │   │
│  │ │ 23 cards reviewed • 5 new cards                            │  │   │
│  │ │ "Upper limb muscles - feeling confident"                  │  │   │
│  │ │                                            [View Details →] │  │   │
│  │ └───────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ October 13, 2025                                                 │   │
│  │                                                                   │   │
│  │ ┌───────────────────────────────────────────────────────────┐  │   │
│  │ │ 🕐 7:00 PM - 8:30 PM   │  1h 30m  │  Clinical Skills      │  │   │
│  │ │ 38 cards reviewed • 8 new cards                            │  │   │
│  │ │                                            [View Details →] │  │   │
│  │ └───────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  [← Previous]  Page 1 of 12  [Next →]                                   │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### Mobile Layout (375px)

```
┌───────────────────────────┐
│ ← Study History     [K ▼] │
├───────────────────────────┤
│                            │
│ 📊 Total: 12h 34m          │
│ 🔥 Streak: 7 days          │
│ 📅 This Week: 5            │
│                            │
│ [Today ▼] [All Courses ▼] │
│                            │
│ October 14, 2025           │
│                            │
│ ┌────────────────────────┐│
│ │ 🕐 2:45 PM             ││
│ │ 1h 30m • Pharmacology  ││
│ │ 45 cards • 12 new      ││
│ │ "Cardiac drugs..."     ││
│ │          [View →]      ││
│ └────────────────────────┘│
│                            │
│ ┌────────────────────────┐│
│ │ 🕐 9:30 AM             ││
│ │ 45m • Gross Anatomy    ││
│ │ 23 cards • 5 new       ││
│ │          [View →]      ││
│ └────────────────────────┘│
│                            │
│ October 13, 2025           │
│                            │
│ ┌────────────────────────┐│
│ │ 🕐 7:00 PM             ││
│ │ 1h 30m • Clinical...   ││
│ │ 38 cards • 8 new       ││
│ │          [View →]      ││
│ └────────────────────────┘│
│                            │
│ [← Prev] 1/12 [Next →]     │
│                            │
└───────────────────────────┘
```

### Empty State

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│                           📚                                              │
│                                                                           │
│                  No study sessions yet                                    │
│                                                                           │
│         Start your first study session to see your history here          │
│                                                                           │
│                   [Start Study Session]                                   │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Analytics Dashboard (`/progress` or integrated in `/study`)

**Task 9: Build analytics dashboard component with charts**

### Desktop Layout (1200px+)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ← Back to Dashboard                                [Kevy ▼]             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Study Analytics                                                          │
│  Understand your learning patterns                                       │
│                                                                           │
│  Period: [Last 7 Days ▼]  [Last 30 Days]  [Last 3 Months]  [All Time]  │
│                                                                           │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │
│  │ 🔥 Study Streak  │  │ ⏱️  Avg Session   │  │ 📊 Total Time    │      │
│  │                  │  │                  │  │                  │      │
│  │     7 days       │  │     52 min       │  │    12h 34m       │      │
│  │  Keep it up! 🎉  │  │  Last 7 days     │  │  This week       │      │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘      │
│                                                                           │
│  Daily Study Time (Last 7 Days)                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                   │   │
│  │  120├─────────────────────────────────────────────────────────┐ │   │
│  │     │                                            ███            │ │   │
│  │  100│                                            ███            │ │   │
│  │     │                         ███                ███            │ │   │
│  │   80│              ███        ███                ███            │ │   │
│  │     │              ███        ███     ███        ███            │ │   │
│  │   60│   ███        ███        ███     ███        ███            │ │   │
│  │     │   ███        ███        ███     ███        ███            │ │   │
│  │   40│   ███        ███        ███     ███        ███     ███    │ │   │
│  │     │   ███        ███        ███     ███        ███     ███    │ │   │
│  │   20│   ███        ███        ███     ███        ███     ███    │ │   │
│  │     │   ███        ███        ███     ███        ███     ███    │ │   │
│  │    0└───┴──────────┴──────────┴───────┴─────────┴───────┴────┘ │   │
│  │     Mon    Tue      Wed      Thu     Fri       Sat     Sun      │   │
│  │                                                                   │   │
│  │     70min  95min    110min   85min   120min    90min   45min    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─────────────────────────────┐  ┌──────────────────────────────┐     │
│  │ Study Time by Subject        │  │ When You Study Most          │     │
│  │                              │  │                              │     │
│  │     Pharmacology ▓▓▓▓▓ 35%   │  │ Morning (6-12)    ▓▓▓  23%   │     │
│  │     Gross Anatomy ▓▓▓▓ 28%   │  │ Afternoon (12-6)  ▓▓▓▓▓ 45%  │     │
│  │     Clinical Skills ▓▓▓ 22%  │  │ Evening (6-12)    ▓▓▓▓ 28%   │     │
│  │     SciFOM         ▓▓ 15%    │  │ Night (12-6)      ▓ 4%       │     │
│  │                              │  │                              │     │
│  │     [View Detailed →]        │  │ You're an afternoon learner! │     │
│  └─────────────────────────────┘  └──────────────────────────────┘     │
│                                                                           │
│  Weekly Trend (Last 8 Weeks)                                             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 10h├─────────────────────────────────────────────────────────┐  │   │
│  │    │                                            ●────●         │  │   │
│  │  8h│                               ●────●──────●               │  │   │
│  │    │                  ●───────●───●                            │  │   │
│  │  6h│      ●──────●───●                                         │  │   │
│  │    │  ●──●                                                     │  │   │
│  │  4h│                                                            │  │   │
│  │    │                                                            │  │   │
│  │  2h│                                                            │  │   │
│  │    │                                                            │  │   │
│  │  0h└────┴────┴────┴────┴────┴────┴────┴────┴────────────────┘  │   │
│  │    W1  W2  W3  W4  W5  W6  W7  W8                              │   │
│  │                                                                  │   │
│  │    📈 You're studying 15% more than last week!                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### Mobile Layout (375px)

```
┌───────────────────────────┐
│ ← Analytics         [K ▼] │
├───────────────────────────┤
│                            │
│ [Last 7 Days ▼]           │
│                            │
│ ┌────────────────────────┐│
│ │ 🔥 Streak: 7 days      ││
│ │ ⏱️  Avg: 52 min         ││
│ │ 📊 Total: 12h 34m      ││
│ └────────────────────────┘│
│                            │
│ Daily Study (Last 7 Days)  │
│ ┌────────────────────────┐│
│ │ 120min│        ███     ││
│ │       │   ███  ███     ││
│ │       │   ███  ███ ███ ││
│ │     0 └─┬──┬──┬──┬──┬─ ││
│ │       Mon Wed Fri Sun  ││
│ └────────────────────────┘│
│                            │
│ Study by Subject           │
│ ┌────────────────────────┐│
│ │ Pharmacology    ▓▓▓ 35%││
│ │ Gross Anatomy   ▓▓▓ 28%││
│ │ Clinical Skills ▓▓  22%││
│ │ SciFOM          ▓   15%││
│ └────────────────────────┘│
│                            │
│ When You Study             │
│ ┌────────────────────────┐│
│ │ Afternoon  ▓▓▓▓▓  45%  ││
│ │ Evening    ▓▓▓▓    28% ││
│ │ Morning    ▓▓▓     23% ││
│ │ Night      ▓        4% ││
│ └────────────────────────┘│
│                            │
│ 📈 +15% vs last week       │
│                            │
└───────────────────────────┘
```

---

## Design System Notes

### Colors (OKLCH - NO GRADIENTS)
- **Primary Blue**: `oklch(0.55 0.2 250)` - Buttons, active states
- **Success Green**: `oklch(0.65 0.2 140)` - Streak, positive metrics
- **Accent Orange**: `oklch(0.6 0.2 30)` - Highlights, warnings
- **Text Dark**: `oklch(0.3 0.15 250)` - Headings
- **Text Medium**: `oklch(0.5 0.1 250)` - Body text
- **Text Light**: `oklch(0.6 0.1 250)` - Secondary text

### Glassmorphism Cards
```css
background: oklch(1 0 0 / 0.8);
backdrop-filter: blur(12px);
box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
border-radius: 16px; /* rounded-2xl */
```

### Typography
- **Headings**: DM Sans (font-heading)
- **Body**: Inter (font-sans)

### Charts (Recharts)
- **Bar Chart**: Daily study time (7 days)
- **Line Chart**: Weekly trend (8 weeks)
- **Horizontal Bar**: Subject distribution
- **Horizontal Bar**: Time of day distribution

### Touch Targets
- All interactive elements: **min 44px height**
- Buttons, filters, links: **min 44px tap area**

---

## Implementation Estimate

### Task 7: Study History Page
- **Time**: 1.5 hours
- **Components**: SessionList, SessionCard, DateGroup, EmptyState
- **Features**: Filters (date range, course), pagination, search
- **API**: Already complete ✓

### Task 9: Analytics Dashboard
- **Time**: 2 hours
- **Components**: StatCard, BarChart, LineChart, SubjectDistribution, TimeOfDayChart
- **Library**: Recharts (already installed ✓)
- **API**: Already complete ✓

### Total Effort: ~3.5 hours

---

## Recommended Approach

### Option 1: Ship Now, Iterate Later
- Mark Story 1.6 complete with 6/8 ACs
- Create follow-up Story 1.6.1: "Study History & Analytics UI"
- Implement with proper design review and UX iteration

### Option 2: Complete All Now
- Implement Tasks 7 & 9 using these wireframes
- Achieve 8/8 ACs in single story
- Risk: Rushed chart design without iteration

**My recommendation remains Option 1** - the wireframes show these are substantial features worthy of focused implementation, not rushed checkboxes.
