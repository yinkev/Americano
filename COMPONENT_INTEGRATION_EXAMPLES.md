# Component Integration Examples

**Type:** How-To Guide | **Date:** 2025-10-26 | **Audience:** Frontend Developers

Complete, copy-paste-ready examples of connecting React components to the backend API.

---

## Example 1: Simple Data Display (Learning Dashboard)

**Scenario:** Display user's learning progress from the backend.

### Backend (Python)
```python
# apps/api/src/analytics/models.py
from pydantic import BaseModel

class ProgressMetrics(BaseModel):
    """User progress metrics."""
    total_topics: int
    completed_topics: int
    accuracy_rate: float  # 0-1
    last_study_date: str

class DashboardSummary(BaseModel):
    """Dashboard summary for user."""
    user_id: str
    progress: ProgressMetrics
    next_mission: str
    streak_days: int

# apps/api/src/analytics/routes.py
from fastapi import APIRouter, HTTPException
from sqlalchemy import select
from .models import DashboardSummary, ProgressMetrics

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/dashboard/{user_id}", response_model=DashboardSummary)
async def get_dashboard(user_id: str):
    """Get user dashboard data."""
    # Query database
    progress = ProgressMetrics(
        total_topics=150,
        completed_topics=45,
        accuracy_rate=0.82,
        last_study_date="2025-10-26",
    )

    return DashboardSummary(
        user_id=user_id,
        progress=progress,
        next_mission="Cardiology",
        streak_days=12,
    )
```

### Frontend (TypeScript/React)
```typescript
// apps/web/src/components/dashboard.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import type { DashboardSummary } from '@/types/api-generated'

export function Dashboard({ userId }: { userId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', userId],
    queryFn: async (): Promise<DashboardSummary> => {
      const res = await fetch(`/api/analytics/dashboard/${userId}`)
      if (!res.ok) throw new Error('Failed to load dashboard')
      return res.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  if (isLoading) {
    return <div className="p-4">Loading dashboard...</div>
  }

  if (error) {
    return <div className="p-4 text-red-500">Error loading dashboard</div>
  }

  return (
    <div className="p-6 bg-white rounded-lg">
      <h1 className="text-2xl font-bold mb-4">Learning Dashboard</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded">
          <p className="text-gray-600">Progress</p>
          <p className="text-2xl font-bold">
            {data?.progress.completed_topics}/{data?.progress.total_topics}
          </p>
        </div>

        <div className="bg-green-50 p-4 rounded">
          <p className="text-gray-600">Accuracy</p>
          <p className="text-2xl font-bold">
            {((data?.progress.accuracy_rate || 0) * 100).toFixed(0)}%
          </p>
        </div>

        <div className="bg-purple-50 p-4 rounded">
          <p className="text-gray-600">Streak</p>
          <p className="text-2xl font-bold">{data?.streak_days} days 🔥</p>
        </div>

        <div className="bg-yellow-50 p-4 rounded">
          <p className="text-gray-600">Next Mission</p>
          <p className="text-lg font-bold">{data?.next_mission}</p>
        </div>
      </div>
    </div>
  )
}
```

### Next.js API Route (Proxy)
```typescript
// apps/web/src/app/api/analytics/dashboard/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/api-error'
import { successResponse } from '@/lib/api-response'

export const GET = withErrorHandler(
  async (request: NextRequest, { params }: { params: { userId: string } }) => {
    const { userId } = params

    const response = await fetch(
      `http://localhost:8000/analytics/dashboard/${userId}`,
      { method: 'GET' },
    )

    if (!response.ok) {
      throw new Error('Failed to fetch from Python API')
    }

    const data = await response.json()
    return NextResponse.json(successResponse(data))
  },
)
```

---

## Example 2: Form Submission (Submit Answer)

**Scenario:** User submits an answer, backend evaluates it, display results.

### Backend (Python)
```python
# apps/api/src/validation/models.py
from pydantic import BaseModel, Field

class EvaluationRequest(BaseModel):
    """Comprehension evaluation request."""
    prompt_id: str = Field(..., description="ID of the prompt")
    user_answer: str = Field(..., min_length=5, description="User's answer")
    confidence_level: int = Field(..., ge=1, le=5, description="1-5 confidence")

