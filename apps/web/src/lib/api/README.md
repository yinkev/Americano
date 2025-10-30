# Americano API Client Library

Comprehensive type-safe API client for Americano's frontend-backend integration.

## Overview

This library provides React Query hooks for all 34 backend endpoints across Epic 4:
- **Story 4.1 & 4.2**: Validation (7 hooks)
- **Story 4.3**: Challenges (3 hooks)
- **Story 4.5**: Adaptive (2 hooks)
- **Story 4.6**: Analytics (13 hooks)

## Features

- ✅ **Type Safety**: Auto-generated TypeScript types from Pydantic models
- ✅ **Error Handling**: Retry logic with exponential backoff
- ✅ **Toast Notifications**: Automatic success/error feedback
- ✅ **Cache Management**: Optimized stale times and GC policies
- ✅ **Optimistic Updates**: Seamless UX for mutations
- ✅ **Query Key Factories**: Consistent cache invalidation

## Installation

```bash
npm install @tanstack/react-query sonner
```

## Quick Start

### 1. Setup Query Client

```tsx
// app/layout.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 3,
    },
  },
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### 2. Use Hooks in Components

```tsx
import { useEvaluateResponse, useDailyInsight } from '@/lib/api/hooks';

function ComprehensionForm() {
  const evaluateResponse = useEvaluateResponse();
  const { data: dailyInsight } = useDailyInsight("user_123");

  const handleSubmit = async (text: string) => {
    const result = await evaluateResponse.mutateAsync({
      prompt_id: "prompt_abc",
      user_answer: text,
      confidence_level: 4,
      objective_text: "Cardiac conduction system"
    });

    console.log(result.overall_score); // 85
    console.log(result.strengths); // ["Clear terminology", ...]
  };

  return (
    <div>
      {dailyInsight && (
        <p>Today's focus: {dailyInsight.priority_objective_name}</p>
      )}
      {/* Form UI */}
    </div>
  );
}
```

## API Reference

### Validation Hooks

#### useGeneratePrompt()
Generate comprehension validation prompts.

```tsx
const generatePrompt = useGeneratePrompt();

const result = await generatePrompt.mutateAsync({
  objective_id: "obj_123",
  objective_text: "Cardiac conduction system"
});
// result.prompt_text, result.prompt_type, result.expected_criteria
```

#### useEvaluateResponse()
Evaluate user explanations with multi-dimensional scoring.

```tsx
const evaluate = useEvaluateResponse();

const result = await evaluate.mutateAsync({
  prompt_id: "prompt_123",
  user_answer: "The heart...",
  confidence_level: 4,
  objective_text: "Cardiac conduction"
});
// result.overall_score, result.calibration_delta, result.strengths
```

#### useGenerateScenario()
Generate clinical case scenarios.

```tsx
const generate = useGenerateScenario();

const result = await generate.mutateAsync({
  objective_id: "obj_456",
  objective_text: "Acute MI diagnosis",
  board_exam_tags: ["USMLE-Step2"],
  difficulty: "INTERMEDIATE"
});
// result.case, result.learning_points
```

#### useEvaluateScenario()
Evaluate clinical reasoning.

```tsx
const evaluate = useEvaluateScenario();

const result = await evaluate.mutateAsync({
  scenario_id: "scenario_789",
  user_choices: { stage1: 0, stage2: 2 },
  user_reasoning: "Patient presents with...",
  time_spent: 180,
  case_summary: "45yo male..."
});
// result.overall_score, result.errors
```

#### useScenarioMetrics()
Get aggregated scenario performance.

```tsx
const { data } = useScenarioMetrics();
// data.total_scenarios_completed, data.average_score
```

#### useIdentifyChallenge()
Detect if controlled failure challenge needed.

```tsx
const { data } = useIdentifyChallenge({
  user_id: "user_123",
  objective_id: "obj_456",
  recent_scores: [85, 88, 90, 87]
});
// data.should_generate_challenge, data.challenge_type
```

#### useGenerateChallenge()
Generate controlled failure questions.

```tsx
const generate = useGenerateChallenge();

const result = await generate.mutateAsync({
  objective_id: "obj_789",
  objective_text: "Heart failure",
  challenge_type: "reasoning",
  target_difficulty: 0.4
});
// result.question_text, result.difficulty
```

#### useGetScenario(scenarioId)
Fetch a specific scenario by ID.

```tsx
const { data } = useGetScenario("scenario_123");
// data.case, data.learning_points
```

---

### Challenge Hooks

#### useChallengeFeedback()
Generate corrective feedback for failures.

```tsx
const generateFeedback = useChallengeFeedback();

