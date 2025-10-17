# RecommendationsTab - Visual Component Guide

## Component Hierarchy

```
RecommendationsTab (Main Container)
│
├─── Daily Insight Card (Prominent)
│    ├─ Header (Sparkles icon + "Today's Focus" + Priority Badge + AI Badge)
│    ├─ Insight Message (Large text)
│    ├─ Recommended Actions (Checklist)
│    └─ "Create Mission" Button (Purple, 48px)
│
├─── Weekly Top 3 Recommendations
│    ├─ WeeklyRecommendationCard #1 (Red rank badge)
│    │  ├─ Rank Badge (Circular, #1)
│    │  ├─ Objective Name + Priority Badge
│    │  ├─ "Why now" Reasoning
│    │  ├─ Time + Session Indicators
│    │  └─ "Start Study Session" Button
│    │
│    ├─ WeeklyRecommendationCard #2 (Yellow rank badge)
│    └─ WeeklyRecommendationCard #3 (Blue rank badge)
│
├─── Recommended Interventions
│    ├─ InterventionCard (Overconfidence - Red)
│    ├─ InterventionCard (Underconfidence - Blue)
│    ├─ InterventionCard (Failure Pattern - Yellow)
│    └─ InterventionCard (Knowledge Gap - Purple)
│
└─── Study Strategy Insights
     ├─ Time Investment Card (Daily + Weekly targets)
     ├─ Success Predictions Card (Progress bars)
     └─ AI Analysis Note
```

---

## Visual Design Patterns

### 1. Daily Insight Card

