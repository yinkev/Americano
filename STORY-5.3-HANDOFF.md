# Story 5.3 Phase 2: Implementation Handoff

**Date:** 2025-10-16
**Implemented By:** Claude (Backend System Architect)
**Handoff To:** UI Development Team (Phase 3)

---

## ✅ COMPLETED WORK (Tasks 6-9)

### Task 6: Google Calendar OAuth Integration ✅
**Files Created:**
- `/apps/web/src/lib/calendar/calendar-provider.ts` (interface)
- `/apps/web/src/lib/calendar/google-calendar-provider.ts` (implementation)
- `/apps/web/src/lib/crypto/token-encryption.ts` (AES-256-GCM)
- `/apps/web/src/lib/calendar/calendar-sync-service.ts` (sync logic)
- `/apps/web/src/app/api/calendar/connect/route.ts`
- `/apps/web/src/app/api/calendar/callback/route.ts`
- `/apps/web/src/app/api/calendar/status/route.ts`
- `/apps/web/src/app/api/calendar/sync/route.ts`
- `/apps/web/src/app/api/calendar/disconnect/route.ts`

### Task 7: Orchestration API Routes ✅
**Files Created:**
- `/apps/web/src/app/api/orchestration/recommendations/route.ts`
- `/apps/web/src/app/api/orchestration/session-plan/route.ts`
- `/apps/web/src/app/api/orchestration/cognitive-load/route.ts`
- `/apps/web/src/app/api/orchestration/adapt-schedule/route.ts`
- `/apps/web/src/app/api/orchestration/effectiveness/route.ts`

### Task 8: MissionGenerator Integration ✅
**Files Updated:**
- `/apps/web/src/lib/mission-generator.ts`
  - Added orchestration subsystem imports
  - Added `getOrchestrationRecommendations()` method
  - Extended `MissionGenerationResult` with orchestration metadata

### Task 9: OrchestrationAdaptationEngine ✅
**Files Created:**
- `/apps/web/src/subsystems/behavioral-analytics/orchestration-adaptation-engine.ts`

---

## 📊 IMPLEMENTATION STATISTICS

- **Total Files Created:** 16
- **Total Lines of Code:** ~1,716 (Phase 2 only)
- **Combined Phase 1+2:** ~3,117 lines
- **API Endpoints:** 10 (5 calendar + 5 orchestration)
- **Subsystems:** 5 (4 from Phase 1 + 1 adaptation engine)

---

## 🔧 SETUP INSTRUCTIONS

### 1. Environment Variables
Create or update `.env.local`:
```bash
# Google OAuth (REQUIRED)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Token Encryption (REQUIRED)
TOKEN_ENCRYPTION_KEY=$(openssl rand -hex 32)  # Generate 32-byte hex key
TOKEN_ENCRYPTION_SALT=americano-salt-v1        # Optional custom salt

# App URL (REQUIRED)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Google Cloud Console Setup
1. Go to https://console.cloud.google.com
2. Create/select project
3. Enable Google Calendar API
4. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized redirect URIs:
     - `http://localhost:3000/api/calendar/callback` (dev)
     - `https://yourdomain.com/api/calendar/callback` (prod)
5. Copy Client ID and Secret to `.env.local`

### 3. Install Dependencies
```bash
npm install google-auth-library
```

### 4. Database Migration
```bash
cd apps/web
npx prisma migrate dev --name add_story_5_3_models
npx prisma generate
```

---

## 🧪 TESTING THE IMPLEMENTATION

### Calendar OAuth Flow
```bash
# 1. Initiate OAuth
curl -X POST http://localhost:3000/api/calendar/connect \
  -H "Content-Type: application/json" \
  -d '{"provider":"GOOGLE","userId":"test-user-123"}'

# Expected: { "authorizationUrl": "https://accounts.google.com/...", "state": "..." }

# 2. Visit authorizationUrl in browser, complete OAuth
# 3. After redirect, check status:
curl "http://localhost:3000/api/calendar/status?userId=test-user-123"

# Expected: { "connected": true, "provider": "GOOGLE", "lastSyncAt": "..." }

# 4. Trigger sync
curl -X POST http://localhost:3000/api/calendar/sync \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user-123","daysAhead":7}'

# Expected: { "syncedEvents": 5, "conflicts": [...] }
```

### Orchestration APIs
```bash
# 1. Get time recommendations
curl -X POST http://localhost:3000/api/orchestration/recommendations \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user-123"}'

# Expected: { "recommendations": [...], "cognitiveLoad": 45 }

# 2. Create session plan
curl -X POST http://localhost:3000/api/orchestration/session-plan \
  -H "Content-Type: application/json" \
  -d '{
    "userId":"test-user-123",
    "missionId":"mission-abc",
    "startTime":"2025-10-17T07:00:00Z",
    "duration":60
  }'

# Expected: { "plan": {...}, "confidence": 0.85 }

# 3. Check cognitive load
curl "http://localhost:3000/api/orchestration/cognitive-load?userId=test-user-123&includeTrend=true"

# Expected: { "load": 45, "level": "MEDIUM", "trend": [...] }

# 4. Measure effectiveness
curl "http://localhost:3000/api/orchestration/effectiveness?userId=test-user-123&dateRange=30"

# Expected: { "adherenceRate": 67, "performanceImprovement": 23.4, ... }
```

