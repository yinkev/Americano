# Story 4.5 Task 10 - Testing & Integration Guide

## Quick Start

### 1. View the Dashboard
Navigate to: `http://localhost:3000/progress/adaptive-questioning` (or `http://localhost:3001` for Epic 4 worktree)

### 2. Expected API Endpoint

The dashboard expects this endpoint to exist:

```
GET /api/adaptive/analytics?dateRange={7days|30days|90days}
```

**Response Schema:**
```typescript
{
  data: {
    // Line chart data
    difficultyTrajectory: [
      { questionNumber: 1, difficulty: 45, score: 72 },
      { questionNumber: 2, difficulty: 60, score: 85 },
      // ...
    ],

    // Scatter plot data
    performanceData: [
      {
        difficulty: 45,
        score: 72,
        conceptName: "Cardiac Physiology",
        date: "2025-10-15"
      },
      // ...
    ],

    // IRT estimate
    irtEstimate: {
      theta: 0.5,           // -3 to +3 scale
      confidenceInterval: 8, // ±X points at 95% CI
      iterations: 4
    } | null,

    // Mastery criteria checklist
    masteryCriteria: [
      {
        id: "consecutive-high-scores",
        label: "3 Consecutive High Scores",
        description: "Score > 80% on 3 consecutive assessments",
        completed: true
      },
      {
        id: "time-spaced",
        label: "Time-Spaced Learning",
        description: "Assessments spread across ≥ 2 days",
        completed: false
      },
      // ... (5 total)
    ],

    // Session history table
    sessionHistory: [
      {
        id: "resp_123",
        questionNumber: 1,
        conceptName: "Cardiac Physiology",
        difficulty: 45,
        score: 72,
        timeSpent: 125,  // seconds
        date: "2025-10-15 14:30"
      },
      // ...
    ],

    // Efficiency metrics
    efficiencyMetrics: {
      questionsAsked: 4,
      baselineQuestions: 15,
      questionsSaved: 11,
      efficiencyPercentage: 73,
      timeSavedMinutes: 22
    } | null,

    // Skill tree
    skillTree: [
      {
        level: "BASIC",
        progress: 100,
        mastered: true,
        unlocked: true
      },
      {
        level: "INTERMEDIATE",
        progress: 45,
        mastered: false,
        unlocked: true
      },
      {
        level: "ADVANCED",
        progress: 0,
        mastered: false,
        unlocked: false
      }
    ]
  }
}
```

---

## Testing Scenarios

### Scenario 1: New User (No Data)
**Expected:** Empty states with helpful messages
- "Start answering questions to track your mastery progress"
- "Complete assessments to unlock higher complexity levels"
- IRT estimate shows "Not enough data"

### Scenario 2: In-Progress User
**Expected:** Partial data displays
- Some mastery criteria completed, some not
- BASIC mastered, INTERMEDIATE in progress, ADVANCED locked
- Charts show limited data points (1-3)

### Scenario 3: Advanced User
**Expected:** Full dashboard population
- All 5 mastery criteria completed (gold celebration message)
- All 3 skill levels unlocked
- Rich charts with 10+ data points
- High efficiency score (70%+)

---

## Visual Verification Checklist

### Design System
- [ ] **NO gradients anywhere** (critical!)
- [ ] All colors in OKLCH format (check dev tools)
- [ ] Glassmorphism on all cards:
  - [ ] `bg-white/95`
  - [ ] `backdrop-blur-xl`
  - [ ] `border border-white/30`
  - [ ] `shadow-[0_8px_32px_rgba(31,38,135,0.1)]`

### Charts
- [ ] Line chart renders with dual lines (difficulty + score)
- [ ] Scatter plot shows target zone (60-80% horizontal lines)
- [ ] Bar chart shows baseline vs adaptive comparison
- [ ] All charts responsive (resize window to test)
- [ ] Tooltips appear on hover with glassmorphism styling

### Components
- [ ] Key metrics cards show correct data
- [ ] Mastery checklist has checkmarks/X icons
- [ ] Skill tree shows progression with connecting lines
- [ ] Session history table scrollable (if > 10 rows)
- [ ] Efficiency metrics show bar chart + text cards

### Interactions
- [ ] Date range filter buttons toggle correctly
- [ ] Filter panel expands/collapses
- [ ] Table rows highlight on hover
- [ ] Charts are responsive to data changes
- [ ] Loading spinner appears before data loads

### Accessibility
- [ ] All buttons have min 44px height
- [ ] ARIA labels present (check with screen reader)
- [ ] Keyboard navigation works (Tab through elements)
- [ ] Color contrast passes WCAG AA (use browser extension)

---

## Integration Steps

### Step 1: API Endpoint
Create `/apps/web/src/app/api/adaptive/analytics/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    const searchParams = request.nextUrl.searchParams;
    const dateRange = searchParams.get('dateRange') || '30days';

    // Calculate date cutoff
    const days = dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Query adaptive sessions and responses
    const sessions = await prisma.adaptiveSession.findMany({
      where: {
        userId,
        createdAt: { gte: cutoffDate }
      },
      include: {
        /* ... include related data ... */
      }
    });

    // Transform data for charts
    const data = {
      difficultyTrajectory: /* ... */,
      performanceData: /* ... */,
      irtEstimate: /* ... */,
      masteryCriteria: /* ... */,
      sessionHistory: /* ... */,
      efficiencyMetrics: /* ... */,
      skillTree: /* ... */
    };

    return NextResponse.json(successResponse(data));
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(errorResponse(error), { status: 500 });
  }
}
```

### Step 2: Navigation Link
Add to sidebar (`/apps/web/src/components/app-sidebar.tsx`):

