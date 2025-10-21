# Story 4.6 Backend Implementation - COMPLETED

**Date:** 2025-10-17
**Story:** Comprehensive Understanding Analytics Dashboard
**Phase:** Backend & API Layer (TypeScript)
**Status:** ✅ COMPLETE - Ready for UI Implementation

---

## Summary

This document summarizes the **backend implementation** for Story 4.6: Comprehensive Understanding Analytics. All database models, API routes, validation schemas, and state management are complete and ready for React UI components.

---

## What Was Built

### 1. Database Models (Prisma Schema)

Added 3 new models to `/Users/kyin/Projects/Americano-epic4/apps/web/prisma/schema.prisma`:

#### `UnderstandingPrediction`
Stores ML-based predictions for exam success, forgetting risk, and mastery dates.

```prisma
model UnderstandingPrediction {
  id                  String   @id @default(cuid())
  userId              String
  objectiveId         String
  predictionType      String // EXAM_SUCCESS, FORGETTING_RISK, MASTERY_DATE
  predictedValue      Float
  confidenceInterval  Json // { lower: number, upper: number }
  predictedAt         DateTime @default(now())
  actualValue         Float?
  accuracy            Float?

  @@index([userId])
  @@index([objectiveId])
  @@index([predictedAt])
}
```

#### `PeerBenchmark`
Stores anonymized peer comparison statistics per objective and metric.

```prisma
model PeerBenchmark {
  id           String   @id @default(cuid())
  objectiveId  String
  metric       String // comprehension_score, reasoning_score, etc
  percentile25 Float
  percentile50 Float
  percentile75 Float
  mean         Float
  stdDev       Float
  sampleSize   Int
  calculatedAt DateTime @default(now())

  @@unique([objectiveId, metric])
  @@index([objectiveId])
}
```

#### `DailyInsight`
Stores AI-generated daily insights and recommendations.

```prisma
model DailyInsight {
  id                  String    @id @default(cuid())
  userId              String
  date                DateTime
  insightType         String // daily_priority, weekly_top3, etc
  message             String
  recommendedActions  Json // string[]
  priority            Int // 1-10
  dismissed           Boolean   @default(false)

  @@index([userId])
  @@index([date])
}
```

**Migration Applied:** Schema pushed to database via `npx prisma db push --skip-generate` (multi-worktree setup)

---

### 2. Zod Validation Schemas

Added comprehensive validation schemas to `/Users/kyin/Projects/Americano-epic4/apps/web/src/lib/validation.ts`:

- `analyticsQuerySchema` - Query parameters (dateRange, courseId, topic)
- `dashboardResponseSchema` - Overview metrics (6 cards)
- `comparisonDataSchema` - Understanding vs memorization comparison
- `patternsResponseSchema` - Strengths, weaknesses, AI insights
- `longitudinalResponseSchema` - Time-series progress data
- `predictionsResponseSchema` - ML predictions (exam, forgetting, mastery)
- `correlationsResponseSchema` - Objective correlation matrix
- `peerBenchmarkResponseSchema` - Peer comparison statistics
- `recommendationsResponseSchema` - Actionable recommendations
- `exportReportSchema` - PDF export request

**All schemas include TypeScript types** exported via `z.infer<typeof schema>`.

---

### 3. API Route Handlers (Next.js App Router)

Created 8 API routes as **thin proxies** to Python FastAPI service:

#### Route Structure
```
apps/web/src/app/api/analytics/understanding/
├── dashboard/route.ts         # GET - Overview metrics (6 cards)
├── comparison/route.ts        # GET - Understanding vs memorization
├── patterns/route.ts          # GET - Strengths/weaknesses/insights
├── longitudinal/route.ts      # GET - Time-series progress
├── predictions/route.ts       # GET - ML predictions
├── correlations/route.ts      # GET - Objective correlation matrix
├── peer-benchmark/route.ts    # GET - Peer comparison
├── recommendations/route.ts   # GET - Actionable recommendations
└── export-report/route.ts     # POST - PDF export
```