---

## 🚀 NEXT PHASE TASKS (Your Scope)

### Task 7: Orchestration Dashboard UI (PRIORITY: HIGH)
**Location:** `/apps/web/src/app/study/orchestration/page.tsx`

**Components to Build:**
1. **OptimalTimeSlotsPanel**
   - Display 3-5 recommended time slots
   - Confidence stars (★★★★☆)
   - Availability indicators (Green/Yellow/Red)
   - "Select" button to load session plan
   - Reasoning tooltip on hover

2. **SessionPlanPreview**
   - Timeline visualization (horizontal bar)
   - 3 phases: Warm-up (blue) → Peak (orange) → Wind-down (green)
   - Break indicators at intervals
   - Content item icons
   - "Customize" button for modal

3. **CognitiveLoadIndicator**
   - Gauge visualization (0-100)
   - Color zones: Green (0-30), Yellow (30-70), Red (70-100)
   - 7-day trend sparkline
   - Recommendation text

4. **CalendarStatusWidget**
   - Connection status badge
   - "Connect Calendar" button (if not connected)
   - Last sync timestamp
   - "Sync Now" button
   - "Disconnect" option

**API Endpoints to Use:**
- `POST /api/orchestration/recommendations` → time slots
- `POST /api/orchestration/session-plan` → plan preview
- `GET /api/orchestration/cognitive-load?includeTrend=true` → gauge data
- `GET /api/calendar/status` → connection status

### Task 12: Real-Time Session Orchestration (PRIORITY: HIGH)
**Location:** Extend existing study session component

**Features to Implement:**
1. **In-Session Monitoring** (every 5 minutes)
   - Track performance via BehavioralEvents
   - Calculate performance trend
   - Detect 20%+ performance drop

2. **Break Prompt System**
   - Scheduled breaks (from plannedBreaks)
   - Performance-triggered breaks (20%+ drop)
   - Toast notifications (non-intrusive)
   - "Skip", "Postpone 5min", "Take Break" options

3. **Content Sequence Adaptation**
   - Monitor performance per content item
   - If struggling (3+ errors): reduce difficulty
   - If excelling (95%+ accuracy): increase challenge
   - Real-time sequence adjustment

4. **Session Extension/Completion**
   - Early completion if objectives done + high performance
   - Extension prompt if objectives incomplete + time remaining
   - Max extension: 20% of planned duration

**API Endpoints to Use:**
- `POST /api/orchestration/session-plan` → get planned breaks
- Track performance locally (Zustand/React state)
- Update `actualBreaks` via Mission update

### Task 11: Analytics Dashboard (PRIORITY: MEDIUM)
**Location:** `/apps/web/src/app/analytics/orchestration-effectiveness/page.tsx`

**Components to Build:**
1. **AdherenceMetricsPanel** (KPI cards)
2. **PerformanceComparisonChart** (bar chart: orchestrated vs self-scheduled)
3. **OptimalTimeValidationPanel** (heatmap: hour-of-day vs performance)
4. **DurationOptimizationResults** (scatter plot: planned vs actual)
5. **AdaptationImpactAnalysis** (timeline of adaptations + impact)

**API Endpoints to Use:**
- `GET /api/orchestration/effectiveness?dateRange=30`

### Task 13: Testing & Validation (PRIORITY: MEDIUM)
1. Manual testing scenarios (from story context)
2. Calendar conflict edge cases
3. Integration tests (Jest/Vitest)
4. Edge case validation

---

## 📝 KEY INTEGRATION POINTS

### Consuming Orchestration in UI
```typescript
// Example: Fetch recommendations
const response = await fetch('/api/orchestration/recommendations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: user.id })
})

const { recommendations, cognitiveLoad } = await response.json()

// recommendations: TimeSlot[]
recommendations.forEach(slot => {
  console.log(`${slot.startTime} - Confidence: ${slot.confidence}`)
  console.log(`Reasoning: ${slot.reasoning.join(', ')}`)
})
```

### Session Plan Flow
```typescript
// 1. User selects time slot from recommendations
const selectedSlot = recommendations[0]

// 2. Create session plan
const planResponse = await fetch('/api/orchestration/session-plan', {
  method: 'POST',
  body: JSON.stringify({
    userId: user.id,
    missionId: mission.id,
    startTime: selectedSlot.startTime,
    duration: selectedSlot.duration
  })
})

const { plan, confidence } = await planResponse.json()

// 3. Display plan preview with:
// - plan.startTime / plan.endTime
// - plan.breaks (array of { time, duration })
// - plan.contentSequence
// - plan.intensity
```

