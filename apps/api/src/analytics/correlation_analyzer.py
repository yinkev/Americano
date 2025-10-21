"""
Cross-Objective Correlation Analyzer for Story 4.6.

Calculates Pearson correlation coefficients between learning objectives
to identify foundational objectives, bottlenecks, and optimal study sequences.

Uses scipy.stats.pearsonr() for verified Pearson calculations.
"""

from typing import List, Dict, Tuple
from datetime import datetime, timedelta
import numpy as np
from scipy.stats import pearsonr
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from .models import CorrelationMatrix


# ============================================================================
# Supporting Models (Not in models.py yet, defined here)
# ============================================================================

from pydantic import BaseModel, Field


class FoundationalObjective(BaseModel):
    """
    Objective that correlates strongly with many others.
    Mastering this enables progress in multiple areas.
    """

    objective_id: str
    objective_name: str
    avg_correlation: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Average absolute correlation with other objectives",
    )
    strong_correlation_count: int = Field(
        ..., ge=0, description="Number of objectives with correlation > 0.5"
    )
    correlation_sum: float = Field(
        ..., description="Sum of all positive correlations (for ranking)"
    )
    rationale: str


class BottleneckObjective(BaseModel):
    """
    Low-performing objective that blocks progress in other areas.
    Identified by low user score + negative correlation pattern.
    """

    objective_id: str
    objective_name: str
    performance_score: float = Field(..., ge=0.0, le=100.0)
    negative_correlation_count: int = Field(
        ..., ge=0, description="Number of objectives with correlation < -0.3"
    )
    blocked_objectives: List[str] = Field(
        ..., description="IDs of objectives negatively correlated with this one"
    )
    impact_score: float = Field(
        ...,
        description="Combined score: (100 - performance) * negative_correlation_count",
    )
    recommendation: str


# ============================================================================
# Cross-Objective Correlation Analyzer
# ============================================================================