class EvaluationResult(BaseModel):
    """Evaluation result with scores and feedback."""
    overall_score: int = Field(..., ge=0, le=100, description="0-100 score")
    terminology_score: int = Field(..., ge=0, le=100)
    relationship_score: int = Field(..., ge=0, le=100)
    application_score: int = Field(..., ge=0, le=100)
    clarity_score: int = Field(..., ge=0, le=100)
    strengths: list[str] = Field(..., min_items=2, max_items=3)
    gaps: list[str] = Field(..., min_items=2, max_items=3)
    feedback: str
    calibration_score: float = Field(..., ge=-100, le=100)

# apps/api/src/validation/routes.py
from fastapi import APIRouter
from instructor import from_openai
from .models import EvaluationRequest, EvaluationResult

router = APIRouter(prefix="/validation", tags=["validation"])

@router.post("/evaluate", response_model=EvaluationResult)
async def evaluate_answer(request: EvaluationRequest) -> EvaluationResult:
    """Evaluate user's comprehension using AI."""

    # Mock evaluation (would use instructor + GPT in production)
    return EvaluationResult(
        overall_score=85,
        terminology_score=90,
        relationship_score=80,
        application_score=85,
        clarity_score=85,
        strengths=["Good clinical thinking", "Clear explanation"],
        gaps=["Missing differential diagnosis", "Limited pathophysiology"],
        feedback="Excellent foundational understanding with room for depth",
        calibration_score=12,  # User was overconfident by 12 points
    )
```

### Frontend (TypeScript/React)
```typescript
// apps/web/src/components/answer-form.tsx
'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import type { EvaluationResult } from '@/types/api-generated'

interface Props {
  promptId: string
  promptText: string
}

export function AnswerForm({ promptId, promptText }: Props) {
  const [answer, setAnswer] = useState('')
  const [confidence, setConfidence] = useState(3)
  const [showResults, setShowResults] = useState(false)

  const mutation = useMutation({
    mutationFn: async (): Promise<EvaluationResult> => {
      const res = await fetch('/api/validation/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt_id: promptId,
          user_answer: answer,
          confidence_level: confidence,
        }),
      })

      if (!res.ok) {
        throw new Error('Evaluation failed')
      }

      return res.json()
    },
    onSuccess: () => {
      setShowResults(true)
    },
  })

  const result = mutation.data

  return (
    <div className="space-y-4">
      {!showResults && (
        <>
          <div>
            <p className="text-lg font-semibold mb-2">{promptText}</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Your Answer
            </label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.currentTarget.value)}
              placeholder="Type your answer here..."
              className="w-full h-32 p-3 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Confidence Level: {confidence}/5
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={confidence}
              onChange={(e) => setConfidence(parseInt(e.currentTarget.value))}
              className="w-full"
            />
            <div className="text-xs text-gray-500 mt-1">
              1 = Unsure, 5 = Very Confident
            </div>
          </div>

          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || answer.length < 5}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {mutation.isPending ? 'Evaluating...' : 'Submit Answer'}
          </button>

          {mutation.error && (
            <div className="p-3 bg-red-50 text-red-700 rounded">
              {(mutation.error as Error).message}
            </div>
          )}
        </>
      )}

      {showResults && result && (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Overall Score</p>
            <p className="text-4xl font-bold text-blue-600">
              {result.overall_score}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-xs text-gray-600">Terminology</p>
              <p className="text-xl font-bold">{result.terminology_score}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-xs text-gray-600">Relationships</p>
              <p className="text-xl font-bold">{result.relationship_score}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-xs text-gray-600">Application</p>
              <p className="text-xl font-bold">{result.application_score}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-xs text-gray-600">Clarity</p>
              <p className="text-xl font-bold">{result.clarity_score}</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-green-700">Strengths</h4>
            <ul className="list-disc list-inside text-green-700 text-sm">
              {result.strengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-orange-700">Areas to Improve</h4>
            <ul className="list-disc list-inside text-orange-700 text-sm">
              {result.gaps.map((g, i) => (
                <li key={i}>{g}</li>
              ))}
            </ul>
          </div>

          <div className="bg-purple-50 p-3 rounded">
            <p className="text-sm font-semibold">Calibration Feedback</p>
            <p className="text-sm text-purple-700">
              {result.calibration_score > 0
                ? `You were ${result.calibration_score} points overconfident`
                : `You were ${Math.abs(result.calibration_score)} points underconfident`}
            </p>
          </div>

          <button
            onClick={() => {
              setShowResults(false)
              setAnswer('')
              setConfidence(3)
              mutation.reset()
            }}
            className="w-full bg-gray-300 text-gray-800 py-2 rounded-lg hover:bg-gray-400"
          >
            Try Another Question
          </button>
        </div>
      )}
    </div>
  )
}
```

### Next.js API Route (Proxy)
```typescript
// apps/web/src/app/api/validation/evaluate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/api-error'
import { successResponse } from '@/lib/api-response'
import type { EvaluationRequest, EvaluationResult } from '@/types/api-generated'

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = (await request.json()) as EvaluationRequest

  // Validate request
  if (!body.prompt_id || !body.user_answer) {
    throw new Error('Missing required fields')
  }

  // Forward to Python API
  const response = await fetch('http://localhost:8000/validation/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Python API error: ${error}`)
  }

  const result: EvaluationResult = await response.json()

  // Optional: Save to database
  // await prisma.validationResponse.create({ data: { ... } })

  return NextResponse.json(successResponse(result))
})
```

---

## Example 3: Real-Time List (Study Recommendations)

**Scenario:** Fetch and display list of study recommendations.

### Frontend (TypeScript/React)
```typescript
// apps/web/src/components/study-recommendations.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import type { RecommendationsResponse } from '@/types/api-generated'
import { format } from 'date-fns'