const result = await generateFeedback.mutateAsync({
  challenge_id: "challenge_123",
  objective_id: "obj_456",
  question_text: "Which drug...",
  correct_answer: "Lisinopril",
  user_answer: "Metoprolol"
});
// result.feedback.misconception_explained, result.feedback.memory_anchor
```

#### useScheduleRetries()
Schedule spaced repetition retries.

```tsx
const schedule = useScheduleRetries();

const result = await schedule.mutateAsync({
  failure_id: "failure_789",
  challenge_id: "challenge_123",
  objective_id: "obj_456",
  failed_at: new Date().toISOString()
});
// result.retry_dates (5 dates: +1, +3, +7, +14, +30 days)
```

#### useDetectPatterns()
Detect chronic failure patterns.

```tsx
const { data } = useDetectPatterns({
  user_id: "user_123",
  objective_id: "obj_456", // optional
  timeframe_days: 90
});
// data.patterns.chronic_struggles, data.patterns.mastered
```

#### useFailureRecords(userId, objectiveId?)
Fetch detailed failure records.

```tsx
const { data } = useFailureRecords("user_123", "obj_456");
// data.failure_records[].mastery_status
```

---

### Adaptive Hooks

#### useNextQuestion()
Get next question using IRT algorithm.

```tsx
const getNext = useNextQuestion();

const result = await getNext.mutateAsync({
  session_id: "session_123",
  user_id: "user_456",
  objective_id: "obj_789",
  response_history: [
    { question_id: "q1", score: 85, time_spent: 45, confidence: 4 }
  ],
  last_score: 85,
  last_confidence: 4
});
// result.question, result.irt_metrics.theta, result.should_continue
```

#### useSessionMetrics(sessionId, objectiveId)
Get IRT metrics for session.

```tsx
const { data } = useSessionMetrics("session_123", "obj_789");
// data.irt_metrics.theta, data.efficiency_metrics
```

---

### Analytics Hooks

#### useDailyInsight(userId)
Get today's priority recommendation.

```tsx
const { data } = useDailyInsight("user_123");
// data.priority_objective_name, data.action_items
```

#### useWeeklySummary(userId)
Get top 3 weekly objectives.

```tsx
const { data } = useWeeklySummary("user_123");
// data[0].objective_name, data[0].rationale, data[0].estimated_hours
```

#### useInterventions(userId)
Get pattern-based interventions.

```tsx
const { data } = useInterventions("user_123");
// data[0].pattern_detected, data[0].intervention_type
```

#### useTimeToMastery(objectiveId, userId)
Estimate hours to mastery.

```tsx
const { data } = useTimeToMastery("obj_123", "user_456");
// data.hours_to_mastery, data.weeks_to_mastery
```

#### useSuccessProbability(objectiveId, userId, plannedHours)
Predict success probability.

```tsx
const { data } = useSuccessProbability("obj_123", "user_456", 10);
// data.success_probability, data.confidence_level
```

#### useRecommendations(userId)
Get comprehensive recommendations.

```tsx
const { data } = useRecommendations("user_123");
// data.daily_insight, data.weekly_top3, data.interventions
```

#### usePredictions(userId, dateRange?, examType?)
Get ML predictions (exam, forgetting, mastery).

```tsx
const { data } = usePredictions("user_123");
// data.exam_success.probability, data.forgetting_risks, data.mastery_dates
```

#### usePatterns(userId, dateRange?)
Analyze comprehension patterns.

```tsx
const { data } = usePatterns("user_123", "90d");
// data.strengths, data.weaknesses, data.calibration_issues, data.ai_insights
```

#### useLongitudinal(userId, dateRange?, dimensions?)
Track historical progress.

```tsx
const { data } = useLongitudinal("user_123", "90d", "comprehension,reasoning");
// data.time_series, data.milestones, data.growth_trajectory
```

#### useCorrelations(userId)
Analyze cross-objective correlations.

```tsx
const { data } = useCorrelations("user_123");
// data.matrix, data.foundational, data.bottlenecks
```

#### usePeerBenchmark(userId, objectiveId?)
Compare with anonymized peers.

```tsx
const { data } = usePeerBenchmark("user_123", "obj_456");
// data.user_percentile, data.peer_distribution, data.relative_strengths
```

#### useUnderstandingDashboard(userId, timeRange?)
Get dashboard summary.

```tsx
const { data } = useUnderstandingDashboard("user_123", "30d");
// data.overall_score, data.mastery_breakdown, data.calibration_status
```

#### useUnderstandingComparison(userId, peerGroup?)
Compare performance across dimensions.

```tsx
const { data } = useUnderstandingComparison("user_123", "all");
// data.user_percentile, data.dimension_comparisons, data.strengths_vs_peers
```

---

## Cache Configuration

The library uses optimized cache strategies:

```ts
export const STALE_TIME = {
  REALTIME: 1 * 60 * 1000,    // 1 min - dashboard metrics
  FREQUENT: 5 * 60 * 1000,    // 5 min - user progress
  MODERATE: 15 * 60 * 1000,   // 15 min - ML predictions
  STABLE: 30 * 60 * 1000,     // 30 min - peer benchmarks
  STATIC: 60 * 60 * 1000,     // 1 hour - learning objectives
};
```

## Error Handling

All hooks include automatic retry with exponential backoff:

```ts
// Retry up to 3 times for server errors
// Don't retry for client errors (4xx)
// Exception: 429 (rate limit) and 408 (timeout) are retried
```

Toast notifications are shown automatically:
- ✅ Success: 3 second duration
- ❌ Error: 5 second duration with status code

## Cache Invalidation

Use utility functions for cache management:

```ts
import { invalidateValidationQueries, invalidateAnalyticsQueries } from '@/lib/api/hooks';