#### Common Pattern (All Routes)
```typescript
export async function GET(request: NextRequest) {
  // 1. Validate query parameters (Zod)
  const query = validateQuery(searchParams, analyticsQuerySchema)

  // 2. Get user from headers (MVP auth)
  const userEmail = request.headers.get('X-User-Email') || 'test@example.com'

  // 3. Call Python FastAPI service
  const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8001'
  const response = await fetch(`${pythonServiceUrl}/analytics/understanding/...`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_email: userEmail, ...query }),
  })

  // 4. Validate response (Zod)
  const data = await response.json()
  const validatedData = responseSchema.parse(data)

  // 5. Return JSON
  return NextResponse.json(validatedData, { status: 200 })
}
```

**Error Handling:** All routes handle `ApiError` and validation errors with proper status codes.

---

### 4. State Management (Zustand)

Created global state store at `/Users/kyin/Projects/Americano-epic4/apps/web/src/store/understanding-analytics-store.ts`:

```typescript
interface UnderstandingAnalyticsState {
  // Filters
  dateRange: '7d' | '30d' | '90d'
  courseId: string | null
  topic: string | null

  // UI state
  activeTab: Tab // 'overview' | 'comparison' | ...
  refreshTimestamp: number | null

  // Actions
  setDateRange(range: DateRange): void
  setCourseFilter(courseId: string | null): void
  setTopicFilter(topic: string | null): void
  setActiveTab(tab: Tab): void
  refreshData(): void
  clearFilters(): void
}
```

**Persistence:** State persisted to `localStorage` via Zustand's `persist` middleware.

---

## Architecture Overview

### Flow Diagram
```
User → React UI (TypeScript)
    ↓
  Zustand Store (filters, activeTab)
    ↓
  React Query (useQuery hooks)
    ↓
  Next.js API Routes (TypeScript proxies)
    ↓
  Python FastAPI Service (http://localhost:8001)
    ↓
  ChatMock/GPT-5 AI + ML Analytics
    ↓
  PostgreSQL Database (Prisma)
```

### Technology Stack
- **Frontend:** React 19 + Next.js 15 (App Router)
- **State Management:** Zustand with persistence
- **Data Fetching:** TanStack React Query (not yet implemented - TODO)
- **Validation:** Zod schemas (runtime + TypeScript types)
- **API Layer:** Next.js API routes as thin proxies
- **Backend:** Python FastAPI service (separate, port 8001)
- **Database:** PostgreSQL via Prisma ORM

---

## Configuration

### Environment Variables
Add to `.env` (if not already present):

```bash
# Python service URL (default: http://localhost:8001)
PYTHON_SERVICE_URL=http://localhost:8001

# Database URL (shared across worktrees)
DATABASE_URL=postgresql://kyin@localhost:5432/americano
```

### Python Service
The Python FastAPI service is expected to run on port **8001** with endpoints:

```
POST /analytics/understanding/dashboard
POST /analytics/understanding/comparison
POST /analytics/understanding/patterns
POST /analytics/understanding/longitudinal
POST /analytics/understanding/predictions
POST /analytics/understanding/correlations
POST /analytics/understanding/peer-benchmark
POST /analytics/understanding/recommendations
POST /analytics/understanding/export-report
```

**Note:** The Python service is implemented by a **Python agent** (separate task).

---

## What's Left to Build (UI Layer)

### High Priority Tasks

#### 1. React Query Hooks
Create `/Users/kyin/Projects/Americano-epic4/apps/web/src/hooks/use-understanding-analytics.ts`:

```typescript
export function useUnderstandingDashboard() {
  const { dateRange, courseId, topic } = useUnderstandingAnalyticsStore()

  return useQuery({
    queryKey: ['understanding', 'dashboard', dateRange, courseId, topic],
    queryFn: async () => {
      const params = new URLSearchParams({
        dateRange,
        ...(courseId && { courseId }),
        ...(topic && { topic }),
      })
      const response = await fetch(`/api/analytics/understanding/dashboard?${params}`)
      if (!response.ok) throw new Error('Failed to fetch dashboard')
      return response.json() as Promise<DashboardResponse>
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Repeat for: useComparisonData, usePatternsAnalysis, useLongitudinalProgress, etc.
```

#### 2. Main Dashboard Layout Component
Create `/Users/kyin/Projects/Americano-epic4/apps/web/src/components/analytics/UnderstandingDashboard.tsx`:

