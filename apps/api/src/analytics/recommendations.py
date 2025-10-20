"""
Recommendation Engine for Story 4.6 - Comprehensive Understanding Analytics.

Generates personalized AI-powered study recommendations using ChatMock (GPT-5) via instructor.
Provides daily insights, weekly priorities, intervention suggestions, and time estimates.
"""

from typing import List, Dict, Optional
from datetime import datetime, timedelta
import instructor
from openai import OpenAI
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import settings
from .models import (
    DailyInsight,
    WeeklyTopObjective,
    InterventionSuggestion,
)


# Initialize instructor client
client = instructor.from_openai(OpenAI(api_key=settings.openai_api_key))


# ============================================================================
# Structured Response Models for ChatMock AI
# ============================================================================

class WeeklySummary(BaseModel):
    """Structured output from ChatMock for weekly top objectives."""
    top_objectives: List[WeeklyTopObjective] = Field(
        ...,
        min_length=3,
        max_length=3,
        description="Exactly 3 top objectives for the week"
    )
    overall_strategy: str = Field(
        ...,
        min_length=50,
        max_length=300,
        description="Overall learning strategy rationale"
    )


class DailyPriorityInsight(BaseModel):
    """Structured output from ChatMock for daily insight."""
    priority_objective_id: str
    priority_objective_name: str
    insight_category: str  # dangerous_gap, bottleneck, weakness, optimization
    title: str = Field(..., min_length=10, max_length=100)
    description: str = Field(..., min_length=50, max_length=300)
    action_items: List[str] = Field(
        ...,
        min_length=2,
        max_length=4,
        description="2-4 specific actionable items"
    )
    estimated_time_minutes: int = Field(..., gt=0, le=120)


# ============================================================================
# RecommendationEngine Class
# ============================================================================