// After submitting a response
invalidateValidationQueries(queryClient);
invalidateAnalyticsQueries(queryClient);
```

## TypeScript Types

All types are auto-generated from Pydantic models:

```ts
import type {
  EvaluationResult,
  DailyInsight,
  UnderstandingPrediction,
  // ... 40+ more types
} from '@/lib/api/hooks';
```

## Best Practices

### 1. Enable Queries Conditionally

```tsx
const { data } = useDailyInsight(userId);
// enabled: !!userId is handled internally
```

### 2. Handle Loading and Error States

```tsx
const { data, isLoading, error } = useTimeToMastery(objectiveId, userId);

if (isLoading) return <Spinner />;
if (error) return <ErrorMessage error={error} />;
if (!data) return <EmptyState />;

return <MasteryEstimate data={data} />;
```

### 3. Use Optimistic Updates for Better UX

```tsx
const mutation = useEvaluateResponse();

// The hook automatically updates cache optimistically
await mutation.mutateAsync(request);
```

### 4. Leverage Query Keys for Invalidation

```tsx
import { validationKeys, analyticsKeys } from '@/lib/api/hooks';

// Invalidate specific queries
queryClient.invalidateQueries({ queryKey: validationKeys.scenarios() });
queryClient.invalidateQueries({ queryKey: analyticsKeys.dashboard(userId) });
```

### 5. Monitor Performance

```tsx
import { useQuery } from '@tanstack/react-query';

// Use React Query Devtools in development
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

## Testing

### Mock Hooks in Tests

```ts
import { vi } from 'vitest';
import * as hooks from '@/lib/api/hooks';

vi.spyOn(hooks, 'useDailyInsight').mockReturnValue({
  data: {
    priority_objective_name: "Cardiac Conduction",
    action_items: ["Review lecture", "Complete 5 questions"],
    estimated_time_minutes: 45,
    reasoning: "Highest priority gap"
  },
  isLoading: false,
  error: null,
});
```

### Integration Tests

```ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDailyInsight } from '@/lib/api/hooks';

test('fetches daily insight', async () => {
  const queryClient = new QueryClient();
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const { result } = renderHook(() => useDailyInsight("user_123"), { wrapper });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toBeDefined();
});
```

## Troubleshooting

### Issue: Types not found

**Solution**: Ensure types are generated:
```bash
cd apps/web
npm run generate-types
```

### Issue: Stale data

**Solution**: Adjust stale time or invalidate manually:
```ts
queryClient.invalidateQueries({ queryKey: ['analytics'] });
```

### Issue: Too many retries

**Solution**: Reduce retry count for specific queries:
```ts
const { data } = useQuery({
  // ...
  retry: 1,
});
```

### Issue: Network timeout

**Solution**: Increase timeout in api client:
```ts
request('GET', path, { timeoutMs: 30000 });
```

## Support

For issues or questions:
1. Check this documentation
2. Review `/apps/api/src/*/routes.py` for endpoint details
3. Consult `/docs/api/` for API specifications
4. Check `/apps/web/src/lib/api/errors.ts` for error handling

## License

Internal use only - Americano project.
