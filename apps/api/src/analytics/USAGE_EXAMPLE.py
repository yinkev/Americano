"""
Usage Example for RecommendationEngine (Story 4.6)

Demonstrates how to integrate all 5 methods in FastAPI routes.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from src.database import get_db_session
from src.analytics.recommendations import RecommendationEngine
from src.analytics.models import (
    RecommendationsRequest,
    RecommendationData,
    DailyInsight,
    WeeklyTopObjective,
    InterventionSuggestion,
    TimeToMasteryEstimate,
)

router = APIRouter()


# ============================================================================
# Example 1: Daily Insight Endpoint
# ============================================================================

@router.post("/analytics/daily-insight")
async def get_daily_insight(
    request: RecommendationsRequest,
    session: AsyncSession = Depends(get_db_session)
) -> DailyInsight:
    """
    Get single highest-priority recommendation for today.

    Usage:
        POST /analytics/daily-insight
        Body: {"user_id": "user_123"}

    Returns:
        {
            "user_id": "user_123",
            "priority_objective_id": "obj_cardiac",
            "priority_objective_name": "Cardiac Physiology",
            "insight_category": "dangerous_gap",
            "title": "Address Cardiac Physiology Gap",
            "description": "Your understanding is 18% below mastery...",
            "action_items": ["Review cardiac conduction", "Complete 3 scenarios"],
            "estimated_time_minutes": 45,
            "generated_at": "2025-10-17T10:30:00Z"
        }
    """
    try:
        engine = RecommendationEngine(session)
        insight = await engine.generate_daily_insight(request.user_id)
        return insight
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Daily insight generation failed: {str(e)}")


# ============================================================================
# Example 2: Weekly Summary Endpoint
# ============================================================================

@router.post("/analytics/weekly-summary")
async def get_weekly_summary(
    request: RecommendationsRequest,
    session: AsyncSession = Depends(get_db_session)
) -> list[WeeklyTopObjective]:
    """
    Get top 3 objectives for the week.

    Usage:
        POST /analytics/weekly-summary
        Body: {"user_id": "user_123"}

    Returns:
        [
            {
                "objective_id": "obj_cardiac",
                "objective_name": "Cardiac Physiology",
                "rationale": "Foundational topic blocking progress...",
                "estimated_hours": 5.0
            },
            // ... 2 more objectives
        ]
    """
    try:
        engine = RecommendationEngine(session)
        top3 = await engine.generate_weekly_summary(request.user_id)
        return top3
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Weekly summary generation failed: {str(e)}")


# ============================================================================
# Example 3: Intervention Suggestions Endpoint
# ============================================================================

@router.post("/analytics/interventions")
async def get_interventions(
    user_id: str,
    session: AsyncSession = Depends(get_db_session)
) -> list[InterventionSuggestion]:
    """
    Get pattern-based intervention recommendations.

    Usage:
        POST /analytics/interventions?user_id=user_123

    Returns:
        [
            {
                "pattern_detected": "overconfidence",
                "intervention_type": "more_failure_challenges",
                "description": "Increase controlled failure challenges...",
                "priority": "high",
                "estimated_time_hours": 2.0
            },
            // ... more interventions
        ]
    """
    try:
        engine = RecommendationEngine(session)

        # Fetch user patterns (from ComprehensionPatternAnalyzer, etc.)
        patterns = await _fetch_user_patterns(user_id, session)

        interventions = await engine.generate_intervention_suggestions(patterns)
        return interventions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Intervention generation failed: {str(e)}")


# ============================================================================
# Example 4: Time to Mastery Endpoint
# ============================================================================

@router.get("/analytics/time-to-mastery/{objective_id}")
async def get_time_to_mastery(
    objective_id: str,
    user_id: str,
    session: AsyncSession = Depends(get_db_session)
) -> Optional[TimeToMasteryEstimate]:
    """
    Estimate hours needed to reach mastery for an objective.

    Usage:
        GET /analytics/time-to-mastery/obj_cardiac?user_id=user_123

    Returns:
        {
            "objective_id": "obj_cardiac",
            "objective_name": "Cardiac Physiology",
            "current_score": 65.0,
            "hours_to_mastery": 20.0,
            "weeks_to_mastery": 2.9
        }
    """
    try:
        engine = RecommendationEngine(session)

        # Fetch current score and trend
        current_score, trend = await _fetch_objective_performance(user_id, objective_id, session)

        hours = await engine.estimate_time_to_mastery(objective_id, current_score, trend)

        if hours is None:
            return None  # Mastery unlikely (negative trend)

        # Get objective name
        objective_name = await _get_objective_name(objective_id, session)

        return TimeToMasteryEstimate(
            objective_id=objective_id,
            objective_name=objective_name,
            current_score=current_score,
            hours_to_mastery=float(hours),
            weeks_to_mastery=round(hours / 7, 1)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Time estimation failed: {str(e)}")


# ============================================================================
# Example 5: Success Probability Endpoint
# ============================================================================

@router.get("/analytics/success-probability/{objective_id}")
async def get_success_probability(
    objective_id: str,
    user_id: str,
    planned_hours: int,
    session: AsyncSession = Depends(get_db_session)
) -> dict:
    """
    Predict probability of mastery given planned study time.

    Usage:
        GET /analytics/success-probability/obj_cardiac?user_id=user_123&planned_hours=10

    Returns:
        {
            "objective_id": "obj_cardiac",
            "planned_study_hours": 10,
            "success_probability": 0.85,
            "confidence_level": "high"
        }
    """
    try:
        engine = RecommendationEngine(session)

        probability = await engine.predict_success_probability(objective_id, planned_hours)

        # Determine confidence level
        if probability >= 0.75:
            confidence = "high"
        elif probability >= 0.50:
            confidence = "medium"
        else:
            confidence = "low"

        return {
            "objective_id": objective_id,
            "planned_study_hours": planned_hours,
            "success_probability": round(probability, 2),
            "confidence_level": confidence
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Probability prediction failed: {str(e)}")


# ============================================================================
# Example 6: Comprehensive Recommendations (All-in-One)
# ============================================================================

@router.post("/analytics/recommendations")
async def get_comprehensive_recommendations(
    request: RecommendationsRequest,
    session: AsyncSession = Depends(get_db_session)
) -> RecommendationData:
    """
    Get all recommendations in a single response.

    Usage:
        POST /analytics/recommendations
        Body: {"user_id": "user_123"}

    Returns:
        {
            "user_id": "user_123",
            "daily_insight": { ... },
            "weekly_top3": [ ... ],
            "interventions": [ ... ],
            "time_estimates": [ ... ],
            "exam_success_probability": 0.78,
            "generated_at": "2025-10-17T10:30:00Z"
        }
    """
    try:
        engine = RecommendationEngine(session)

        # Generate all recommendations
        daily_insight = await engine.generate_daily_insight(request.user_id)
        weekly_top3 = await engine.generate_weekly_summary(request.user_id)

        # Fetch patterns and generate interventions
        patterns = await _fetch_user_patterns(request.user_id, session)
        interventions = await engine.generate_intervention_suggestions(patterns)

        # Calculate time estimates for top objectives
        time_estimates = []
        for obj in weekly_top3:
            current_score, trend = await _fetch_objective_performance(
                request.user_id, obj.objective_id, session
            )
            hours = await engine.estimate_time_to_mastery(obj.objective_id, current_score, trend)
            if hours:
                time_estimates.append(TimeToMasteryEstimate(
                    objective_id=obj.objective_id,
                    objective_name=obj.objective_name,
                    current_score=current_score,
                    hours_to_mastery=float(hours),
                    weeks_to_mastery=round(hours / 7, 1)
                ))

        # Calculate overall exam success probability (simplified)
        # In production, use PredictiveAnalyticsEngine for this
        exam_probability = 0.75  # Placeholder

        return RecommendationData(
            user_id=request.user_id,
            daily_insight=daily_insight,
            weekly_top3=weekly_top3,
            interventions=interventions,
            time_estimates=time_estimates,
            exam_success_probability=exam_probability
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comprehensive recommendations failed: {str(e)}")


# ============================================================================
# Helper Functions (would be in separate module in production)
# ============================================================================

async def _fetch_user_patterns(user_id: str, session: AsyncSession) -> dict:
    """
    Fetch user's comprehension patterns for intervention suggestions.

    In production, use ComprehensionPatternAnalyzer.
    """
    from sqlalchemy import text

    query = text("""
        SELECT
            COUNT(CASE WHEN vr.calibration_delta > 15 THEN 1 END) as overconfident_count,
            AVG(CASE WHEN vp.dimension = 'reasoning' THEN vr.score * 100 END) as avg_reasoning,
            AVG(vr.score * 100) as avg_retention,
            COUNT(CASE WHEN avg_score < 70 THEN 1 END) as bottleneck_count,
            0 as regression_count
        FROM validation_responses vr
        JOIN validation_prompts vp ON vr.prompt_id = vp.id
        WHERE vr.user_id = :user_id
          AND vr.responded_at >= NOW() - INTERVAL '90 days'
    """)

    result = await session.execute(query, {"user_id": user_id})
    row = result.fetchone()

    if not row:
        return {
            "overconfident_count": 0,
            "avg_reasoning": 70.0,
            "avg_retention": 70.0,
            "bottleneck_count": 0,
            "regression_count": 0
        }

    return {
        "overconfident_count": row.overconfident_count,
        "avg_reasoning": row.avg_reasoning or 70.0,
        "avg_retention": row.avg_retention or 70.0,
        "bottleneck_count": row.bottleneck_count,
        "regression_count": row.regression_count
    }


async def _fetch_objective_performance(
    user_id: str,
    objective_id: str,
    session: AsyncSession
) -> tuple[float, float]:
    """
    Fetch current score and weekly trend for an objective.

    Returns: (current_score, trend_per_week)
    """
    from sqlalchemy import text

    query = text("""
        WITH weekly_scores AS (
            SELECT
                DATE_TRUNC('week', vr.responded_at) as week,
                AVG(vr.score * 100) as avg_score
            FROM validation_responses vr
            JOIN validation_prompts vp ON vr.prompt_id = vp.id
            WHERE vr.user_id = :user_id
              AND vp.objective_id = :objective_id
              AND vr.responded_at >= NOW() - INTERVAL '90 days'
            GROUP BY week
            ORDER BY week DESC
        )
        SELECT
            (SELECT avg_score FROM weekly_scores LIMIT 1) as current_score,
            CASE
                WHEN COUNT(*) >= 2 THEN
                    (MAX(avg_score) - MIN(avg_score)) / NULLIF(COUNT(*) - 1, 0)
                ELSE 0
            END as trend
        FROM weekly_scores
    """)

    result = await session.execute(query, {
        "user_id": user_id,
        "objective_id": objective_id
    })
    row = result.fetchone()

    if not row or row.current_score is None:
        return (65.0, 0.0)  # Default values

    return (row.current_score, row.trend or 0.0)


async def _get_objective_name(objective_id: str, session: AsyncSession) -> str:
    """Get objective name by ID."""
    from sqlalchemy import text

    query = text("SELECT objective FROM learning_objectives WHERE id = :objective_id")
    result = await session.execute(query, {"objective_id": objective_id})
    row = result.fetchone()

    return row.objective if row else f"Objective {objective_id}"


# ============================================================================
# TypeScript Integration Example (Next.js API Route)
# ============================================================================

"""
// /apps/web/app/api/analytics/daily-insight/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { userId } = await request.json();

  // Call Python FastAPI service
  const response = await fetch('http://localhost:8000/analytics/daily-insight', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: 'Failed to generate daily insight' },
      { status: 500 }
    );
  }

  const insight = await response.json();
  return NextResponse.json(insight);
}
"""

# ============================================================================
# React Component Example
# ============================================================================

"""
// /apps/web/src/components/study/DailyInsightCard.tsx

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

interface DailyInsight {
  title: string;
  description: string;
  action_items: string[];
  estimated_time_minutes: number;
}

export function DailyInsightCard({ userId }: { userId: string }) {
  const [insight, setInsight] = useState<DailyInsight | null>(null);

  useEffect(() => {
    fetch('/api/analytics/daily-insight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
      .then(res => res.json())
      .then(data => setInsight(data));
  }, [userId]);

  if (!insight) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader>
        <h2>{insight.title}</h2>
      </CardHeader>
      <CardContent>
        <p>{insight.description}</p>
        <h3>Action Items:</h3>
        <ul>
          {insight.action_items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
        <p>Estimated Time: {insight.estimated_time_minutes} minutes</p>
      </CardContent>
    </Card>
  );
}
"""