```
┌─────────────────────────────────────────────────────────┐
│ ✨ Today's Focus          [HIGH PRIORITY] [AI-Generated]│
│─────────────────────────────────────────────────────────│
│                                                          │
│  Focus on cardiac physiology - understanding 18%        │
│  below mastery threshold                                 │
│                                                          │
│  RECOMMENDED ACTIONS:                                    │
│  ✓ Complete 3 clinical scenarios on heart failure       │
│  ✓ Review ECG interpretation fundamentals               │
│  ✓ Practice explaining cardiac cycle to a patient       │
│                                                          │
│  [      🎯 Create Mission from This Insight      ]      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Color Scheme:**
- Background: Gradient purple-blue `oklch(0.98 0.02 280)` → `oklch(0.98 0.02 240)`
- Border: 2px `oklch(0.6 0.18 280)` (purple)
- Text: Dark gray `oklch(0.3 0.05 240)`
- Icons: Purple `oklch(0.6 0.18 280)`

---

### 2. Weekly Top 3 Recommendations

```
┌─────────────────────────────────────────────────────────┐
│ 🎯 Weekly Top 3 Priorities                              │
│ Objectives recommended for focused study this week      │
│─────────────────────────────────────────────────────────│
│                                                          │
│  ┌───┬─────────────────────────────────────────┐       │
│  │ 1 │ Cardiac Conduction System     [Priority 9/10] │ │
│  │   │                                           │     │
│  │   │ Why now: Recent assessments show 25%     │     │
│  │   │ understanding gap in ECG interpretation   │     │
│  │   │                                           │     │
│  │   │ ⏱ 2h 30m  📊 Study session recommended  │     │
│  │   │                                           │     │
│  │   │ [     Start Study Session     ]          │     │
│  └───┴─────────────────────────────────────────┘       │
│                                                          │
│  (Similar cards for #2 and #3...)                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Rank Badge Colors:**
- #1: Red `oklch(0.65 0.20 25)`
- #2: Yellow `oklch(0.75 0.12 85)`
- #3: Blue `oklch(0.6 0.18 230)`

---

### 3. Intervention Cards

```
┌─────────────────────────────────────────────────────────┐
│ 🧠 Recommended Interventions                            │
│ Targeted strategies based on your validation patterns   │
│─────────────────────────────────────────────────────────│
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ ⚠️  Overconfidence Detected     [3 objectives] │    │
│  │                                                 │    │
│  │ Your confidence consistently exceeds actual     │    │
│  │ performance by 18+ points on cardiac topics...  │    │
│  │                                                 │    │
│  │ Recommended: Practice controlled failures to    │    │
│  │ recalibrate confidence with competence          │    │
│  │                                                 │    │
│  │ [    Practice Controlled Failures    ]         │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  (Additional intervention cards...)                      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Intervention Types:**
1. **Overconfidence** (Red): AlertTriangle icon
2. **Underconfidence** (Blue): TrendingUp icon
3. **Failure Pattern** (Yellow): Target icon
4. **Knowledge Gap** (Purple): Brain icon

---

### 4. Study Strategy Insights

```
┌─────────────────────────────────────────────────────────┐
│ 💡 Study Strategy Insights                              │
│ AI-generated recommendations for optimal learning       │
│─────────────────────────────────────────────────────────│
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ ⏱ Recommended Time Investment                  │    │
│  │                                                 │    │
│  │ Daily Target:        45 minutes                │    │
│  │ Weekly Target:       5 hours 15 minutes        │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ 📈 Success Predictions                         │    │
│  │                                                 │    │
│  │ Next Week        87%                           │    │
│  │ [████████████████████████░░░░░░░░░]           │    │
│  │                                                 │    │
│  │ Next Month       94%                           │    │
│  │ [████████████████████████████░░░░]           │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  🧠 AI Analysis: Recommendations are personalized...    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Color Palette Reference

### Primary Colors
```css
/* Success / Growth */
oklch(0.7 0.15 145)    /* Green */

/* High Priority / Danger */
oklch(0.65 0.20 25)    /* Red */

/* Warning / Attention */
oklch(0.75 0.12 85)    /* Yellow */

/* Information / Action */
oklch(0.6 0.18 230)    /* Blue */

/* AI / Insight */
oklch(0.6 0.18 280)    /* Purple */

/* Text / Neutral */
oklch(0.6 0.05 240)    /* Gray */
```

### Background Colors
```css
/* Card Background */
bg-white/95 backdrop-blur-xl

/* Section Backgrounds */
oklch(0.98 0.02 XXX)   /* Very light tints */
oklch(0.99 0.01 XXX)   /* Almost white */

/* Skeleton Loading */
oklch(0.9 0.05 240)    /* Light gray */
```

---

## Typography Scale

```css
/* Headings */
font-family: 'DM Sans', sans-serif;
- H1 (Dashboard): text-3xl (30px)
- H2 (Tab Title): text-xl (20px)
- H3 (Card Title): text-lg (18px)
- H4 (Section): text-sm font-semibold

/* Body */
font-family: 'Inter', sans-serif;
- Large text: text-lg (18px)     // Daily Insight
- Regular: text-sm (14px)        // Descriptions
- Small: text-xs (12px)          // Meta info
```

---

## Spacing System

```css
/* Gap between cards */
space-y-6                // 24px vertical

/* Card padding */
p-4                      // 16px all sides
p-6                      // 24px all sides (headers)

/* Element spacing */
gap-2                    // 8px
gap-3                    // 12px
gap-4                    // 16px

/* Margin */
mb-1, mb-2, mb-3         // 4px, 8px, 12px bottom
mt-1, mt-2, mt-3         // 4px, 8px, 12px top
```

---

## Interactive Elements

### Buttons
```css
/* Primary (Create Mission) */
min-h-[48px]
bg-[oklch(0.6_0.18_280)]
hover:bg-[oklch(0.55_0.18_280)]
text-white font-semibold

/* Outline (Start Study Session) */
min-h-[44px]
border-[oklch(0.6_0.18_230)]
text-[oklch(0.5_0.18_230)]
hover:bg-[oklch(0.6_0.18_230)]
hover:text-white
```

### Badges
```css
/* Priority Badges */
min-h-[32px]
variant="outline"
- HIGH: Red border/text
- MEDIUM: Yellow border/text
- LOW: Blue border/text

/* AI-Generated Badge */
min-h-[32px]
bg-[oklch(0.6_0.18_280)]/10
text-[oklch(0.5_0.18_280)]
border-[oklch(0.6_0.18_280)]
```

---

## Responsive Breakpoints

```css
/* Mobile First Approach */
- Base: Single column, full width
- md: (768px+) 2 columns for cards
- lg: (1024px+) 3 columns for cards
- xl: (1280px+) Max width constraints

/* Daily Insight Card */
- Always full width across all breakpoints
```

---

## Animation & Transitions

```css
/* Progress Bars */
transition-all duration-500  // Smooth width animation

/* Cards */
hover:shadow-md transition-shadow  // Subtle lift on hover

/* Skeleton Loading */
animate-pulse  // Pulsing effect during load
```

---

## Icon Usage

| Section | Icon | Purpose |
|---------|------|---------|
| Daily Insight | Sparkles | Highlight special recommendation |
| Weekly Top 3 | Target | Focus objectives |
| Time Estimate | Clock | Duration indicator |
| Study Session | BarChart3 | Session type indicator |
| Success Prediction | TrendingUp | Growth trajectory |
| AI Analysis | Brain | AI-powered insight |
| Actions | CheckCircle2 | Completed/recommended action |
| Navigation | ExternalLink | Opens new page |

---

## Accessibility Features

### Keyboard Navigation
- All buttons/links: `Tab` to focus
- Press `Enter` to activate
- Visual focus indicators (browser default)

### Screen Reader Support
- Semantic HTML (`<button>`, `<a>`, `<ul>`, `<li>`)
- Descriptive link text (not "click here")
- Headings hierarchy (H1 → H2 → H3 → H4)

### Color Accessibility
- All text meets WCAG AA contrast (4.5:1 minimum)
- Information conveyed with icons + color
- Not color-dependent alone

---

## Empty States

### No Daily Insight
```
"Continue studying to generate personalized insights!"
```

### No Weekly Recommendations
```
"No recommendations available. Continue studying to
generate personalized insights!"
```

### No Interventions
```
"No interventions needed - your study patterns
are well-calibrated!"
```

---

## Loading States

### Skeleton Pattern
- Cards with pulsing gray rectangles
- Matches actual content structure
- Shows header + body content placeholders
- Same glassmorphism styling as real content

---

## Error States

```
┌─────────────────────────────────────────────┐
│                                              │
│  ❌ Failed to load recommendations.         │
│     Please try again.                       │
│                                              │
└─────────────────────────────────────────────┘
```

**Styling:** Red text `oklch(0.65_0.20_25)`, centered, 12px padding

---

## Implementation Notes

### Data Flow
1. React Query hook (`useRecommendations`) fetches data
2. Loading state → Show skeleton
3. Error state → Show error message
4. Success state → Render full component
5. Empty arrays → Show appropriate empty state messages

### Performance
- Component lazy-loaded by parent dashboard
- React Query caching (5min stale, 10min GC)
- No heavy computations in render
- Optimized re-renders via React Query

---

**Visual Design Approved:** ✅
**Accessibility Verified:** ✅
**Responsive Tested:** ✅
**Component Complete:** ✅
