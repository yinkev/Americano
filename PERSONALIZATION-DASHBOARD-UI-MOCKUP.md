# Personalization Dashboard - UI Mockup Description

**Visual Reference for Story 5.5 Implementation**

---

## Page Layout Overview

```
┌────────────────────────────────────────────────────────────────────┐
│  [Sidebar]  │  Personalization Dashboard                          │
│             │                                                      │
│   Missions  │  ✨ Personalization Dashboard                       │
│   Analytics │  Track how personalization is adapting...          │
│   Library   │                                                      │
│   Settings  │  [⚙️ Show Settings] [Full Settings →]              │
│             │                                                      │
│             │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│             │  │ ✨ MEDIUM│ │ ⚡ 4 of 4│ │ 🕐 7-9 AM│ │ 📖 Visual│  │
│             │  │ Personal-│ │ Active  │ │ Mission │ │ Learning │  │
│             │  │ ization  │ │ Features│ │ Timing  │ │ Style    │  │
│             │  └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
│             │                                                      │
│             │  ┌──────────────────────────────────────────────┐  │
│             │  │  🔧 Personalization Settings (Collapsible)   │  │
│             │  │  [NONE ●──●──● HIGH]  Slider                │  │
│             │  │  ☑️ Mission Timing    ☑️ Content Recs        │  │
│             │  │  ☑️ Session Duration  ☑️ Assessment Diff     │  │
│             │  └──────────────────────────────────────────────┘  │
│             │                                                      │
│             │  ┌───────────────────────┬──────────────────────┐  │
│             │  │ EFFECTIVENESS CHART   │ ACTIVE PERSONALIZ.  │  │
│             │  │                       │                      │  │
│             │  │  [7d|14d|30d|90d]    │  ✨ Active Personaliz│  │
│             │  │                       │  Quality: 87%        │  │
│             │  │  ┌───────────────┐   │                      │  │
│             │  │  │ +15% Retention│   │  🕐 Mission Timing   │  │
│             │  │  │ +12% Perform. │   │  pattern-based       │  │
│             │  │  │ +8% Completion│   │  87% confidence      │  │
│             │  │  │ +5% Engagement│   │  [Disable]           │  │
│             │  │  └───────────────┘   │                      │  │
│             │  │                       │  📖 Content Recs     │  │
│             │  │  [Retention][Perf]   │  learning-style      │  │
│             │  │  [Completion][Eng]   │  87% confidence      │  │
│             │  │                       │  [Disable]           │  │
│             │  │  ┌─────────────┐     │                      │  │
│             │  │  │   Line Chart│     │  🎯 Assessment Diff  │  │
│             │  │  │  ╱ ╱ ╱ ╱ ╱ ╱│     │  forgetting-curve    │  │
│             │  │  │ ╱ ╱ ╱ ╱ ╱ ╱ │     │  87% confidence      │  │
│             │  │  │───────────── │     │  [Disable]           │  │
│             │  │  └─────────────┘     │                      │  │
│             │  │                       │  ⚡ Session Structure│  │
│             │  │  ℹ️ Statistical Info  │  attention-cycle     │  │
│             │  │  Sample: 234 points  │  87% confidence      │  │
│             │  │  p-value: 0.003      │  [Disable]           │  │
│             │  │  (significant)        │                      │  │
│             │  └───────────────────────┴──────────────────────┘  │
│             │                                                      │
│             │  ┌─────────────────────────────────────────────┐  │
│             │  │  📜 Personalization History                  │  │
│             │  │                                              │  │
│             │  │  [All Types ▼] [All Outcomes ▼]            │  │
│             │  │                                              │  │
│             │  │  ●───┐                                       │  │
│             │  │  │   │ 🕐 Optimal Study Time Detected       │  │
│             │  │  │   │ You consistently perform 30% better  │  │
│             │  │  │   │ during morning sessions (7-9 AM)     │  │
│             │  │  │   │ Oct 18, 2025 • 7:30 AM              │  │
│             │  │  │   └──────────────────────────────────────│  │
│             │  │  ●───┐                                       │  │
│             │  │  │   │ ⚡ Session Duration Adjusted         │  │
│             │  │  │   │ Reduced to 45 min based on patterns │  │
│             │  │  │   │ Oct 15, 2025 • 2:15 PM              │  │
│             │  │  │   └──────────────────────────────────────│  │
│             │  │  ●───┐                                       │  │
│             │  │      │ 📖 Learning Style Profile Updated    │  │
│             │  │      │ Identified as 55% visual learner     │  │
│             │  │      │ Oct 13, 2025 • 9:00 AM              │  │
│             │  │      └──────────────────────────────────────│  │
│             │  └─────────────────────────────────────────────┘  │
│             │                                                      │
│             │  ┌─────────────────────────────────────────────┐  │
│             │  │  ℹ️ How Personalization Works                │  │
│             │  │                                              │  │
│             │  │  [Data Collection] [Adaptive Recommendations]│  │
│             │  │  [Continuous Improvement] [Full Transparency]│  │
│             │  └─────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

---

## Color Scheme (OKLCH)

### Primary Colors
- **Blue (Missions):** `oklch(0.7 0.15 230)` - #5B8DEF (approx)
- **Green (Success):** `oklch(0.7 0.15 145)` - #52C992 (approx)
- **Yellow (Content):** `oklch(0.8 0.15 85)` - #E6C84D (approx)
- **Orange (Assessment):** `oklch(0.6 0.15 25)` - #D97A3B (approx)
- **Purple (Engagement):** `oklch(0.7 0.15 300)` - #B87DE8 (approx)
- **Gray (Neutral):** `oklch(0.556 0 0)` - #8E8E8E (approx)

### Usage Map
```
Mission Timing      → Blue (🕐)
Content Recs        → Yellow (📖)
Assessment Diff     → Orange (🎯)
Session Structure   → Green (⚡)
Engagement/History  → Purple (📜)
```

---

## Component Breakdown

### 1. Header Section
```
┌────────────────────────────────────────────────────────┐
│  ✨ Personalization Dashboard                         │
│  Track how personalization is adapting to your        │
│  learning patterns and improving outcomes              │
│                                                        │
│  [⚙️ Show Settings]  [Full Settings →]                │
└────────────────────────────────────────────────────────┘
```
- **Icon:** Sparkles (✨) - oklch(0.7 0.15 230)
- **Title:** text-3xl font-semibold text-gray-800
- **Description:** text-sm text-muted-foreground
- **Buttons:** Ghost/Outline variants

---

### 2. Overview Metrics (4 Cards)
```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ ✨           │  │ ⚡           │  │ 🕐           │  │ 📖           │
│ Personal...  │  │ Active       │  │ Mission      │  │ Learning     │
│              │  │ Features     │  │ Timing       │  │ Style        │
│ [MEDIUM]     │  │ [Active]     │  │              │  │              │
│              │  │              │  │              │  │              │
│ MEDIUM       │  │ 4 of 4       │  │ 7-9 AM       │  │ Visual       │
│ Standard     │  │ Personal...  │  │ Your optimal │  │ 55% visual   │
│ personaliz.  │  │ features     │  │ study window │  │ preference   │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

