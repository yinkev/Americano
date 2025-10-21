"""
Longitudinal Progress Tracker for Story 4.6.

Tracks learning progress over time, detects milestones and regressions,
and predicts mastery achievement dates using linear regression.
"""

from typing import List, Optional, Tuple, Dict
from datetime import datetime, timedelta
import numpy as np
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from .models import (
    Milestone,
    Regression,
    GrowthTrajectory,
    ImprovementRate,
)


class MetricPoint:
    """Simple dataclass for metric aggregation."""
    def __init__(self, date: datetime, dimension: str, score: float, sample_size: int, trend: str):
        self.date = date
        self.dimension = dimension
        self.score = score
        self.sample_size = sample_size
        self.trend = trend


class LongitudinalProgressTracker:
    """
    Track learning progress over time and predict mastery dates.

    Features:
    - Historical metrics aggregation by week/month
    - Milestone detection (mastery, improvements, streaks)
    - Regression detection (performance declines)
    - Growth trajectory prediction using linear regression
    - Improvement rate calculation (WoW, MoM)
    """

    def __init__(self, session: AsyncSession):
        self.session = session

    async def fetch_historical_metrics(
        self,
        user_id: str,
        dimensions: List[str],
        date_range: str
    ) -> List[MetricPoint]:
        """
        Fetch aggregated metrics by week.

        Args:
            user_id: User to analyze
            dimensions: List of dimensions to include (comprehension, reasoning, calibration, mastery)
            date_range: Time window (7d, 30d, 90d, 1y, all)

        Returns:
            List of MetricPoint with weekly aggregated scores
        """
        # Parse date range to get days
        days = self._parse_date_range_to_days(date_range)
        start_date = datetime.utcnow() - timedelta(days=days)

        # Build dimension filter
        dimension_filter = "(" + ", ".join([f"'{d}'" for d in dimensions]) + ")"

        # Query with weekly aggregation
        # Uses DATE_TRUNC to group by week
        query = text(f"""
            SELECT
                DATE_TRUNC('week', vr.responded_at) as week_start,
                vp.dimension,
                AVG(vr.score * 100) as avg_score,
                COUNT(*) as sample_count,
                LAG(AVG(vr.score * 100)) OVER (
                    PARTITION BY vp.dimension
                    ORDER BY DATE_TRUNC('week', vr.responded_at)
                ) as previous_avg_score
            FROM validation_responses vr
            JOIN validation_prompts vp ON vr.prompt_id = vp.id
            WHERE vr.user_id = :user_id
              AND vr.responded_at >= :start_date
              AND vp.dimension IN {dimension_filter}
            GROUP BY week_start, vp.dimension
            ORDER BY week_start DESC, vp.dimension
        """)

        result = await self.session.execute(query, {
            "user_id": user_id,
            "start_date": start_date
        })
        rows = result.fetchall()

        # Convert to MetricPoint objects with trend calculation
        metrics = []
        for row in rows:
            # Determine trend based on comparison with previous week
            if row.previous_avg_score is None:
                trend = "stable"
            elif row.avg_score > row.previous_avg_score + 2:
                trend = "up"
            elif row.avg_score < row.previous_avg_score - 2:
                trend = "down"
            else:
                trend = "stable"

            metrics.append(MetricPoint(
                date=row.week_start,
                dimension=row.dimension,
                score=row.avg_score,
                sample_size=row.sample_count,
                trend=trend
            ))

        return metrics

    async def detect_milestones(
        self,
        user_id: str,
        metrics: List[MetricPoint]
    ) -> List[Milestone]:
        """
        Identify achievement milestones.

        Milestone types:
        - mastery_verified: Score >= 80% (previously < 80%)
        - major_improvement: Score jump >= 20 points
        - streak_achieved: 3+ consecutive weeks of improvement

        Args:
            user_id: User to analyze
            metrics: Historical metric points

        Returns:
            List of detected milestones
        """
        milestones = []

        # Group metrics by objective (use dimension as proxy)
        by_dimension: Dict[str, List[MetricPoint]] = {}
        for metric in metrics:
            if metric.dimension not in by_dimension:
                by_dimension[metric.dimension] = []
            by_dimension[metric.dimension].append(metric)

        # Sort each group by date (oldest first for analysis)
        for dim in by_dimension:
            by_dimension[dim].sort(key=lambda m: m.date)

        # Detect milestones for each dimension
        for dimension, dim_metrics in by_dimension.items():
            # Check for mastery milestone (crossed 80% threshold)
            for i in range(1, len(dim_metrics)):
                prev_score = dim_metrics[i - 1].score
                curr_score = dim_metrics[i].score

                # Mastery achieved
                if prev_score < 80 and curr_score >= 80:
                    milestones.append(Milestone(
                        objective_id=f"{dimension}_obj",  # Placeholder
                        objective_name=dimension.replace('_', ' ').title(),
                        milestone_type="mastery_verified",
                        date_achieved=dim_metrics[i].date,
                        description=f"Reached mastery threshold (80%) in {dimension}",
                        score_before=prev_score,
                        score_after=curr_score
                    ))

                # Major improvement (>= 20 points jump)
                elif curr_score - prev_score >= 20:
                    milestones.append(Milestone(
                        objective_id=f"{dimension}_obj",
                        objective_name=dimension.replace('_', ' ').title(),
                        milestone_type="major_improvement",
                        date_achieved=dim_metrics[i].date,
                        description=f"Improved by {curr_score - prev_score:.1f} points",
                        score_before=prev_score,
                        score_after=curr_score
                    ))

            # Check for streak (3+ consecutive weeks improving)
            streak_count = 0
            for i in range(1, len(dim_metrics)):
                if dim_metrics[i].trend == "up":
                    streak_count += 1
                    if streak_count >= 3:
                        # Only record streak once
                        if i == 3 or dim_metrics[i - 1].trend != "up":
                            milestones.append(Milestone(
                                objective_id=f"{dimension}_obj",
                                objective_name=dimension.replace('_', ' ').title(),
                                milestone_type="streak_achieved",
                                date_achieved=dim_metrics[i].date,
                                description=f"Maintained {streak_count}-week improvement streak",
                                score_before=None,
                                score_after=None
                            ))
                else:
                    streak_count = 0

        return milestones

    async def detect_regressions(
        self,
        user_id: str,
        metrics: List[MetricPoint]
    ) -> List[Regression]:
        """
        Identify performance declines in previously mastered topics.

        Regression criteria:
        - Previously mastered (score >= 80%)
        - Current score dropped > 15 points

        Severity levels:
        - critical: decline > 30 points
        - high: decline > 25 points
        - medium: decline > 20 points
        - low: decline >= 15 points

        Args:
            user_id: User to analyze
            metrics: Historical metric points

        Returns:
            List of detected regressions
        """
        regressions = []

        # Group by dimension
        by_dimension: Dict[str, List[MetricPoint]] = {}
        for metric in metrics:
            if metric.dimension not in by_dimension:
                by_dimension[metric.dimension] = []
            by_dimension[metric.dimension].append(metric)

        # Sort by date (oldest first)
        for dim in by_dimension:
            by_dimension[dim].sort(key=lambda m: m.date)

        # Detect regressions
        for dimension, dim_metrics in by_dimension.items():
            # Find highest score that was >= 80 (mastery level)
            mastery_achieved = False
            highest_mastery_score = 0.0
            highest_mastery_date = None

            for metric in dim_metrics:
                if metric.score >= 80:
                    mastery_achieved = True
                    if metric.score > highest_mastery_score:
                        highest_mastery_score = metric.score
                        highest_mastery_date = metric.date

            if not mastery_achieved:
                continue

            # Check current score (most recent)
            current_metric = dim_metrics[-1]
            current_score = current_metric.score
            decline = highest_mastery_score - current_score

            # Detect regression if decline > 15 points
            if decline > 15:
                # Calculate days since highest score
                days_since_review = (current_metric.date - highest_mastery_date).days

                # Determine severity
                if decline > 30:
                    severity = "critical"
                elif decline > 25:
                    severity = "high"
                elif decline > 20:
                    severity = "medium"
                else:
                    severity = "low"

                # Generate possible causes
                possible_causes = []
                if days_since_review > 60:
                    possible_causes.append("Long gap since last review (>60 days)")
                if current_metric.sample_size < 3:
                    possible_causes.append("Insufficient recent practice")
                if decline > 25:
                    possible_causes.append("Significant knowledge decay")
                if not possible_causes:
                    possible_causes.append("Natural forgetting curve")

                regressions.append(Regression(
                    objective_id=f"{dimension}_obj",
                    objective_name=dimension.replace('_', ' ').title(),
                    score_before=highest_mastery_score,
                    score_after=current_score,
                    decline_amount=decline,
                    date_detected=current_metric.date,
                    possible_causes=possible_causes
                ))

        return regressions

    async def predict_growth_trajectory(
        self,
        objective_id: str,
        historical_scores: List[float]
    ) -> Optional[GrowthTrajectory]:
        """
        Predict mastery achievement date using linear regression.

        Algorithm:
        1. Requires >= 3 data points
        2. Fit linear regression: score = slope * week + intercept
        3. Calculate R² for confidence
        4. Extrapolate to 80% threshold

        Args:
            objective_id: Objective to predict
            historical_scores: Time-ordered scores (oldest to newest)

        Returns:
            GrowthTrajectory with prediction, or None if insufficient data
        """
        # Need at least 3 data points for meaningful regression
        if len(historical_scores) < 3:
            return None

        # Handle edge case: already at mastery
        current_score = historical_scores[-1]
        if current_score >= 80:
            return None

        # Prepare data for linear regression
        # x = week indices (0, 1, 2, ...)
        # y = scores
        x = np.array(range(len(historical_scores)), dtype=float)
        y = np.array(historical_scores, dtype=float)

        try:
            # Fit linear regression using numpy polyfit (degree 1)
            coeffs = np.polyfit(x, y, 1)  # returns [slope, intercept]
            slope, intercept = coeffs

            # Calculate R² (coefficient of determination)
            y_pred = np.polyval(coeffs, x)
            ss_res = np.sum((y - y_pred) ** 2)
            ss_tot = np.sum((y - np.mean(y)) ** 2)

            # Handle edge case: zero variance
            if ss_tot == 0:
                r_squared = 0.0
            else:
                r_squared = 1 - (ss_res / ss_tot)

            # Ensure R² is in [0, 1] range (can be negative for bad fits)
            r_squared = max(0.0, min(1.0, r_squared))

            # Calculate weeks to reach 80% threshold
            if slope <= 0:
                # No positive trend, cannot predict mastery
                predicted_days = None
            else:
                weeks_to_80 = (80 - intercept) / slope
                current_week = len(historical_scores) - 1
                weeks_remaining = max(0, weeks_to_80 - current_week)
                predicted_days = int(weeks_remaining * 7)

            # Get objective name (placeholder - would query database in real impl)
            objective_name = f"Objective {objective_id}"

            return GrowthTrajectory(
                objective_id=objective_id,
                objective_name=objective_name,
                slope=float(slope),
                intercept=float(intercept),
                r_squared=float(r_squared),
                predicted_days_to_mastery=predicted_days
            )

        except Exception as e:
            # Handle numerical errors (e.g., singular matrix)
            print(f"⚠️  Linear regression failed for {objective_id}: {e}")
            return None

    async def calculate_improvement_rates(
        self,
        metrics: List[MetricPoint]
    ) -> Dict[str, ImprovementRate]:
        """
        Calculate week-over-week and month-over-month improvement percentages.

        Algorithm:
        1. Current week: last 7 days average
        2. Previous week: 7-14 days ago average
        3. Week-over-week: (current - previous) / previous * 100
        4. Same logic for month-over-month (30-day windows)

        Args:
            metrics: Historical metric points (sorted by date)

        Returns:
            Dict with 'week' and 'month' ImprovementRate objects
        """
        now = datetime.utcnow()

        # Calculate weekly improvement rate
        current_week_scores = [
            m.score for m in metrics
            if (now - m.date).days <= 7
        ]
        previous_week_scores = [
            m.score for m in metrics
            if 7 < (now - m.date).days <= 14
        ]

        if current_week_scores and previous_week_scores:
            current_week_avg = np.mean(current_week_scores)
            previous_week_avg = np.mean(previous_week_scores)

            if previous_week_avg > 0:
                weekly_change = ((current_week_avg - previous_week_avg) / previous_week_avg) * 100
            else:
                weekly_change = 0.0

            # Determine trend
            if abs(weekly_change) < 2:
                weekly_trend = "stable"
            elif weekly_change > 0:
                weekly_trend = "accelerating"
            else:
                weekly_trend = "decelerating"
        else:
            weekly_change = 0.0
            weekly_trend = "stable"

        # Calculate monthly improvement rate
        current_month_scores = [
            m.score for m in metrics
            if (now - m.date).days <= 30
        ]
        previous_month_scores = [
            m.score for m in metrics
            if 30 < (now - m.date).days <= 60
        ]

        if current_month_scores and previous_month_scores:
            current_month_avg = np.mean(current_month_scores)
            previous_month_avg = np.mean(previous_month_scores)

            if previous_month_avg > 0:
                monthly_change = ((current_month_avg - previous_month_avg) / previous_month_avg) * 100
            else:
                monthly_change = 0.0

            # Determine trend
            if abs(monthly_change) < 2:
                monthly_trend = "stable"
            elif monthly_change > 0:
                monthly_trend = "accelerating"
            else:
                monthly_trend = "decelerating"
        else:
            monthly_change = 0.0
            monthly_trend = "stable"

        return {
            "week": ImprovementRate(
                period="week",
                rate=float(weekly_change),
                trend=weekly_trend
            ),
            "month": ImprovementRate(
                period="month",
                rate=float(monthly_change),
                trend=monthly_trend
            )
        }

    # ========================================================================
    # Helper Methods
    # ========================================================================

    def _parse_date_range_to_days(self, date_range: str) -> int:
        """Convert date range string to number of days."""
        if date_range == "7d":
            return 7
        elif date_range == "30d":
            return 30
        elif date_range == "90d":
            return 90
        elif date_range == "1y":
            return 365
        else:  # "all"
            return 365 * 5  # 5 years max