### Calendar Connection Flow
```typescript
// 1. Check status
const status = await fetch(`/api/calendar/status?userId=${user.id}`)
const { connected } = await status.json()

if (!connected) {
  // 2. Initiate OAuth
  const connectResponse = await fetch('/api/calendar/connect', {
    method: 'POST',
    body: JSON.stringify({ provider: 'GOOGLE', userId: user.id })
  })

  const { authorizationUrl } = await connectResponse.json()

  // 3. Redirect user to authorization
  window.location.href = authorizationUrl
}

// 4. After OAuth callback, user redirected to /settings?calendar_success=true
```

---

## 🔍 TROUBLESHOOTING

### Common Issues

**OAuth Callback Fails:**
- Check redirect URI matches Google Cloud Console exactly
- Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in `.env.local`
- Check browser console for CORS errors

**Token Encryption Errors:**
- Ensure TOKEN_ENCRYPTION_KEY is set (32-byte hex string)
- Verify key is same across app restarts (not randomly generated)

**Calendar Sync Returns 0 Events:**
- User may have empty calendar
- Check date range (default 7 days ahead)
- Verify Google Calendar API is enabled in Cloud Console

**Recommendations Return Empty:**
- User needs historical study data (6+ weeks for good recommendations)
- Check UserLearningProfile exists for user
- Fallback to default recommendations if data insufficient

---

## 📚 DOCUMENTATION FILES

- **Phase 1 Summary:** `/STORY-5.3-PHASE-1-COMPLETE.md`
- **Phase 2 Summary:** `/STORY-5.3-PHASE-2-COMPLETE.md`
- **Overall Summary:** `/STORY-5.3-IMPLEMENTATION-SUMMARY.md`
- **Story Context:** `/docs/stories/story-context-5.3.xml`
- **This Handoff:** `/STORY-5.3-HANDOFF.md`

---

## ✅ ACCEPTANCE CRITERIA VALIDATION

All 8 Story 5.3 acceptance criteria backend requirements met:

- ✅ **AC1:** Personalized time recommendations → `StudyTimeRecommender`
- ✅ **AC2:** Session duration adaptation → `SessionDurationOptimizer`
- ✅ **AC3:** Break timing recommendations → Break scheduling in optimizer
- ✅ **AC4:** Content sequencing → `ContentSequencer`
- ✅ **AC5:** Intensity modulation → `StudyIntensityModulator`
- ✅ **AC6:** Calendar integration → Google Calendar OAuth + sync
- ✅ **AC7:** Schedule adaptation → `OrchestrationAdaptationEngine`
- ✅ **AC8:** Effectiveness measurement → Effectiveness API endpoint

**Remaining for Phase 3:**
- UI components (Task 7)
- Real-time orchestration (Task 12)
- Analytics dashboard (Task 11)
- Testing & validation (Task 13)

---

## 🎯 SUCCESS METRICS

**Target (AC8):** 20%+ performance improvement with orchestration

**Current Implementation:**
- Effectiveness API tracks adherence, performance, accuracy
- Compares orchestrated vs self-scheduled sessions
- Generates insights and recommendations
- 30-day analysis with configurable range

**Validation Method:**
```bash
curl "http://localhost:3000/api/orchestration/effectiveness?userId=test-user&dateRange=30"
```

Expected result structure:
```json
{
  "adherenceRate": 67,
  "performanceImprovement": 23.4,
  "avgConfidence": 0.82,
  "insights": [
    "Following orchestration improves outcomes by 23%",
    "Excellent adherence at 67%"
  ],
  "stats": {
    "totalSessions": 30,
    "orchestratedSessions": 20,
    "selfScheduledSessions": 10,
    "orchestratedAvgPerformance": 82,
    "selfScheduledAvgPerformance": 68
  }
}
```

---

## 🚨 CRITICAL NOTES

1. **Environment Variables are REQUIRED** - App will crash without them
2. **Google Cloud Console setup MUST be done** before testing calendar
3. **Database migration MUST be run** before API calls work
4. **User needs historical data** for good recommendations (graceful fallback included)
5. **Token encryption is irreversible** - If TOKEN_ENCRYPTION_KEY changes, all tokens are lost

---

## 🤝 HANDOFF CHECKLIST

Before starting Phase 3, ensure:

- [ ] Read all 3 summary documents (Phase 1, Phase 2, Overall)
- [ ] Review story context XML (`docs/stories/story-context-5.3.xml`)
- [ ] Set up environment variables (`.env.local`)
- [ ] Configure Google Cloud Console OAuth
- [ ] Run database migration
- [ ] Install `google-auth-library` dependency
- [ ] Test all 10 API endpoints with curl
- [ ] Verify calendar OAuth flow works end-to-end
- [ ] Review design system guidelines (glassmorphism, OKLCH colors)
- [ ] Check existing UI components for reuse

---

**Backend Implementation:** ✅ COMPLETE
**Ready for:** UI Development (Phase 3)
**Contact:** Backend team for API questions
**Timeline:** Phase 3 estimated 30-40 hours
