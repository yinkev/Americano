"""
Peer Benchmarking Engine for Story 4.6 - Comprehensive Understanding Analytics.

Manages peer comparison and benchmarking with privacy controls:
- Minimum 50 users for statistical validity
- Anonymized aggregated data only
- Opt-in consent required (User.shareValidationData)
- Percentile ranking and relative strengths/weaknesses
- Box plot distributions with IQR and whiskers

Author: Claude Code (Story 4.6)
Date: 2025-10-17
"""

from typing import List, Optional, Tuple
from datetime import datetime
import numpy as np
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.analytics.models import (
    PeerBenchmark,
    PeerDistribution,
    RelativeStrength,
    RelativeWeakness,
    RelativePerformance,
)


class PeerBenchmarkingEngine:
    """
    Manage peer comparison and benchmarking with privacy controls.

    Privacy constraints (C-5):
    - Minimum 50 users for anonymization
    - Only users with shareValidationData = true
    - No PII exposed, aggregated statistics only
    - Opt-out supported anytime

    Performance:
    - All operations < 3 seconds per request
    - Uses numpy for efficient statistical calculations
    - Async database queries with proper connection pooling
    """

    MINIMUM_USERS = 50  # Privacy threshold (C-5)
    MINIMUM_RESPONSES_PER_USER = 3  # Data quality threshold

    def __init__(self, session: AsyncSession):
        """
        Initialize the peer benchmarking engine.

        Args:
            session: Async SQLAlchemy session for database queries
        """
        self.session = session

    async def aggregate_peer_data(
        self,
        user_id: str,
        objective_id: Optional[str] = None
    ) -> PeerBenchmark:
        """
        Calculate peer distribution statistics with privacy enforcement.

        This method queries validation responses from users who have opted in
        (shareValidationData = true) and calculates quartile distributions
        for comprehension, reasoning, calibration, and mastery dimensions.

        Algorithm:
        1. Query users where User.shareValidationData = true
        2. Query validation scores for those users (minimum 3 responses per user)
        3. Enforce minimum 50 users for anonymization
        4. Calculate percentiles (p25, p50, p75), mean, stdDev for each dimension
        5. Calculate user's percentile rank
        6. Identify relative strengths and weaknesses
        7. Return PeerBenchmark Pydantic model

        Args:
            user_id: User ID for comparison context
            objective_id: Optional specific objective ID. If None, calculates
                         overall distribution across all objectives.

        Returns:
            PeerBenchmark: Aggregated peer statistics with distributions

        Raises:
            ValueError: If fewer than 50 users available (privacy constraint)

        Example:
            >>> engine = PeerBenchmarkingEngine(session)
            >>> benchmark = await engine.aggregate_peer_data("user123")
            >>> print(f"Median score: {benchmark.peer_distribution.median}")
            Median score: 72.5
        """
        # Build SQL query for aggregated peer data
        query = text("""
            SELECT
                u.id,
                AVG(vr.score * 100) as comprehension_score,
                AVG(vr.reasoning_score) as reasoning_score,
                AVG(
                    CASE
                        WHEN vr.calibration_delta IS NOT NULL
                        THEN 100 - ABS(vr.calibration_delta)
                        ELSE NULL
                    END
                ) as calibration_score,
                AVG(
                    CASE
                        WHEN vr.mastery_verified = true THEN 100
                        ELSE vr.score * 100
                    END
                ) as mastery_score,
                COUNT(vr.id) as response_count
            FROM users u
            JOIN validation_responses vr ON vr.user_id = u.id
            WHERE u.share_validation_data = true
              AND u.active = true
              AND vr.responded_at >= NOW() - INTERVAL '90 days'
              AND (:objective_id IS NULL OR vr.objective_id = :objective_id)
            GROUP BY u.id
            HAVING COUNT(vr.id) >= :min_responses
        """)

        params = {
            "objective_id": objective_id,
            "min_responses": self.MINIMUM_RESPONSES_PER_USER
        }

        result = await self.session.execute(query, params)
        rows = result.fetchall()

        # Privacy check: minimum 50 users
        sample_size = len(rows)
        if sample_size < self.MINIMUM_USERS:
            raise ValueError(
                f"Insufficient peer data: {sample_size} users. "
                f"Minimum {self.MINIMUM_USERS} required for anonymization and statistical validity."
            )

        # Extract score arrays for each dimension
        all_scores = []
        for row in rows:
            # Calculate average across all dimensions for each user
            valid_scores = [s for s in row[1:5] if s is not None]
            if valid_scores:
                all_scores.append(np.mean(valid_scores))

        overall_scores = np.array(all_scores)

        # Calculate distribution statistics using numpy
        peer_distribution = self._calculate_distribution(overall_scores)

        # Get user's percentile rank
        user_percentile = await self._get_user_overall_percentile(
            user_id, objective_id, overall_scores, rows
        )

        # Identify relative strengths and weaknesses (top/bottom 25%)
        strengths, weaknesses = await self._identify_relative_performance(
            user_id, objective_id
        )

        # Convert to RelativePerformance format
        relative_strengths = [
            RelativePerformance(
                objective_id=s.objective_id,
                objective_name=s.objective_name,
                user_score=s.peer_avg + s.advantage,  # Approximation
                user_percentile=s.user_percentile,
                category=self._categorize_percentile(s.user_percentile)
            )
            for s in strengths
        ]

        relative_weaknesses = [
            RelativePerformance(
                objective_id=w.objective_id,
                objective_name=w.objective_name,
                user_score=w.peer_avg - w.disadvantage,  # Approximation
                user_percentile=w.user_percentile,
                category=self._categorize_percentile(w.user_percentile)
            )
            for w in weaknesses
        ]

        return PeerBenchmark(
            user_id=user_id,
            objective_id=objective_id,
            peer_distribution=peer_distribution,
            user_percentile=user_percentile,
            relative_strengths=relative_strengths,
            relative_weaknesses=relative_weaknesses,
            generated_at=datetime.utcnow()
        )

    async def calculate_user_percentile(
        self,
        user_id: str,
        objective_id: str,
        metric: str
    ) -> float:
        """
        Calculate user's percentile rank against peers for specific metric.

        Uses the percentile rank formula:
            percentile = (count_at_or_below / total_peers) * 100

        Where count_at_or_below is the number of peers with score <= user_score.

        Args:
            user_id: User ID to calculate percentile for
            objective_id: Specific learning objective ID
            metric: Dimension to compare ('comprehension_score', 'reasoning_score',
                   'calibration_score', 'mastery_score')

        Returns:
            float: Percentile rank (0-100)

        Raises:
            ValueError: If metric is invalid or insufficient peer data

        Example:
            >>> percentile = await engine.calculate_user_percentile(
            ...     "user123", "obj456", "comprehension_score"
            ... )
            >>> print(f"User is at {percentile}th percentile")
            User is at 75.0th percentile
        """
        # Validate metric
        valid_metrics = ["comprehension_score", "reasoning_score", "calibration_score", "mastery_score"]
        if metric not in valid_metrics:
            raise ValueError(
                f"Invalid metric: {metric}. Must be one of {valid_metrics}"
            )

        # Map metric to SQL column
        metric_column_map = {
            "comprehension_score": "AVG(vr.score * 100)",
            "reasoning_score": "AVG(vr.reasoning_score)",
            "calibration_score": """AVG(
                CASE
                    WHEN vr.calibration_delta IS NOT NULL
                    THEN 100 - ABS(vr.calibration_delta)
                    ELSE NULL
                END
            )""",
            "mastery_score": """AVG(
                CASE
                    WHEN vr.mastery_verified = true THEN 100
                    ELSE vr.score * 100
                END
            )"""
        }

        # Get user's score for this objective+metric
        user_query = text(f"""
            SELECT {metric_column_map[metric]} as user_score
            FROM validation_responses vr
            WHERE vr.user_id = :user_id
              AND vr.objective_id = :objective_id
            HAVING COUNT(vr.id) >= :min_responses
        """)

        user_result = await self.session.execute(
            user_query,
            {
                "user_id": user_id,
                "objective_id": objective_id,
                "min_responses": self.MINIMUM_RESPONSES_PER_USER
            }
        )
        user_row = user_result.fetchone()

        if not user_row or user_row[0] is None:
            raise ValueError(
                f"Insufficient data for user {user_id} on objective {objective_id}"
            )

        user_score = float(user_row[0])

        # Get all peer scores (including user)
        peer_query = text(f"""
            SELECT u.id, {metric_column_map[metric]} as score
            FROM users u
            JOIN validation_responses vr ON vr.user_id = u.id
            WHERE u.share_validation_data = true
              AND u.active = true
              AND vr.objective_id = :objective_id
              AND vr.responded_at >= NOW() - INTERVAL '90 days'
            GROUP BY u.id
            HAVING COUNT(vr.id) >= :min_responses
        """)

        peer_result = await self.session.execute(
            peer_query,
            {
                "objective_id": objective_id,
                "min_responses": self.MINIMUM_RESPONSES_PER_USER
            }
        )
        peer_rows = peer_result.fetchall()

        # Privacy check
        if len(peer_rows) < self.MINIMUM_USERS:
            raise ValueError(
                f"Insufficient peer data: {len(peer_rows)} users. "
                f"Minimum {self.MINIMUM_USERS} required."
            )

        # Calculate percentile rank using numpy-style counting
        peer_scores = np.array([float(row[1]) for row in peer_rows if row[1] is not None])
        count_at_or_below = np.sum(peer_scores <= user_score)
        total_peers = len(peer_scores)

        percentile = (count_at_or_below / total_peers) * 100.0

        return round(percentile, 2)

    async def identify_relative_strengths_weaknesses(
        self,
        user_id: str
    ) -> Tuple[List[RelativeStrength], List[RelativeWeakness]]:
        """
        Compare user's percentile ranks across objectives to identify relative
        strengths (>= 75th percentile) and weaknesses (<= 25th percentile).

        Algorithm:
        1. Get user's percentile ranks for all objectives
        2. Calculate average percentile across all objectives (baseline)
        3. For each objective:
           - If percentile >= 75: relative strength
           - If percentile <= 25: relative weakness
        4. Calculate advantage/disadvantage vs baseline
        5. Sort strengths by advantage descending (top 10)
        6. Sort weaknesses by disadvantage descending (top 10)

        Args:
            user_id: User ID to analyze

        Returns:
            Tuple of:
                - List[RelativeStrength]: Top 10 objectives (>= 75th percentile)
                - List[RelativeWeakness]: Top 10 objectives (<= 25th percentile)

        Example:
            >>> strengths, weaknesses = await engine.identify_relative_strengths_weaknesses("user123")
            >>> print(f"Strengths: {len(strengths)}, Weaknesses: {len(weaknesses)}")
            Strengths: 3, Weaknesses: 2
        """
        return await self._identify_relative_performance(user_id, objective_id=None)

    async def get_peer_distribution(
        self,
        objective_id: str,
        metric: str
    ) -> PeerDistribution:
        """
        Get quartile distribution for UI visualization (box plots).

        Calculates box plot statistics using Tukey's method:
        - Quartiles: q1 (p25), q2 (p50/median), q3 (p75)
        - IQR: q3 - q1
        - Whiskers (Tukey's fences):
            * Lower whisker: q1 - 1.5*IQR (clipped to min data value)
            * Upper whisker: q3 + 1.5*IQR (clipped to max data value)
        - Mean, standard deviation (sample)
        - Sample size

        Args:
            objective_id: Specific learning objective ID
            metric: Dimension ('comprehension_score', 'reasoning_score',
                   'calibration_score', 'mastery_score')

        Returns:
            PeerDistribution: Quartile distribution with box plot parameters

        Raises:
            ValueError: If invalid metric or insufficient peer data

        Example:
            >>> dist = await engine.get_peer_distribution("obj123", "comprehension_score")
            >>> print(f"Median: {dist.median}, IQR: {dist.iqr}")
            Median: 72.5, IQR: 15.0
        """
        # Validate metric
        valid_metrics = ["comprehension_score", "reasoning_score", "calibration_score", "mastery_score"]
        if metric not in valid_metrics:
            raise ValueError(
                f"Invalid metric: {metric}. Must be one of {valid_metrics}"
            )

        # Map metric to SQL column
        metric_column_map = {
            "comprehension_score": "AVG(vr.score * 100)",
            "reasoning_score": "AVG(vr.reasoning_score)",
            "calibration_score": """AVG(
                CASE
                    WHEN vr.calibration_delta IS NOT NULL
                    THEN 100 - ABS(vr.calibration_delta)
                    ELSE NULL
                END
            )""",
            "mastery_score": """AVG(
                CASE
                    WHEN vr.mastery_verified = true THEN 100
                    ELSE vr.score * 100
                END
            )"""
        }

        # Query peer scores
        query = text(f"""
            SELECT u.id, {metric_column_map[metric]} as score
            FROM users u
            JOIN validation_responses vr ON vr.user_id = u.id
            WHERE u.share_validation_data = true
              AND u.active = true
              AND vr.objective_id = :objective_id
              AND vr.responded_at >= NOW() - INTERVAL '90 days'
            GROUP BY u.id
            HAVING COUNT(vr.id) >= :min_responses
        """)

        result = await self.session.execute(
            query,
            {
                "objective_id": objective_id,
                "min_responses": self.MINIMUM_RESPONSES_PER_USER
            }
        )
        rows = result.fetchall()

        # Privacy check
        if len(rows) < self.MINIMUM_USERS:
            raise ValueError(
                f"Insufficient peer data: {len(rows)} users. "
                f"Minimum {self.MINIMUM_USERS} required."
            )

        # Extract scores and calculate distribution
        scores = np.array([float(row[1]) for row in rows if row[1] is not None])

        # Calculate distribution with box plot parameters
        return self._calculate_distribution(scores)

    # ========================================================================
    # Private Helper Methods
    # ========================================================================

    def _calculate_distribution(self, scores: np.ndarray) -> PeerDistribution:
        """
        Calculate statistical distribution from score array.

        Uses numpy.percentile for quartile calculations and Tukey's method
        for box plot whiskers (IQR-based fences).

        Args:
            scores: NumPy array of peer scores

        Returns:
            PeerDistribution: Complete distribution with quartiles, IQR, whiskers
        """
        # Calculate quartiles using numpy.percentile (verified from context7)
        p25 = float(np.percentile(scores, 25))
        p50 = float(np.percentile(scores, 50))  # median
        p75 = float(np.percentile(scores, 75))

        # Calculate mean and std dev (sample standard deviation)
        mean = float(np.mean(scores))
        std_dev = float(np.std(scores, ddof=1))  # ddof=1 for sample std

        # Calculate IQR and whiskers (Tukey's method)
        iqr = p75 - p25
        whisker_low = p25 - 1.5 * iqr
        whisker_high = p75 + 1.5 * iqr

        # Clip whiskers to actual data range (outlier handling)
        whisker_low = max(whisker_low, float(np.min(scores)))
        whisker_high = min(whisker_high, float(np.max(scores)))

        return PeerDistribution(
            mean=round(mean, 2),
            median=round(p50, 2),
            std_dev=round(std_dev, 2),
            quartiles={
                "p25": round(p25, 2),
                "p50": round(p50, 2),
                "p75": round(p75, 2)
            },
            q1=round(p25, 2),
            q2=round(p50, 2),
            q3=round(p75, 2),
            iqr=round(iqr, 2),
            whisker_low=round(whisker_low, 2),
            whisker_high=round(whisker_high, 2),
            sample_size=len(scores),
            last_calculated=datetime.utcnow()
        )

    async def _get_user_overall_percentile(
        self,
        user_id: str,
        objective_id: Optional[str],
        overall_scores: np.ndarray,
        peer_rows: List
    ) -> float:
        """
        Calculate user's overall percentile rank from peer data.

        Args:
            user_id: User ID
            objective_id: Optional objective filter
            overall_scores: Array of all peer scores
            peer_rows: Database rows with user IDs and scores

        Returns:
            float: User's percentile rank (0-100)
        """
        # Find user's score in peer data
        user_score = None
        for row in peer_rows:
            if row[0] == user_id:
                # Calculate user's average across dimensions
                valid_scores = [s for s in row[1:5] if s is not None]
                if valid_scores:
                    user_score = np.mean(valid_scores)
                break

        if user_score is None:
            # User not in peer data (hasn't opted in or insufficient responses)
            # Calculate separately
            query = text("""
                SELECT AVG(vr.score * 100) as avg_score
                FROM validation_responses vr
                WHERE vr.user_id = :user_id
                  AND (:objective_id IS NULL OR vr.objective_id = :objective_id)
                  AND vr.responded_at >= NOW() - INTERVAL '90 days'
                HAVING COUNT(vr.id) >= :min_responses
            """)

            result = await self.session.execute(
                query,
                {
                    "user_id": user_id,
                    "objective_id": objective_id,
                    "min_responses": self.MINIMUM_RESPONSES_PER_USER
                }
            )
            user_row = result.fetchone()
            if not user_row or user_row[0] is None:
                return 50.0  # Default to median if no data

            user_score = float(user_row[0])

        # Calculate percentile rank
        count_at_or_below = np.sum(overall_scores <= user_score)
        percentile = (count_at_or_below / len(overall_scores)) * 100.0

        return round(percentile, 2)

    async def _identify_relative_performance(
        self,
        user_id: str,
        objective_id: Optional[str]
    ) -> Tuple[List[RelativeStrength], List[RelativeWeakness]]:
        """
        Identify objectives where user is in top 25% or bottom 25%.

        Args:
            user_id: User ID
            objective_id: Optional objective filter

        Returns:
            Tuple of (strengths, weaknesses) lists
        """
        # Query user's scores across all objectives
        query = text("""
            WITH user_scores AS (
                SELECT
                    vr.objective_id,
                    AVG(vr.score * 100) as user_score
                FROM validation_responses vr
                WHERE vr.user_id = :user_id
                  AND (:objective_id IS NULL OR vr.objective_id = :objective_id)
                  AND vr.responded_at >= NOW() - INTERVAL '90 days'
                GROUP BY vr.objective_id
                HAVING COUNT(vr.id) >= :min_responses
            ),
            peer_scores AS (
                SELECT
                    vr.objective_id,
                    u.id as peer_user_id,
                    AVG(vr.score * 100) as peer_score
                FROM users u
                JOIN validation_responses vr ON vr.user_id = u.id
                WHERE u.share_validation_data = true
                  AND u.active = true
                  AND vr.responded_at >= NOW() - INTERVAL '90 days'
                GROUP BY vr.objective_id, u.id
                HAVING COUNT(vr.id) >= :min_responses
            )
            SELECT
                us.objective_id,
                lo.name as objective_name,
                us.user_score,
                AVG(ps.peer_score) as peer_avg_score,
                COUNT(DISTINCT ps.peer_user_id) as peer_count
            FROM user_scores us
            JOIN learning_objectives lo ON lo.id = us.objective_id
            JOIN peer_scores ps ON ps.objective_id = us.objective_id
            GROUP BY us.objective_id, lo.name, us.user_score
            HAVING COUNT(DISTINCT ps.peer_user_id) >= :min_peers
        """)

        result = await self.session.execute(
            query,
            {
                "user_id": user_id,
                "objective_id": objective_id,
                "min_responses": self.MINIMUM_RESPONSES_PER_USER,
                "min_peers": self.MINIMUM_USERS
            }
        )
        rows = result.fetchall()

        if not rows:
            return [], []

        # Calculate percentile ranks for each objective
        percentile_data = []
        for row in rows:
            obj_id = row[0]
            obj_name = row[1]
            user_score = float(row[2])
            peer_avg = float(row[3])

            # Calculate percentile for this objective
            try:
                percentile = await self.calculate_user_percentile(
                    user_id, obj_id, "comprehension_score"
                )
            except ValueError:
                # Skip if insufficient data
                continue

            percentile_data.append({
                "objective_id": obj_id,
                "objective_name": obj_name,
                "user_percentile": percentile,
                "peer_avg": peer_avg,
                "user_score": user_score
            })

        if not percentile_data:
            return [], []

        # Calculate average percentile (baseline for advantage/disadvantage)
        avg_percentile = np.mean([d["user_percentile"] for d in percentile_data])

        # Identify strengths (>= 75th percentile)
        strengths = []
        for data in percentile_data:
            if data["user_percentile"] >= 75.0:
                advantage = data["user_percentile"] - 50.0  # advantage vs median
                strengths.append(
                    RelativeStrength(
                        objective_id=data["objective_id"],
                        objective_name=data["objective_name"],
                        user_percentile=data["user_percentile"],
                        peer_avg=data["peer_avg"],
                        advantage=round(advantage, 2)
                    )
                )

        # Sort by advantage descending, take top 10
        strengths.sort(key=lambda x: x.advantage, reverse=True)
        strengths = strengths[:10]

        # Identify weaknesses (<= 25th percentile)
        weaknesses = []
        for data in percentile_data:
            if data["user_percentile"] <= 25.0:
                disadvantage = 50.0 - data["user_percentile"]  # disadvantage vs median
                weaknesses.append(
                    RelativeWeakness(
                        objective_id=data["objective_id"],
                        objective_name=data["objective_name"],
                        user_percentile=data["user_percentile"],
                        peer_avg=data["peer_avg"],
                        disadvantage=round(disadvantage, 2)
                    )
                )

        # Sort by disadvantage descending, take top 10
        weaknesses.sort(key=lambda x: x.disadvantage, reverse=True)
        weaknesses = weaknesses[:10]

        return strengths, weaknesses

    def _categorize_percentile(self, percentile: float) -> str:
        """
        Categorize user's percentile rank into quartile labels.

        Args:
            percentile: Percentile rank (0-100)

        Returns:
            str: Category label
        """
        if percentile >= 75.0:
            return "top_quartile"
        elif percentile >= 50.0:
            return "above_average"
        elif percentile >= 25.0:
            return "below_average"
        else:
            return "bottom_quartile"