**Card Structure:**
- **Background:** bg-white/80 backdrop-blur-md
- **Border:** border-white/30
- **Shadow:** shadow-[0_8px_32px_rgba(31,38,135,0.1)]
- **Padding:** p-4
- **Icon container:** Colored background with 15% opacity
- **Badge:** Top-right, color-coded by level/context
- **Main value:** text-2xl font-bold text-foreground
- **Description:** text-xs text-muted-foreground

---

### 3. Settings Panel (Collapsible)
```
┌──────────────────────────────────────────────────────────┐
│  🔧 Personalization Settings                             │
│  Control how the platform adapts to your learning        │
│                                                           │
│  Personalization Level          [View Dashboard →]       │
│  [NONE ●────────●────────●────────● HIGH]                │
│  NONE    LOW    MEDIUM    HIGH                           │
│                                                           │
│  ℹ️ Standard personalization - Pattern + prediction-based │
│                                                           │
│  ───────────────────────────────────────────────────────  │
│                                                           │
│  Individual Features                                      │
│                                                           │
│  🕐 Adapt Mission Timing                         [ON]    │
│     Recommend optimal study times based on...            │
│                                                           │
│  ⚡ Adapt Session Duration                       [ON]    │
│     Adjust session length based on attention...          │
│                                                           │
│  📖 Personalize Content Recommendations          [ON]    │
│     Tailor content suggestions to your learning...       │
│                                                           │
│  🎯 Adapt Assessment Difficulty                  [ON]    │
│     Optimize question difficulty and frequency...        │
│                                                           │
│  🧠 Auto-Adjust Based on Cognitive Load          [ON]    │
│     Automatically reduce difficulty when stress...       │
│                                                           │
│  ───────────────────────────────────────────────────────  │
│                                                           │
│  Manual Overrides                                         │
│  [🔄 Reset All] [⏸️ Pause for 1 Week] [📖 Standard]     │
│                                                           │
│  ⚠️ You have unsaved changes      [Save Changes]         │
└──────────────────────────────────────────────────────────┘
```