- Tabbed interface (8 tabs: overview, comparison, patterns, progress, predictions, relationships, benchmarks, recommendations)
- Global filters: Date range selector, course filter, topic filter
- Refresh button + timestamp
- Export to PDF button
- Lazy-loaded tab content with `React.Suspense`

#### 3. Tab Components (8 Total)

**Overview Tab (`MetricCard.tsx`):**
- 6 metric cards (comprehension, reasoning, failure, calibration, adaptive, mastery)
- Each card: Current score, trend arrow (↑↓→), sparkline chart
- Glassmorphism design: `bg-white/95 backdrop-blur-xl`

**Comparison Tab (`UnderstandingVsMemorizationChart.tsx`):**
- Recharts LineChart with dual lines (blue = memorization, orange = understanding)
- Shaded gap areas where understanding < memorization
- Correlation coefficient display
- "Illusion of Knowledge" alerts for gaps > 20

**Patterns Tab (`StrengthWeaknessPanel.tsx`):**
- Top 5 strengths (green badges)
- Top 5 weaknesses (red badges)
- AI insights (3-5 bullet points from ChatMock)
- Links to study resources for each topic

**Progress Tab (`LongitudinalProgressChart.tsx`):**
- Recharts LineChart with multiple lines (comprehension, reasoning, calibration)
- Milestone markers (icons)
- Regression warnings (red dashed annotations)
- 7/30/90 day view selector

**Predictions Tab (`PredictiveInsightsPanel.tsx`):**
- Exam success probability card
- Forgetting risk list (sorted by probability)
- Mastery date predictions with estimated hours
- Model accuracy transparency (MAE, sample size)

**Relationships Tab (`ObjectiveCorrelationHeatmap.tsx` + `ObjectiveDependencyNetwork.tsx`):**
- Correlation heatmap (Recharts or D3)
- Network graph (react-force-graph or vis-network)
- Highlight foundational (green) and bottleneck (red) objectives

**Benchmarks Tab (`PeerComparisonDashboard.tsx`):**
- Box plots for peer distribution (Recharts)
- User's position marked on each metric
- Percentile rank badges
- Privacy notice: "Sample size: N students, minimum 50 required"

**Recommendations Tab (`RecommendationsPanel.tsx`):**
- Daily insight card (top priority, highlighted)
- Weekly top 3 objectives with rationale
- Intervention suggestions (e.g., "More controlled failures for overconfidence")
- Time investment estimates
- Success probability indicators
- Link to Mission generation (`POST /api/learning/mission/generate`)

#### 4. Page Component
Create `/Users/kyin/Projects/Americano-epic4/apps/web/src/app/progress/understanding/page.tsx`:

```typescript
export default function UnderstandingAnalyticsPage() {
  return (
    <div className="container mx-auto p-6">
      <Suspense fallback={<DashboardSkeleton />}>
        <UnderstandingDashboard />
      </Suspense>
    </div>
  )
}
```

#### 5. PDF Export (Client-Side)
Implement PDF generation using `jsPDF` + `html2canvas` in `/Users/kyin/Projects/Americano-epic4/apps/web/src/lib/pdf-export.ts`.

**Note:** Python service may also handle PDF generation (TBD by Python agent).

---

## Testing Checklist

### API Routes
- [ ] All 8 routes return 200 with valid Zod-validated data
- [ ] Query parameter validation works (invalid dateRange returns 400)
- [ ] Python service errors handled gracefully (500 errors)
- [ ] Auth header (`X-User-Email`) passed correctly

### State Management
- [ ] Zustand store updates filters correctly
- [ ] State persists to localStorage
- [ ] Tab selection persists across page reloads
- [ ] `refreshData()` triggers React Query refetch

### Performance
- [ ] Dashboard loads in < 2 seconds
- [ ] Tab switch in < 500ms (lazy loading + Suspense)
- [ ] Charts render without jank (use `ResponsiveContainer`)
- [ ] Mobile responsive (3 cols → 2 → 1)

---

## File Structure