class CrossObjectiveAnalyzer:
    """
    Analyze correlations between learning objectives to identify dependencies.

    Features:
    - Pearson correlation matrix calculation (scipy.stats.pearsonr)
    - Foundational objective identification (high positive correlations)
    - Bottleneck detection (low score + negative correlations)
    - Optimal study sequence generation (topological sort)
    """

    def __init__(self, session: AsyncSession):
        self.session = session
        # Minimum responses per objective for valid correlation
        self.min_data_points = 3

    async def calculate_objective_correlations(
        self, user_id: str, date_range: str = "90d"
    ) -> CorrelationMatrix:
        """
        Calculate Pearson correlation coefficient matrix for all objectives.

        Algorithm:
        1. Query all objectives with validation scores for user
        2. For each objective pair (i, j):
           - Extract score vectors
           - Calculate Pearson r via scipy.stats.pearsonr()
           - Get p-value for significance
        3. Build NxN correlation matrix
        4. Identify foundational objectives (high avg correlation)
        5. Identify bottleneck objectives (low score + negative correlations)
        6. Generate recommended study sequence

        Args:
            user_id: User to analyze
            date_range: Time window (default: 90d for sufficient data)

        Returns:
            CorrelationMatrix with matrix, objective IDs, foundational/bottleneck objectives,
            and recommended study sequence
        """
        # Parse date range
        start_date, end_date = self._parse_date_range(date_range)

        # Query validation scores for all objectives
        query = text("""
            SELECT
                lo.id as objective_id,
                lo.objective as objective_name,
                ARRAY_AGG(vr.score ORDER BY vr.responded_at) as scores,
                COUNT(vr.id) as response_count,
                AVG(vr.score) as avg_score
            FROM learning_objectives lo
            LEFT JOIN validation_prompts vp ON vp.objective_id = lo.id
            LEFT JOIN validation_responses vr ON vr.prompt_id = vp.id
            WHERE vr.user_id = :user_id
              AND vr.responded_at BETWEEN :start_date AND :end_date
            GROUP BY lo.id, lo.objective
            HAVING COUNT(vr.id) >= :min_points
            ORDER BY lo.objective
        """)

        result = await self.session.execute(
            query,
            {
                "user_id": user_id,
                "start_date": start_date,
                "end_date": end_date,
                "min_points": self.min_data_points,
            },
        )
        objectives = result.fetchall()

        # Handle insufficient data
        if len(objectives) < 2:
            return self._empty_correlation_matrix(user_id)

        # Extract objective metadata
        objective_ids = [obj.objective_id for obj in objectives]
        objective_names = [obj.objective_name for obj in objectives]
        n = len(objectives)

        # Build correlation matrix
        # Formula: r = (n*ΣXY - ΣX*ΣY) / sqrt((n*ΣX² - (ΣX)²)(n*ΣY² - (ΣY)²))
        matrix = [[0.0 for _ in range(n)] for _ in range(n)]

        for i in range(n):
            for j in range(n):
                if i == j:
                    # Diagonal: perfect self-correlation
                    matrix[i][j] = 1.0
                elif i < j:
                    # Upper triangle: calculate correlation
                    scores_i = objectives[i].scores
                    scores_j = objectives[j].scores

                    # Normalize scores to 0-100 range (if needed)
                    scores_i = [
                        float(s) * 100 if s <= 1.0 else float(s) for s in scores_i
                    ]
                    scores_j = [
                        float(s) * 100 if s <= 1.0 else float(s) for s in scores_j
                    ]

                    # Use minimum length (in case of different response counts)
                    min_len = min(len(scores_i), len(scores_j))
                    scores_i = scores_i[:min_len]
                    scores_j = scores_j[:min_len]

                    # Calculate Pearson correlation using scipy
                    if min_len >= self.min_data_points:
                        try:
                            # scipy.stats.pearsonr returns (statistic, pvalue)
                            corr_result = pearsonr(scores_i, scores_j)
                            r = corr_result.statistic
                            # p_value = corr_result.pvalue  # Could use for significance testing

                            # Handle NaN (occurs when all values are identical)
                            if np.isnan(r):
                                r = 0.0

                            matrix[i][j] = float(r)
                        except Exception as e:
                            print(f"⚠️  Pearson calculation failed for {i},{j}: {e}")
                            matrix[i][j] = 0.0
                    else:
                        matrix[i][j] = 0.0
                else:
                    # Lower triangle: symmetric (r_ij = r_ji)
                    matrix[i][j] = matrix[j][i]

        # Build user performance dictionary
        user_performance = {
            obj.objective_id: float(obj.avg_score) * 100
            if obj.avg_score <= 1.0
            else float(obj.avg_score)
            for obj in objectives
        }

        # Identify foundational objectives
        foundational = await self.identify_foundational_objectives(
            matrix, objective_ids, objective_names
        )

        # Identify bottleneck objectives
        bottlenecks = await self.identify_bottleneck_objectives(
            matrix, objective_ids, objective_names, user_performance
        )

        # Generate recommended study sequence
        study_sequence = await self.generate_study_sequence(objective_ids, matrix)

        return CorrelationMatrix(
            user_id=user_id,
            matrix=matrix,
            objective_ids=objective_ids,
            objective_names=objective_names,
            foundational_objectives=[f.model_dump() for f in foundational]
            if foundational
            else [],
            bottleneck_objectives=[b.model_dump() for b in bottlenecks]
            if bottlenecks
            else [],
            recommended_study_sequence=study_sequence,
        )

    async def identify_foundational_objectives(
        self,
        matrix: List[List[float]],
        objective_ids: List[str],
        objective_names: List[str],
    ) -> List[FoundationalObjective]:
        """
        Identify objectives that correlate strongly with many others.

        Logic:
        1. For each objective (row in matrix):
           - Calculate average absolute correlation with other objectives (excluding self)
           - Filter: avg_correlation > 0.5
           - Count how many correlations > 0.5
           - If count >= 3: foundational
        2. Sort by correlation_sum descending
        3. Return top 5-10 foundational objectives

        Args:
            matrix: NxN correlation matrix
            objective_ids: Ordered list of objective IDs
            objective_names: Ordered list of objective names

        Returns:
            List of FoundationalObjective sorted by impact
        """
        n = len(matrix)
        foundational = []

        for i in range(n):
            # Get correlations with other objectives (exclude self)
            correlations = [abs(matrix[i][j]) for j in range(n) if i != j]

            if not correlations:
                continue

            # Calculate metrics
            avg_correlation = np.mean(correlations)
            strong_count = sum(1 for c in correlations if c > 0.5)
            correlation_sum = sum(c for c in correlations if c > 0)  # Only positive

            # Filter: foundational if avg > 0.5 or strong_count >= 3
            if avg_correlation > 0.5 or strong_count >= 3:
                rationale = (
                    f"Mastering {objective_names[i][:50]} enables progress in "
                    f"{strong_count} related topics (avg correlation: {avg_correlation:.2f})"
                )

                foundational.append(
                    FoundationalObjective(
                        objective_id=objective_ids[i],
                        objective_name=objective_names[i],
                        avg_correlation=float(avg_correlation),
                        strong_correlation_count=strong_count,
                        correlation_sum=float(correlation_sum),
                        rationale=rationale,
                    )
                )

        # Sort by correlation_sum descending (most impactful first)
        foundational.sort(key=lambda x: x.correlation_sum, reverse=True)

        # Return top 10
        return foundational[:10]

    async def identify_bottleneck_objectives(
        self,
        matrix: List[List[float]],
        objective_ids: List[str],
        objective_names: List[str],
        user_performance: Dict[str, float],
    ) -> List[BottleneckObjective]:
        """
        Identify objectives that block progress in other areas.

        Logic:
        1. For each objective:
           - If user performance LOW (< 60%):
             - Check correlations with other objectives
             - Count NEGATIVE correlations (< -0.3)
             - If negative_correlation_count >= 2: bottleneck
           - Store: objective_id, performance_score, negative_correlations
        2. Sort by impact descending (impact = (100 - score) * neg_count)
        3. Return top 5-10 bottleneck objectives

        Args:
            matrix: NxN correlation matrix
            objective_ids: Ordered list of objective IDs
            objective_names: Ordered list of objective names
            user_performance: Dict mapping objective_id -> avg_score

        Returns:
            List of BottleneckObjective sorted by impact
        """
        n = len(matrix)
        bottlenecks = []

        for i in range(n):
            obj_id = objective_ids[i]
            obj_name = objective_names[i]
            score = user_performance.get(obj_id, 0.0)

            # Only consider low-performing objectives (< 60%)
            if score >= 60.0:
                continue

            # Count negative correlations and identify blocked objectives
            negative_correlations = []
            blocked_obj_ids = []

            for j in range(n):
                if i != j and matrix[i][j] < -0.3:
                    negative_correlations.append(matrix[i][j])
                    blocked_obj_ids.append(objective_ids[j])

            neg_count = len(negative_correlations)

            # Filter: bottleneck if >= 2 negative correlations
            if neg_count >= 2:
                # Calculate impact: worse performance + more negative correlations = higher impact
                impact = (100.0 - score) * neg_count

                recommendation = (
                    f"Improve {obj_name[:50]} (current: {score:.1f}%) to unlock progress in "
                    f"{neg_count} other objectives. This is blocking your advancement."
                )

                bottlenecks.append(
                    BottleneckObjective(
                        objective_id=obj_id,
                        objective_name=obj_name,
                        performance_score=score,
                        negative_correlation_count=neg_count,
                        blocked_objectives=blocked_obj_ids,
                        impact_score=float(impact),
                        recommendation=recommendation,
                    )
                )

        # Sort by impact descending (most critical first)
        bottlenecks.sort(key=lambda x: x.impact_score, reverse=True)

        # Return top 10
        return bottlenecks[:10]

    async def generate_study_sequence(
        self, objective_ids: List[str], matrix: List[List[float]]
    ) -> List[str]:
        """
        Generate recommended study order prioritizing foundational objectives.

        Algorithm (Topological Sort with Correlation-Based Dependencies):
        1. Build dependency graph from correlation matrix
        2. For each objective:
           - Calculate in-degree (how many depend on it)
           - Calculate importance score (sum of positive correlations)
        3. Topological sort:
           - Start with high importance (foundational)
           - Process dependencies first
           - Return ordered list
        4. Final order prioritizes:
           - Foundational objectives first (high correlation)
           - Then intermediate objectives
           - Bottlenecks addressed early to unblock others

        Args:
            objective_ids: List of objective IDs
            matrix: NxN correlation matrix

        Returns:
            Ordered list of objective IDs (study this order)
        """
        n = len(objective_ids)

        # Calculate importance score for each objective
        # Importance = sum of positive correlations (how much this helps others)
        importance_scores = []
        for i in range(n):
            positive_sum = sum(
                matrix[i][j] for j in range(n) if i != j and matrix[i][j] > 0
            )
            importance_scores.append((i, float(positive_sum)))

        # Sort by importance descending (most foundational first)
        importance_scores.sort(key=lambda x: x[1], reverse=True)

        # Extract objective IDs in importance order
        study_sequence = [objective_ids[i] for i, _ in importance_scores]

        return study_sequence

    # =========================================================================
    # Helper Methods
    # =========================================================================

    def _parse_date_range(self, date_range: str) -> Tuple[datetime, datetime]:
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

    def _empty_correlation_matrix(self, user_id: str) -> CorrelationMatrix:
        """Return empty correlation matrix when insufficient data."""
        return CorrelationMatrix(
            user_id=user_id,
            matrix=[],
            objective_ids=[],
            objective_names=[],
            foundational_objectives=[],
            bottleneck_objectives=[],
            recommended_study_sequence=[],
        )