**Slider:**
- **Component:** Shadcn Slider with 4 steps (0-3)
- **Color:** Changes based on selected level
- **Labels:** Below slider, current level bolded

**Switches:**
- **Component:** Shadcn Switch
- **Disabled:** Grayed out when level prevents feature
- **Layout:** Label left, switch right

---

### 4. Effectiveness Chart
```
┌────────────────────────────────────────────────────────┐
│  Personalization Effectiveness [Statistically Sig.]   │
│  Impact of personalization on your learning outcomes  │
│                                                        │
│                                      [Last 30 Days ▼] │
│                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐│
│  │↗️ Retention  │  │↗️ Performance│  │↗️ Completion │││
│  │ +15.3%       │  │ +12.1%       │  │ +8.7%        │││
│  └──────────────┘  └──────────────┘  └──────────────┘│││
│  ┌──────────────┐                                     │││
│  │↗️ Engagement │                                     │││
│  │ +5.2%        │                                     │││
│  └──────────────┘                                     │││
│                                                        │
│  Show: [Retention] [Performance] [Completion] [Eng.]  │
│                                                        │
│  Improvement (%)                                       │
│    20%│                                                │
│       │           ╱╲                                   │
│    10%│       ╱╲╱  ╲╱╲                                │
│       │    ╱╲╱          ╲                             │
│     0%├─────────────────────────                      │
│       │                                                │
│   -10%│                                                │
│       └──────────────────────────                      │
│        Oct 1   Oct 10   Oct 20   Oct 30               │
│                                                        │
│  ℹ️ Statistical Analysis                               │
│  Sample Size: 234 data points                         │
│  Correlation: 0.847                                    │
│  p-value: 0.0003 (significant)                        │
│                                                        │
│  The improvement is statistically significant...       │
└────────────────────────────────────────────────────────┘
```

**Chart Features:**
- **Library:** Recharts LineChart
- **Lines:** 4 metrics (toggle on/off)
- **Reference line:** Dashed at y=0
- **Tooltip:** Glass effect with % values
- **Axes:** Labeled with units
- **Time selector:** Dropdown (7d/14d/30d/90d)

---

### 5. Active Personalizations Panel
```
┌────────────────────────────────────────────────────────┐
│  ✨ Active Personalizations          Quality: 87%      │
│  4 of 4 personalization features enabled               │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │ 🕐 Mission Timing          [pattern-based] [87%] │ │
│  │                                                   │ │
│  │ Recommending missions during 7-9 AM, 2-4 PM      │ │
│  │ (45 min sessions)                                │ │
│  │                                                   │ │
│  │ ✓ Data Sources:                                  │ │
│  │   • 87 data points                               │ │
│  │   • Performance by time-of-day                   │ │
│  │   • Session completion patterns                  │ │
│  │                                        [Disable]  │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │ 📖 Content Recommendations [learning-style] [87%]│ │
│  │                                                   │ │
│  │ Prioritizing visual content (55% affinity)       │ │
│  │                                                   │ │
│  │ ✓ Data Sources:                                  │ │
│  │   • VARK learning style profile                  │ │
│  │   • Content interaction patterns                 │ │
│  │   • Engagement metrics                           │ │
│  │                                        [Disable]  │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  [... Assessment Difficulty ...]                      │
│  [... Session Structure ...]                          │
│                                                        │
│  Last analyzed Oct 20, 2025 at 9:00 AM                │
│                                                        │
│  🧠 Transparent Personalization                        │
│  We show you exactly how we're personalizing...       │
└────────────────────────────────────────────────────────┘
```

**Card per Personalization:**
- **Icon + Title:** Context-colored
- **Strategy badge:** Secondary badge with strategy name
- **Confidence badge:** Green badge with %
- **Explanation:** Plain text description
- **Data sources:** Checkmark + bulleted list
- **Disable button:** Ghost variant

---