```
apps/web/
├── prisma/
│   └── schema.prisma (+ 3 new models)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── analytics/
│   │   │       └── understanding/
│   │   │           ├── dashboard/route.ts
│   │   │           ├── comparison/route.ts
│   │   │           ├── patterns/route.ts
│   │   │           ├── longitudinal/route.ts
│   │   │           ├── predictions/route.ts
│   │   │           ├── correlations/route.ts
│   │   │           ├── peer-benchmark/route.ts
│   │   │           ├── recommendations/route.ts
│   │   │           └── export-report/route.ts
│   │   └── progress/
│   │       └── understanding/
│   │           └── page.tsx (TODO)
│   ├── components/
│   │   └── analytics/
│   │       ├── UnderstandingDashboard.tsx (TODO)
│   │       ├── MetricCard.tsx (TODO)
│   │       ├── UnderstandingVsMemorizationChart.tsx (TODO)
│   │       ├── StrengthWeaknessPanel.tsx (TODO)
│   │       ├── LongitudinalProgressChart.tsx (TODO)
│   │       ├── PredictiveInsightsPanel.tsx (TODO)
│   │       ├── ObjectiveCorrelationHeatmap.tsx (TODO)
│   │       ├── ObjectiveDependencyNetwork.tsx (TODO)
│   │       ├── PeerComparisonDashboard.tsx (TODO)
│   │       └── RecommendationsPanel.tsx (TODO)
│   ├── hooks/
│   │   └── use-understanding-analytics.ts (TODO)
│   ├── lib/
│   │   ├── validation.ts (+ Story 4.6 schemas)
│   │   └── pdf-export.ts (TODO)
│   └── store/
│       └── understanding-analytics-store.ts
```

---

## Dependencies

### Already Installed
- `next` (15.x)
- `react` (19.x)
- `zustand` (^5.0.2)
- `zod` (^3.24.2)
- `@prisma/client` (^6.17.1)

### Need to Install
```bash
npm install @tanstack/react-query recharts react-window jspdf html2canvas
```

**Recharts:** Chart library (LineChart, BarChart, ScatterChart)
**react-window:** Virtual scrolling for long lists (> 100 items)
**jsPDF + html2canvas:** PDF export (if not handled by Python service)

---

## Example API Usage

### Fetch Dashboard Metrics
```typescript
const response = await fetch('/api/analytics/understanding/dashboard?dateRange=30d&courseId=cm123')
const data: DashboardResponse = await response.json()

console.log(data.comprehension.currentScore) // 85
console.log(data.comprehension.trend) // 'up'
console.log(data.mastery.percentage) // 67.5
```

### Fetch Comparison Data
```typescript
const response = await fetch('/api/analytics/understanding/comparison?dateRange=90d')
const data: ComparisonData = await response.json()

console.log(data.correlation) // 0.72 (Pearson's r)
console.log(data.gaps.length) // 5 objectives with illusion of knowledge
```

### Export PDF Report
```typescript
const response = await fetch('/api/analytics/understanding/export-report', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ dateRange: '30d', includeCharts: true }),
})

const blob = await response.blob()
const url = URL.createObjectURL(blob)
window.open(url, '_blank')
```

---

## Next Steps for UI Implementation

1. **Install dependencies:** `npm install @tanstack/react-query recharts react-window jspdf html2canvas`
2. **Create React Query hooks:** `/src/hooks/use-understanding-analytics.ts`
3. **Build main dashboard component:** `/src/components/analytics/UnderstandingDashboard.tsx`
4. **Implement 8 tab components** (start with Overview tab)
5. **Create page component:** `/src/app/progress/understanding/page.tsx`
6. **Test with mock Python service** (use `json-server` or Postman mock)
7. **Add navigation link** in `/src/app/progress/page.tsx`
8. **Implement PDF export** (if not handled by Python)

---

## Contact / Questions

For questions about the backend implementation, refer to:
- **CLAUDE.md** - Technology stack decisions
- **AGENTS.md** - Pre-implementation checklist
- **docs/stories/story-4.6.md** - Original requirements

**Python Agent:** Should implement matching FastAPI endpoints on port 8001.

---

## Changelog

**2025-10-17** - Initial backend implementation complete
- Added 3 Prisma models
- Created 8 API route handlers
- Added comprehensive Zod validation schemas
- Implemented Zustand state management
- Documented all endpoints and data flows

---

**Status:** ✅ Backend Complete - Ready for UI Implementation
