"""
Comprehension Pattern Analyzer for Story 4.6.

Uses ChatMock (GPT-5) via instructor for AI-generated insights.
Analyzes strengths, weaknesses, and calibration issues.
"""

from typing import List
from datetime import datetime, timedelta
import instructor
from openai import OpenAI
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import settings
from .models import (
    ComprehensionPattern,
    ObjectiveStrength,
    ObjectiveWeakness,
    CalibrationIssue,
    AIInsight,
)


# Initialize instructor client
client = instructor.from_openai(OpenAI(api_key=settings.openai_api_key))


class InsightData(BaseModel):
    """Structured output model for ChatMock insights."""
    insights: List[AIInsight] = Field(
        ...,
        min_length=3,
        max_length=5,
        description="3-5 actionable insights from pattern analysis"
    )


class ComprehensionPatternAnalyzer:
    """
    Analyzes comprehension patterns using percentile ranking and AI insights.

    Features:
    - Strengths: Top 10% percentile objectives
    - Weaknesses: Bottom 10% percentile objectives
    - Calibration issues: Overconfident (Δ > 15), underconfident (Δ < -15)
    - AI insights: ChatMock (GPT-5) structured output via instructor
    """

    def __init__(self, session: AsyncSession):
        self.session = session

    async def analyze_patterns(
        self,
        user_id: str,
        date_range: str = "30d"
    ) -> ComprehensionPattern:
        """
        Analyze user's comprehension patterns.

        Args:
            user_id: User to analyze
            date_range: Time window (7d, 30d, 90d, 1y, all)

        Returns:
            ComprehensionPattern with strengths, weaknesses, issues, and AI insights
        """
        # Parse date range
        start_date, end_date = self._parse_date_range(date_range)

        # Query all objectives with scores
        query = text("""
            SELECT
                lo.id as objective_id,
                lo.objective as objective_name,
                AVG(vr.score * 100) as avg_score,
                AVG(vr.calibration_delta) as avg_calibration_delta,
                COUNT(*) as response_count
            FROM learning_objectives lo
            JOIN validation_prompts vp ON vp.objective_id = lo.id
            JOIN validation_responses vr ON vr.prompt_id = vp.id
            WHERE vr.user_id = :user_id
            AND vr.responded_at BETWEEN :start_date AND :end_date
            GROUP BY lo.id, lo.objective
            HAVING COUNT(*) >= 2
        """)

        result = await self.session.execute(query, {
            "user_id": user_id,
            "start_date": start_date,
            "end_date": end_date
        })
        objectives = result.fetchall()

        if not objectives:
            return self._empty_pattern(user_id, start_date, end_date)

        # Calculate percentiles
        scores = [obj.avg_score for obj in objectives]
        p10 = self._percentile(scores, 10)
        p90 = self._percentile(scores, 90)

        # Identify strengths (top 10%)
        strengths = [
            ObjectiveStrength(
                objective_id=obj.objective_id,
                objective_name=obj.objective_name,
                score=obj.avg_score,
                percentile_rank=self._calculate_percentile_rank(obj.avg_score, scores)
            )
            for obj in objectives if obj.avg_score >= p90
        ]

        # Identify weaknesses (bottom 10%)
        weaknesses = [
            ObjectiveWeakness(
                objective_id=obj.objective_id,
                objective_name=obj.objective_name,
                score=obj.avg_score,
                percentile_rank=self._calculate_percentile_rank(obj.avg_score, scores)
            )
            for obj in objectives if obj.avg_score <= p10
        ]

        # Identify calibration issues
        calibration_issues = []
        for obj in objectives:
            if obj.avg_calibration_delta is None:
                continue

            delta = obj.avg_calibration_delta
            if delta > 15:
                category = "overconfident"
                desc = f"Confidence exceeds performance by {delta:.1f} points"
            elif delta < -15:
                category = "underconfident"
                desc = f"Performance exceeds confidence by {abs(delta):.1f} points"
            elif obj.avg_score < 60 and delta > 10:
                category = "dangerous_gap"
                desc = f"Low score ({obj.avg_score:.1f}) with overconfidence (Δ={delta:.1f})"
            else:
                continue

            calibration_issues.append(CalibrationIssue(
                objective_id=obj.objective_id,
                objective_name=obj.objective_name,
                calibration_delta=delta,
                category=category,
                description=desc
            ))

        # Generate AI insights using instructor
        ai_insights = await self._generate_ai_insights(
            strengths, weaknesses, calibration_issues
        )

        return ComprehensionPattern(
            user_id=user_id,
            strengths=strengths,
            weaknesses=weaknesses,
            calibration_issues=calibration_issues,
            ai_insights=ai_insights,
            analysis_date_range=(start_date, end_date),
        )

    async def _generate_ai_insights(
        self,
        strengths: List[ObjectiveStrength],
        weaknesses: List[ObjectiveWeakness],
        issues: List[CalibrationIssue]
    ) -> List[AIInsight]:
        """
        Generate AI insights using ChatMock (GPT-5) via instructor.

        Temperature: 0.5 for balanced creativity/consistency
        Max tokens: 1500
        """
        # Prepare data summary for prompt
        summary = f"""
        Strengths ({len(strengths)} objectives):
        {', '.join([s.objective_name[:50] for s in strengths[:3]])}

        Weaknesses ({len(weaknesses)} objectives):
        {', '.join([w.objective_name[:50] for w in weaknesses[:3]])}

        Calibration Issues ({len(issues)}):
        {', '.join([f"{i.category}: {i.objective_name[:40]}" for i in issues[:3]])}
        """

        system_prompt = """You are a medical education advisor analyzing comprehension patterns.
Your task is to provide 3-5 actionable insights based on the data summary.

Format each insight as:
- category: "strength", "weakness", "pattern", or "recommendation"
- observation: What you observed (10-200 chars)
- action: Recommended action (10-200 chars)
- confidence: 0.0-1.0 confidence score"""

        try:
            # Use instructor for structured output
            insight_data: InsightData = client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Analyze these comprehension patterns:\n\n{summary}"}
                ],
                response_model=InsightData,
                temperature=0.5,
                max_tokens=1500,
            )

            return insight_data.insights

        except Exception as e:
            print(f"⚠️  AI insight generation failed: {e}")
            # Return fallback insights
            return [
                AIInsight(
                    category="pattern",
                    observation="Data analysis completed successfully",
                    action="Review detailed metrics for specific recommendations",
                    confidence=0.8
                )
            ]

    def _parse_date_range(self, date_range: str) -> tuple[datetime, datetime]:
        """Parse date range string to start/end datetimes."""
        end_date = datetime.utcnow()

        if date_range == "7d":
            start_date = end_date - timedelta(days=7)
        elif date_range == "30d":
            start_date = end_date - timedelta(days=30)
        elif date_range == "90d":
            start_date = end_date - timedelta(days=90)
        elif date_range == "1y":
            start_date = end_date - timedelta(days=365)
        else:  # "all"
            start_date = datetime(2020, 1, 1)

        return start_date, end_date

    def _percentile(self, data: List[float], percentile: int) -> float:
        """Calculate percentile value."""
        if not data:
            return 0.0
        sorted_data = sorted(data)
        index = int(len(sorted_data) * percentile / 100)
        return sorted_data[min(index, len(sorted_data) - 1)]

    def _calculate_percentile_rank(self, score: float, all_scores: List[float]) -> float:
        """Calculate percentile rank for a score."""
        if not all_scores:
            return 50.0
        below_count = sum(1 for s in all_scores if s < score)
        return (below_count / len(all_scores)) * 100

    def _empty_pattern(self, user_id: str, start: datetime, end: datetime) -> ComprehensionPattern:
        """Return empty pattern when no data available."""
        return ComprehensionPattern(
            user_id=user_id,
            strengths=[],
            weaknesses=[],
            calibration_issues=[],
            ai_insights=[AIInsight(
                category="recommendation",
                observation="Insufficient data for analysis",
                action="Complete more validation prompts to generate insights",
                confidence=1.0
            )],
            analysis_date_range=(start, end),
        )