class RecommendationEngine:
    """
    Generate personalized AI-powered study recommendations.

    Uses ChatMock (GPT-5) via instructor for structured outputs.
    Analyzes user performance patterns to prioritize learning objectives.
    """

    def __init__(self, session: AsyncSession):
        """Initialize with async SQLAlchemy session."""
        self.session = session

    # ========================================================================
    # Method 1: Daily Insight Generation
    # ========================================================================

    async def generate_daily_insight(self, user_id: str) -> DailyInsight:
        """
        Generate highest-priority recommendation for today.

        Priority scoring algorithm:
        1. Query user's current state (gaps, bottlenecks, weaknesses)
        2. Assign priority levels:
           - Level 10: Dangerous gaps (overconfidence + low score)
           - Level 8: Bottleneck objectives (blocking others)
           - Level 6: Weaknesses (bottom 10%)
           - Level 4: Optimization opportunities
        3. Select highest priority issue
        4. Generate AI-powered insight with action items

        Args:
            user_id: User to generate insight for

        Returns:
            DailyInsight with single highest-priority recommendation
        """
        # Query current state to identify highest priority issue
        query = text("""
            WITH objective_stats AS (
                SELECT
                    lo.id as objective_id,
                    lo.objective as objective_name,
                    AVG(vr.score * 100) as avg_score,
                    AVG(vr.calibration_delta) as avg_calibration_delta,
                    COUNT(*) as response_count,
                    MAX(vr.responded_at) as last_attempt
                FROM learning_objectives lo
                JOIN validation_prompts vp ON vp.objective_id = lo.id
                JOIN validation_responses vr ON vr.prompt_id = vp.id
                WHERE vr.user_id = :user_id
                  AND vr.responded_at >= :cutoff_date
                GROUP BY lo.id, lo.objective
                HAVING COUNT(*) >= 2
            )
            SELECT
                objective_id,
                objective_name,
                avg_score,
                avg_calibration_delta,
                response_count,
                last_attempt,
                CASE
                    -- Dangerous gap: low score + overconfidence
                    WHEN avg_score < 60 AND avg_calibration_delta > 10 THEN 10
                    -- Bottleneck: low score + old attempt (blocks progress)
                    WHEN avg_score < 70 AND EXTRACT(EPOCH FROM (NOW() - last_attempt)) / 86400 > 30 THEN 8
                    -- Weakness: bottom performers
                    WHEN avg_score < 65 THEN 6
                    -- Optimization: moderate performers with potential
                    WHEN avg_score BETWEEN 65 AND 79 THEN 4
                    ELSE 2
                END as priority_score
            FROM objective_stats
            ORDER BY priority_score DESC, avg_score ASC
            LIMIT 1
        """)

        result = await self.session.execute(query, {
            "user_id": user_id,
            "cutoff_date": datetime.utcnow() - timedelta(days=90)
        })
        row = result.fetchone()

        if not row:
            # No data available - return default insight
            return DailyInsight(
                user_id=user_id,
                priority_objective_id="onboarding",
                priority_objective_name="Get Started",
                insight_category="optimization",
                title="Begin Your Learning Journey",
                description="Complete your first validation prompt to start building your personalized learning analytics.",
                action_items=[
                    "Navigate to the Study page",
                    "Select a learning objective to begin"
                ],
                estimated_time_minutes=15
            )

        # Determine insight category based on priority
        if row.priority_score >= 10:
            category = "dangerous_gap"
        elif row.priority_score >= 8:
            category = "bottleneck"
        elif row.priority_score >= 6:
            category="weakness"
        else:
            category = "optimization"

        # Generate AI insight using ChatMock
        system_prompt = """You are a medical education advisor providing daily study recommendations.

Your role:
- Analyze the student's highest-priority learning need
- Provide a clear, actionable daily insight
- Focus on clinical readiness and board exam preparation
- Keep recommendations specific and achievable within 30-60 minutes

Output format:
- title: Concise recommendation title (10-100 chars)
- description: Clear explanation of why this matters (50-300 chars)
- action_items: 2-4 specific steps the student should take
- estimated_time_minutes: Realistic time estimate (5-120 minutes)"""

        data_summary = f"""
Student Performance Data:
- Objective: {row.objective_name}
- Current Score: {row.avg_score:.1f}%
- Calibration Delta: {row.avg_calibration_delta:.1f} (positive = overconfident)
- Practice Count: {row.response_count}
- Priority Level: {row.priority_score}/10
- Category: {category}

Generate a focused daily insight for this highest-priority need.
"""

        try:
            # Use instructor for structured output
            ai_insight: DailyPriorityInsight = client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": data_summary}
                ],
                response_model=DailyPriorityInsight,
                temperature=0.3,  # Low temperature for consistent recommendations
                max_tokens=1500,
            )

            return DailyInsight(
                user_id=user_id,
                priority_objective_id=row.objective_id,
                priority_objective_name=row.objective_name,
                insight_category=ai_insight.insight_category,
                title=ai_insight.title,
                description=ai_insight.description,
                action_items=ai_insight.action_items,
                estimated_time_minutes=ai_insight.estimated_time_minutes
            )

        except Exception as e:
            print(f"⚠️  AI daily insight generation failed: {e}")
            # Return fallback insight
            return DailyInsight(
                user_id=user_id,
                priority_objective_id=row.objective_id,
                priority_objective_name=row.objective_name,
                insight_category=category,
                title=f"Focus on {row.objective_name}",
                description=f"This objective shows a score of {row.avg_score:.1f}% and requires attention to reach mastery.",
                action_items=[
                    f"Review core concepts for {row.objective_name}",
                    "Complete 3 practice scenarios",
                    "Test your understanding with follow-up questions"
                ],
                estimated_time_minutes=45
            )

    # ========================================================================
    # Method 2: Weekly Summary Generation
    # ========================================================================

    async def generate_weekly_summary(self, user_id: str) -> List[WeeklyTopObjective]:
        """
        Generate top 3 objectives for the week using ChatMock AI.

        Algorithm:
        1. Query user's current performance across all objectives
        2. Calculate priority scores (similar to daily insight)
        3. Use ChatMock to select top 3 with rationale
        4. Return structured WeeklyTopObjective list

        Args:
            user_id: User to generate weekly summary for

        Returns:
            List of 3 WeeklyTopObjective with AI-generated rationale
        """
        # Query all objectives with performance data
        query = text("""
            SELECT
                lo.id as objective_id,
                lo.objective as objective_name,
                AVG(vr.score * 100) as avg_score,
                AVG(vr.calibration_delta) as avg_calibration_delta,
                COUNT(*) as response_count,
                STDDEV(vr.score * 100) as score_variability,
                MAX(vr.responded_at) as last_attempt
            FROM learning_objectives lo
            JOIN validation_prompts vp ON vp.objective_id = lo.id
            JOIN validation_responses vr ON vr.prompt_id = vp.id
            WHERE vr.user_id = :user_id
              AND vr.responded_at >= :cutoff_date
            GROUP BY lo.id, lo.objective
            HAVING COUNT(*) >= 2
            ORDER BY
                -- Prioritize: low scores, high calibration issues, stale attempts
                (CASE
                    WHEN avg_score < 60 THEN 10
                    WHEN avg_score < 70 THEN 8
                    WHEN avg_score < 80 THEN 6
                    ELSE 4
                END) +
                (CASE WHEN avg_calibration_delta > 15 THEN 3 ELSE 0 END) +
                (CASE WHEN EXTRACT(EPOCH FROM (NOW() - last_attempt)) / 86400 > 30 THEN 2 ELSE 0 END)
                DESC
            LIMIT 10
        """)

        result = await self.session.execute(query, {
            "user_id": user_id,
            "cutoff_date": datetime.utcnow() - timedelta(days=90)
        })
        objectives = result.fetchall()

        if not objectives or len(objectives) == 0:
            # Return default objectives for new users
            return [
                WeeklyTopObjective(
                    objective_id="default_1",
                    objective_name="Begin Your Learning Journey",
                    rationale="Start with foundational concepts to build a strong knowledge base for advanced topics.",
                    estimated_hours=3.0
                ),
                WeeklyTopObjective(
                    objective_id="default_2",
                    objective_name="Practice Clinical Reasoning",
                    rationale="Develop critical thinking skills essential for board exams and patient care.",
                    estimated_hours=4.0
                ),
                WeeklyTopObjective(
                    objective_id="default_3",
                    objective_name="Build Confidence Calibration",
                    rationale="Learn to accurately assess your knowledge to avoid dangerous overconfidence gaps.",
                    estimated_hours=2.0
                )
            ]

        # Calculate summary statistics for prompt
        avg_comprehension = sum(obj.avg_score for obj in objectives) / len(objectives)
        mastery_count = sum(1 for obj in objectives if obj.avg_score >= 80)
        total_objectives = len(objectives)
        dangerous_gaps = sum(1 for obj in objectives if obj.avg_score < 60 and obj.avg_calibration_delta > 10)
        bottlenecks = sum(1 for obj in objectives if obj.avg_score < 70)
        weaknesses = sum(1 for obj in objectives if obj.avg_score < 65)

        # Prepare data for ChatMock
        objectives_summary = "\n".join([
            f"- {obj.objective_name}: Score {obj.avg_score:.1f}%, Calibration Δ{obj.avg_calibration_delta:.1f}, "
            f"Attempts: {obj.response_count}, Last: {obj.last_attempt.strftime('%Y-%m-%d')}"
            for obj in objectives[:10]
        ])

        system_prompt = """You are a medical education advisor analyzing a medical student's performance.

Based on their comprehensive understanding validation metrics, recommend the top 3 learning objectives to prioritize this week.

Consider:
- Dangerous gaps (overconfidence + low score) - HIGHEST PRIORITY
- Bottleneck objectives (low score + blocks progress) - HIGH PRIORITY
- Weaknesses (bottom performers) - MEDIUM PRIORITY
- Time efficiency (focus on high-impact objectives)
- Board exam relevance (USMLE/COMLEX alignment)

For each objective, provide:
- rationale: Why this objective should be prioritized (50-200 chars)
- estimated_hours: Realistic study time needed (1-20 hours)

Select objectives that maximize learning impact within 10-15 hours/week."""

        data_summary = f"""
Current Performance Summary:
- Average Comprehension: {avg_comprehension:.1f}%
- Mastery Count: {mastery_count}/{total_objectives} objectives
- Dangerous Gaps: {dangerous_gaps}
- Bottleneck Objectives: {bottlenecks}
- Weaknesses: {weaknesses}

Top 10 Objectives by Priority:
{objectives_summary}

Available Study Time: 10-15 hours this week

Select the top 3 objectives to focus on and explain your strategy.
"""

        try:
            # Use instructor for structured output
            weekly_summary: WeeklySummary = client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": data_summary}
                ],
                response_model=WeeklySummary,
                temperature=0.5,  # Balanced creativity for recommendations
                max_tokens=2000,
            )

            return weekly_summary.top_objectives

        except Exception as e:
            print(f"⚠️  AI weekly summary generation failed: {e}")
            # Return fallback: top 3 by priority score
            fallback_objectives = []
            for i, obj in enumerate(objectives[:3]):
                fallback_objectives.append(WeeklyTopObjective(
                    objective_id=obj.objective_id,
                    objective_name=obj.objective_name,
                    rationale=f"Priority #{i+1}: Current score {obj.avg_score:.1f}% indicates room for improvement to reach mastery threshold.",
                    estimated_hours=5.0
                ))
            return fallback_objectives

    # ========================================================================
    # Method 3: Intervention Suggestions
    # ========================================================================

    async def generate_intervention_suggestions(
        self,
        patterns: Dict
    ) -> List[InterventionSuggestion]:
        """
        Generate pattern-based intervention recommendations.

        Uses predefined intervention mapping for detected patterns.
        No AI used - rule-based mapping for consistency.

        Args:
            patterns: Dict containing detected patterns:
                - overconfident_count: int
                - avg_reasoning: float
                - avg_retention: float
                - bottleneck_count: int
                - regression_count: int

        Returns:
            List of InterventionSuggestion objects
        """
        interventions = []

        # Pattern → Intervention Mapping
        INTERVENTION_MAP = {
            "overconfidence": {
                "pattern_detected": "overconfidence",
                "intervention_type": "more_failure_challenges",
                "description": "Increase controlled failure challenges to expose overconfidence and build accurate self-assessment.",
                "priority": "high",
                "estimated_time_hours": 2.0
            },
            "weak_reasoning": {
                "pattern_detected": "weak_reasoning",
                "intervention_type": "clinical_scenarios",
                "description": "Complete clinical reasoning scenarios to build decision-making skills and diagnostic thinking.",
                "priority": "high",
                "estimated_time_hours": 3.0
            },
            "poor_retention": {
                "pattern_detected": "poor_retention",
                "intervention_type": "spaced_repetition",
                "description": "Implement spaced repetition schedule to combat forgetting curve and strengthen long-term retention.",
                "priority": "medium",
                "estimated_time_hours": 1.5
            },
            "bottleneck_detected": {
                "pattern_detected": "bottleneck_detected",
                "intervention_type": "foundational_review",
                "description": "Focus on foundational concepts that unlock progress in multiple dependent objectives.",
                "priority": "high",
                "estimated_time_hours": 4.0
            },
            "regression_detected": {
                "pattern_detected": "regression_detected",
                "intervention_type": "immediate_review",
                "description": "Urgently review previously mastered topics showing significant performance decline.",
                "priority": "high",
                "estimated_time_hours": 2.5
            }
        }

        # Detect patterns and generate interventions
        if patterns.get("overconfident_count", 0) > 0:
            interventions.append(InterventionSuggestion(**INTERVENTION_MAP["overconfidence"]))

        if patterns.get("avg_reasoning", 100) < 60:
            interventions.append(InterventionSuggestion(**INTERVENTION_MAP["weak_reasoning"]))

        if patterns.get("avg_retention", 100) < 70:
            interventions.append(InterventionSuggestion(**INTERVENTION_MAP["poor_retention"]))

        if patterns.get("bottleneck_count", 0) > 0:
            interventions.append(InterventionSuggestion(**INTERVENTION_MAP["bottleneck_detected"]))

        if patterns.get("regression_count", 0) > 0:
            interventions.append(InterventionSuggestion(**INTERVENTION_MAP["regression_detected"]))

        # Sort by priority (high → medium → low)
        priority_order = {"high": 0, "medium": 1, "low": 2}
        interventions.sort(key=lambda x: priority_order[x.priority])

        return interventions

    # ========================================================================
    # Method 4: Time to Mastery Estimation
    # ========================================================================

    async def estimate_time_to_mastery(
        self,
        objective_id: str,
        current_score: float,
        trend: float
    ) -> Optional[int]:
        """
        Estimate hours needed to reach 80% mastery.

        Algorithm:
        1. Calculate points needed: 80 - current_score
        2. If trend > 0: hours = points_needed / (trend_per_week / 7)
        3. If trend <= 0: return None (declining, mastery unlikely)
        4. If no trend: use empirical average (2 points/hour)
        5. Apply difficulty multiplier based on objective difficulty
        6. Round up and cap at 50 hours

        Args:
            objective_id: Objective to estimate
            current_score: Current score (0-100)
            trend: Weekly improvement trend (points/week)

        Returns:
            Estimated hours to mastery, or None if mastery unlikely
        """
        # Already at mastery
        if current_score >= 80:
            return 0

        points_needed = 80 - current_score

        # Calculate hours based on trend
        if trend > 0:
            # Use trend-based calculation
            points_per_day = trend / 7.0  # Convert weekly trend to daily
            if points_per_day > 0:
                hours = points_needed / points_per_day
            else:
                hours = None
        elif trend == 0:
            # No trend data - use empirical average (2 points/hour)
            hours = points_needed / 2.0
        else:
            # Negative trend - mastery unlikely with current approach
            return None

        if hours is None:
            return None

        # Query objective difficulty for multiplier
        query = text("""
            SELECT difficulty
            FROM learning_objectives
            WHERE id = :objective_id
        """)
        result = await self.session.execute(query, {"objective_id": objective_id})
        row = result.fetchone()

        difficulty = row.difficulty if row else 5  # Default to medium

        # Apply difficulty multiplier
        if difficulty <= 3:
            # Easy objectives
            hours *= 0.8
        elif difficulty <= 6:
            # Medium objectives
            hours *= 1.0
        else:
            # Hard objectives
            hours *= 1.5

        # Round up to nearest hour
        hours = int(np.ceil(hours))

        # Cap at 50 hours (reasonable maximum)
        hours = min(hours, 50)

        return hours

    # ========================================================================
    # Method 5: Success Probability Prediction
    # ========================================================================

    async def predict_success_probability(
        self,
        objective_id: str,
        planned_study_hours: int
    ) -> float:
        """
        Predict probability of mastery given planned study time.

        Simple model:
        1. Get current_score, difficulty, historical_improvement_rate
        2. Estimate achievable_score = current + (hours * rate / difficulty_multiplier)
        3. If achievable >= 80: probability = (achievable - 80) / 20 * user_success_rate
        4. Else: probability = achievable / 80 (partial progress)
        5. Cap at 0.95 (never 100% certain)

        Args:
            objective_id: Objective to predict
            planned_study_hours: Hours user plans to study

        Returns:
            Probability of reaching mastery (0.0 - 1.0)
        """
        # Query current performance and historical rate
        query = text("""
            WITH recent_performance AS (
                SELECT
                    AVG(vr.score * 100) as current_score,
                    COUNT(*) as attempt_count,
                    STDDEV(vr.score * 100) as score_variability
                FROM validation_responses vr
                JOIN validation_prompts vp ON vr.prompt_id = vp.id
                WHERE vp.objective_id = :objective_id
                  AND vr.responded_at >= :recent_cutoff
                GROUP BY vp.objective_id
            ),
            historical_trend AS (
                SELECT
                    COALESCE(
                        (MAX(vr.score * 100) - MIN(vr.score * 100)) /
                        NULLIF(EXTRACT(EPOCH FROM (MAX(vr.responded_at) - MIN(vr.responded_at))) / 3600, 0),
                        2.0
                    ) as improvement_rate_per_hour
                FROM validation_responses vr
                JOIN validation_prompts vp ON vr.prompt_id = vp.id
                WHERE vp.objective_id = :objective_id
                  AND vr.responded_at >= :historical_cutoff
            ),
            user_success_rate AS (
                SELECT
                    COALESCE(
                        COUNT(CASE WHEN vr.score >= 0.8 THEN 1 END)::float / NULLIF(COUNT(*), 0),
                        0.5
                    ) as success_rate
                FROM validation_responses vr
                WHERE vr.user_id = (
                    SELECT user_id
                    FROM validation_responses
                    WHERE prompt_id IN (
                        SELECT id FROM validation_prompts WHERE objective_id = :objective_id
                    )
                    LIMIT 1
                )
            )
            SELECT
                rp.current_score,
                rp.attempt_count,
                rp.score_variability,
                ht.improvement_rate_per_hour,
                usr.success_rate,
                lo.difficulty
            FROM recent_performance rp
            CROSS JOIN historical_trend ht
            CROSS JOIN user_success_rate usr
            CROSS JOIN learning_objectives lo
            WHERE lo.id = :objective_id
        """)

        result = await self.session.execute(query, {
            "objective_id": objective_id,
            "recent_cutoff": datetime.utcnow() - timedelta(days=30),
            "historical_cutoff": datetime.utcnow() - timedelta(days=90)
        })
        row = result.fetchone()

        if not row or row.current_score is None:
            # Insufficient data - return conservative estimate
            return 0.3

        current_score = row.current_score
        improvement_rate = row.improvement_rate_per_hour
        user_success_rate = row.success_rate
        difficulty = row.difficulty

        # Already at mastery
        if current_score >= 80:
            return 0.95

        # Calculate difficulty multiplier
        if difficulty <= 3:
            difficulty_multiplier = 0.8
        elif difficulty <= 6:
            difficulty_multiplier = 1.0
        else:
            difficulty_multiplier = 1.5

        # Estimate achievable score
        estimated_improvement = (planned_study_hours * improvement_rate) / difficulty_multiplier
        achievable_score = current_score + estimated_improvement

        # Calculate probability
        if achievable_score >= 80:
            # Score exceeds threshold - calculate probability based on margin
            margin = achievable_score - 80
            base_probability = min(0.95, 0.5 + (margin / 40))  # 0.5-0.95 range
            # Adjust for user's historical success rate
            probability = base_probability * (0.7 + 0.3 * user_success_rate)
        else:
            # Score below threshold - partial progress probability
            probability = (achievable_score / 80) * 0.7  # Max 0.7 if not reaching threshold

        # Cap at 0.95 (never 100% certain)
        probability = min(probability, 0.95)

        # Floor at 0.05 (always some chance)
        probability = max(probability, 0.05)

        return float(probability)


# ============================================================================
# Helper: Import numpy for calculations
# ============================================================================

import numpy as np