```tsx
<SidebarMenuItem>
  <SidebarMenuButton asChild>
    <a href="/progress/adaptive-questioning">
      <TrendingUp className="w-4 h-4" />
      <span>Adaptive Analytics</span>
    </a>
  </SidebarMenuButton>
</SidebarMenuItem>
```

### Step 3: Database Verification
Ensure Prisma schema has required fields:

```prisma
model AdaptiveSession {
  id                  String   @id @default(cuid())
  userId              String
  sessionId           String?
  initialDifficulty   Int
  currentDifficulty   Int
  questionCount       Int      @default(0)
  trajectory          Json?    // Array of difficulty adjustments
  irtEstimate         Float?
  confidenceInterval  Float?
  createdAt           DateTime @default(now())
  // ...
}

model ValidationResponse {
  id              String   @id @default(cuid())
  userId          String
  promptId        String
  score           Float    // 0-1 or 0-100
  timeToRespond   Int?     // seconds
  respondedAt     DateTime @default(now())
  // ...
}

model MasteryVerification {
  id                    String   @id @default(cuid())
  userId                String
  objectiveId           String
  status                MasteryStatus @default(NOT_STARTED)
  verifiedAt            DateTime?
  verificationCriteria  Json?
  // ...
}

enum MasteryStatus {
  VERIFIED
  IN_PROGRESS
  NOT_STARTED
}
```

### Step 4: Test Data Seeding
Create sample data for testing:

```typescript
// apps/web/prisma/seed-adaptive-analytics.ts
import { prisma } from '../src/lib/db';

async function seedAdaptiveAnalytics() {
  const userId = 'test-user-id'; // or getUserId()

  // Create adaptive session
  const session = await prisma.adaptiveSession.create({
    data: {
      userId,
      initialDifficulty: 50,
      currentDifficulty: 65,
      questionCount: 4,
      trajectory: [
        { questionNumber: 1, oldDifficulty: 50, newDifficulty: 50, adjustment: 0 },
        { questionNumber: 2, oldDifficulty: 50, newDifficulty: 65, adjustment: 15 },
        { questionNumber: 3, oldDifficulty: 65, newDifficulty: 60, adjustment: -5 },
        { questionNumber: 4, oldDifficulty: 60, newDifficulty: 75, adjustment: 15 },
      ],
      irtEstimate: 0.5,
      confidenceInterval: 8
    }
  });

  // Create validation responses
  for (let i = 1; i <= 4; i++) {
    await prisma.validationResponse.create({
      data: {
        userId,
        promptId: `prompt-${i}`,
        score: 70 + Math.random() * 20, // 70-90%
        timeToRespond: 60 + Math.floor(Math.random() * 120), // 60-180s
        respondedAt: new Date(Date.now() - (4 - i) * 3600000) // 1 hour apart
      }
    });
  }

  console.log('✅ Adaptive analytics seed data created');
}

seedAdaptiveAnalytics();
```

Run: `npx tsx prisma/seed-adaptive-analytics.ts`

---

## Troubleshooting

### Dashboard shows only loading spinner
**Cause:** API endpoint not implemented or returning error
**Fix:** Check browser console for error, verify endpoint exists

### Charts not rendering
**Cause:** Data format mismatch or missing Recharts components
**Fix:** Verify API response matches expected schema exactly

### Glassmorphism not visible
**Cause:** Browser doesn't support backdrop-filter or CSS not applied
**Fix:** Test in Chrome/Firefox/Safari (not IE), check Tailwind CSS config

### Empty states showing with data
**Cause:** Array length checks failing (e.g., `array.length === 0`)
**Fix:** Verify arrays in API response are not null/undefined

### OKLCH colors not working
**Cause:** Browser compatibility (Safari < 15.4, old browsers)
**Fix:** Add fallback colors or polyfill for older browsers

---

## Performance Optimization

### Current Performance Targets
- Page load: < 2s
- API response: < 500ms
- Chart render: < 200ms

### If Slow:
1. **Paginate session history** (show 10, load more button)
2. **Cache API response** (5-minute TTL)
3. **Lazy load charts** (intersection observer)
4. **Reduce data points** (sample every Nth point for line chart)

---

## Accessibility Testing

### Tools:
- **axe DevTools** (browser extension)
- **WAVE** (web accessibility evaluation)
- **Screen reader** (VoiceOver on Mac, NVDA on Windows)

### Key Tests:
1. Navigate entire page with keyboard only (no mouse)
2. Use screen reader to read all content
3. Check color contrast ratios (4.5:1 minimum)
4. Verify all interactive elements have focus states

---

## Browser Compatibility

### Tested:
- ✅ Chrome 120+
- ✅ Firefox 120+
- ✅ Safari 17+
- ✅ Edge 120+

### Known Issues:
- OKLCH colors may not work in Safari < 15.4 (add fallback)
- backdrop-filter not supported in IE11 (unsupported browser)

---

## Next Steps After Testing

1. **Gather Feedback:** Share with medical students for UX feedback
2. **Performance Monitoring:** Add analytics to track page views and load times
3. **A/B Testing:** Test different chart types (e.g., area chart vs line chart)
4. **Mobile Optimization:** Test on tablet/phone, may need touch-friendly adjustments
5. **Export Feature:** Add "Export to PDF" button for study records

---

## Support

**Questions?** Check Story 4.5 documentation:
- `/docs/stories/story-4.5.md`
- `/docs/stories/story-context-4.5.xml`

**Bugs?** File issue with:
- Screenshot of problem
- Browser and version
- Console error logs
- Steps to reproduce

---

**Happy Testing!** 🚀