### 6. History Timeline
```
┌────────────────────────────────────────────────────────┐
│  📜 Personalization History                            │
│  Timeline of personalization events and adaptations   │
│                                                        │
│                       [All Types ▼] [All Outcomes ▼]  │
│                                                        │
│  │                                                     │
│  ●───┐                                                 │
│  │   │ 🕐 Optimal Study Time Detected     [Positive] │ │
│  │   │                                                │ │
│  │   │ You consistently perform 30% better during    │ │
│  │   │ morning sessions (7-9 AM)                     │ │
│  │   │                                                │ │
│  │   │ performanceIncrease: 30  timeWindow: 7-9 AM   │ │
│  │   │                                                │ │
│  │   │ 🕐 Oct 18, 2025, 7:30 AM • Pattern detected   │ │
│  │   └────────────────────────────────────────────── │ │
│  │                                                     │
│  ●───┐                                                 │
│  │   │ ⚡ Session Duration Adjusted        [Positive] │ │
│  │   │                                                │ │
│  │   │ Reduced recommended session length to 45 min  │ │
│  │   │ based on attention patterns                   │ │
│  │   │                                                │ │
│  │   │ previousDuration: 60  newDuration: 45         │ │
│  │   │                                                │ │
│  │   │ 🕐 Oct 15, 2025, 2:15 PM • Recommendation     │ │
│  │   └────────────────────────────────────────────── │ │
│  │                                                     │
│  ●───┐                                                 │
│      │ ... more events ...                            │
│                                                        │
│  Showing 6 of 6 events                                 │
└────────────────────────────────────────────────────────┘
```

**Timeline Structure:**
- **Vertical line:** Absolute positioned, left-8
- **Dots:** 20px circle with 4px white border
- **Event cards:** Left padding 80px (pl-20)
- **Icon:** Context-colored in top-left
- **Outcome badge:** Top-right with icon
- **Metadata:** Secondary badges
- **Timestamp:** Small text with clock icon

---

## Mobile Layout (320px-640px)

### Stack Order (Top to Bottom)
1. Header + Overview Metrics (single column)
2. Settings Panel (full width, collapsible)
3. Effectiveness Chart (full width, horizontal scroll if needed)
4. Active Personalizations (single column stack)
5. History Timeline (single column, horizontal timestamp scroll)
6. Info Footer

### Key Adaptations
- **Grid:** All grids become single column
- **Buttons:** Full width on mobile
- **Selects:** Full width dropdowns
- **Timeline:** Reduced left padding (pl-16 instead of pl-20)
- **Chart:** Maintains aspect ratio, horizontal scroll if needed

---

## Accessibility Features

### ARIA Labels
- All switches: `aria-label="Enable mission personalization"`
- Chart: `title="Line chart showing retention improvements"`
- Timeline events: `role="list"`, each event `role="listitem"`

### Keyboard Navigation
- Tab order: Header → Overview → Settings → Chart filters → Timeline filters
- Enter/Space: Activate switches, buttons, selects
- Arrow keys: Navigate slider (personalization level)

### Screen Reader Announcements
- State changes: "Mission personalization enabled"
- Loading: "Loading effectiveness data..."
- Errors: "Failed to save preferences. Please try again."

---

## Empty States

### No Personalization Data
```
┌────────────────────────────────────────────┐
│                                            │
│               ℹ️ (large icon)             │
│                                            │
│  No personalization data available yet     │
│                                            │
│  Complete 6+ weeks of study to enable      │
│  personalization                           │
│                                            │
└────────────────────────────────────────────┘
```

### No Events (Timeline Filter)
```
┌────────────────────────────────────────────┐
│                                            │
│               🔍 (filter icon)             │
│                                            │
│  No events match the selected filters      │
│                                            │
│             [Clear Filters]                │
│                                            │
└────────────────────────────────────────────┘
```

---

## Animation/Transitions

### Settings Panel Expand/Collapse
```typescript
className="animate-in slide-in-from-top-4 duration-300"
```

### Card Hover Effects
```typescript
className="transition-all hover:shadow-md"
```

### Switch Toggle
```typescript
// Built-in Radix UI animation
```

### Chart Line Drawing
```typescript
// Recharts built-in animation on mount
```

---

**End of Mockup Description**
**For full implementation details, see: STORY-5.5-PERSONALIZATION-DASHBOARD-IMPLEMENTATION.md**