export function StudyRecommendations({ userId }: { userId: string }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['recommendations', userId],
    queryFn: async (): Promise<RecommendationsResponse> => {
      const res = await fetch(
        `/api/orchestration/recommendations?userId=${userId}`,
      )
      if (!res.ok) throw new Error('Failed to load recommendations')
      return res.json()
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  })

  if (isLoading) {
    return <div className="p-4">Loading recommendations...</div>
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading recommendations
        <button
          onClick={() => refetch()}
          className="ml-2 text-blue-500 underline"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!data?.recommendations.length) {
    return <div className="p-4 text-gray-500">No recommendations available</div>
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Recommended Study Times</h2>
      <div className="text-sm text-gray-600">
        Cognitive Load: {data.cognitiveLoad}%
      </div>

      {data.recommendations.map((rec, idx) => (
        <div
          key={idx}
          className="border rounded-lg p-3 hover:bg-blue-50 transition"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium">
                {format(new Date(rec.startTime), 'h:mm a')} -{' '}
                {format(new Date(rec.endTime), 'h:mm a')}
              </p>
              <p className="text-sm text-gray-600 mt-1">{rec.reason}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">
                Confidence: {(rec.confidence * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-gray-600">
                Expected: {rec.estimatedPerformance.toFixed(0)}%
              </p>
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={() => refetch()}
        className="text-blue-600 text-sm hover:underline"
      >
        Refresh Recommendations
      </button>
    </div>
  )
}
```

---

## Example 4: Custom Hook Pattern

**Scenario:** Encapsulate complex data fetching logic in a reusable hook.

### Custom Hook
```typescript
// apps/web/src/hooks/use-adaptive-questions.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { NextQuestionResponse, AnswerRequest } from '@/types/api-generated'

export function useAdaptiveQuestions(userId: string) {
  const queryClient = useQueryClient()

  // Fetch current question
  const questions = useQuery({
    queryKey: ['adaptive-questions', userId],
    queryFn: async (): Promise<NextQuestionResponse> => {
      const res = await fetch(
        `/api/adaptive/next-question?userId=${userId}`,
      )
      if (!res.ok) throw new Error('Failed to load question')
      return res.json()
    },
  })

  // Submit answer mutation
  const submitAnswer = useMutation({
    mutationFn: async (answer: AnswerRequest) => {
      const res = await fetch('/api/adaptive/submit-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answer),
      })
      if (!res.ok) throw new Error('Failed to submit answer')
      return res.json()
    },
    onSuccess: () => {
      // Refetch next question after answer submitted
      queryClient.invalidateQueries({
        queryKey: ['adaptive-questions', userId],
      })
    },
  })

  return {
    currentQuestion: questions.data,
    isLoading: questions.isLoading,
    error: questions.error,
    submitAnswer: (answer: string) =>
      submitAnswer.mutate({
        user_id: userId,
        answer,
      }),
    isSubmitting: submitAnswer.isPending,
  }
}
```

### Using the Hook
```typescript
// apps/web/src/components/adaptive-learner.tsx
'use client'

import { useAdaptiveQuestions } from '@/hooks/use-adaptive-questions'
import { useState } from 'react'

export function AdaptiveLearner({ userId }: { userId: string }) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const { currentQuestion, isSubmitting, submitAnswer } =
    useAdaptiveQuestions(userId)

  return (
    <div className="max-w-2xl mx-auto">
      {currentQuestion && (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="font-semibold">Question {currentQuestion.question_index + 1}</p>
            <p className="text-lg mt-2">{currentQuestion.question.question_text}</p>
          </div>

          <div className="space-y-2">
            {currentQuestion.question.options.map((option, idx) => (
              <label key={idx} className="flex items-center p-3 border rounded hover:bg-gray-50">
                <input
                  type="radio"
                  name="answer"
                  value={option}
                  checked={selectedAnswer === option}
                  onChange={(e) => setSelectedAnswer(e.currentTarget.value)}
                  className="mr-3"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>

          <button
            onClick={() => submitAnswer(selectedAnswer)}
            disabled={!selectedAnswer || isSubmitting}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Answer'}
          </button>

          <div className="text-xs text-gray-600">
            Difficulty: {currentQuestion.irt_metrics.difficulty.toFixed(2)} |
            Your Ability: {currentQuestion.irt_metrics.theta.toFixed(2)}
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## Example 5: Error Handling & Loading States

**Best Practices:**

```typescript
// apps/web/src/components/robust-component.tsx
import { useQuery } from '@tanstack/react-query'
import type { SomeResponse } from '@/types/api-generated'

export function RobustComponent({ id }: { id: string }) {
  const { data, isLoading, error, isError, isFetching } = useQuery({
    queryKey: ['item', id],
    queryFn: async (): Promise<SomeResponse> => {
      const res = await fetch(`/api/endpoint/${id}`)

      // Handle HTTP errors
      if (!res.ok) {
        const errorData = await res.json().catch(() => null)
        throw new Error(
          errorData?.message || `HTTP ${res.status}`,
        )
      }

      return res.json()
    },
    // Retry failed requests
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Keep showing old data while refetching
    staleTime: 5 * 60 * 1000,
  })

  // Loading state (initial load)
  if (isLoading) {
    return <div className="animate-pulse">Loading...</div>
  }

  // Error state
  if (isError) {
    return (
      <div className="bg-red-50 p-4 rounded border border-red-200">
        <p className="text-red-700">
          {error instanceof Error ? error.message : 'An error occurred'}
        </p>
        {/* Retry button handled automatically by React Query */}
      </div>
    )
  }

  // Success state with refetch indicator
  return (
    <div className={isFetching ? 'opacity-50' : ''}>
      {data && (
        <div>
          {/* Your content here */}
        </div>
      )}
      {isFetching && (
        <div className="text-xs text-gray-500">Updating...</div>
      )}
    </div>
  )
}
```

---

## Checklist: Creating a New Integrated Feature

- [ ] **Define Python Model** - Create Pydantic model in `apps/api/src/*/models.py`
- [ ] **Create API Route** - Add endpoint in `apps/api/src/*/routes.py`
- [ ] **Generate Types** - Run `npm run generate-types`
- [ ] **Create Next.js Route** - Proxy route in `apps/web/src/app/api/**`
- [ ] **Create React Component** - Use `useQuery`/`useMutation` with generated types
- [ ] **Test Manually** - curl Python API → curl Next.js proxy → test in React
- [ ] **Add Error Handling** - Proper try/catch and error states
- [ ] **Add Loading States** - Show feedback while fetching
- [ ] **Test in Browser** - Verify full flow works

---

**Status:** Ready to Use | **Last Updated:** 2025-10-26 | **Owner:** Kevy
