"""
Challenge Identification Engine (Story 4.3 Task 2)

Identifies vulnerable concepts for targeted challenge generation.
Analyzes performance patterns to detect overconfidence, partial understanding,
and recent mistakes.
"""

from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime, timedelta


class VulnerableConceptScore(BaseModel):
    """
    Model for a vulnerable concept with calculated risk score.

    Vulnerability scoring algorithm:
    score = (overconfidence * 0.4) + (partial_understanding * 0.3) + (recent_mistakes * 0.3)
    """

    concept_id: str = Field(..., description="Learning objective or concept ID")
    concept_name: str = Field(..., description="Concept display name")
    vulnerability_score: float = Field(..., ge=0, le=100, description="Composite vulnerability score (0-100)")
    vulnerability_type: str = Field(
        ...,
        description="Primary vulnerability type: overconfidence | partial_understanding | recent_mistakes"
    )

    # Component scores for transparency
    overconfidence_score: float = Field(..., ge=0, le=100, description="Overconfidence component")
    partial_understanding_score: float = Field(..., ge=0, le=100, description="Partial understanding component")
    recent_mistakes_score: float = Field(..., ge=0, le=100, description="Recent mistakes component")

    # Performance metadata
    avg_confidence: float = Field(..., description="Average self-reported confidence (1-5)")
    avg_comprehension_score: float = Field(..., description="Average comprehension score (0-100)")
    failure_count: int = Field(..., description="Number of failures in last 7 days")
    last_attempted_at: Optional[datetime] = Field(None, description="Last attempt timestamp")


class ChallengeIdentificationResult(BaseModel):
    """Response model for challenge identification."""

    vulnerable_concepts: List[VulnerableConceptScore] = Field(
        ...,
        description="Top 5 vulnerable concepts ranked by score"
    )
    user_id: str = Field(..., description="User ID for tracking")
    identified_at: datetime = Field(default_factory=datetime.utcnow, description="Identification timestamp")


class ChallengeIdentifier:
    """
    Identifies vulnerable concepts for controlled failure challenges.

    Uses weighted scoring algorithm to detect:
    1. Overconfidence: High confidence (4-5) but low scores (40-59%)
    2. Partial Understanding: Comprehension scores 60-79% (from Story 4.1)
    3. Recent Mistakes: 3+ failures in last 7 days
    """

    def __init__(self):
        """Initialize the challenge identifier."""
        # Weights for vulnerability scoring
        self.OVERCONFIDENCE_WEIGHT = 0.4
        self.PARTIAL_UNDERSTANDING_WEIGHT = 0.3
        self.RECENT_MISTAKES_WEIGHT = 0.3

        # Thresholds for component scoring
        self.HIGH_CONFIDENCE_THRESHOLD = 3.5  # 4-5 on 1-5 scale (normalized: 3.5/5 = 0.7)
        self.LOW_SCORE_MAX = 59  # Scores below 60% indicate low performance
        self.PARTIAL_UNDERSTANDING_MIN = 60  # 60-79% range
        self.PARTIAL_UNDERSTANDING_MAX = 79
        self.RECENT_MISTAKES_WINDOW_DAYS = 7
        self.RECENT_MISTAKES_THRESHOLD = 3

    async def identify_vulnerable_concepts(
        self,
        user_id: str,
        performance_data: List[dict],
        limit: int = 5
    ) -> ChallengeIdentificationResult:
        """
        Identify top vulnerable concepts for a user.

        Args:
            user_id: User identifier
            performance_data: List of performance records with structure:
                {
                    "objective_id": str,
                    "objective_text": str,
                    "confidence_level": int (1-5),
                    "comprehension_score": int (0-100),
                    "is_failure": bool (score < 60),
                    "attempted_at": datetime (ISO string)
                }
            limit: Maximum number of concepts to return (default: 5)

        Returns:
            ChallengeIdentificationResult with top 5 vulnerable concepts
        """
        # Group performance data by concept
        concept_map = {}

        for record in performance_data:
            obj_id = record["objective_id"]

            if obj_id not in concept_map:
                concept_map[obj_id] = {
                    "objective_id": obj_id,
                    "objective_text": record["objective_text"],
                    "confidence_levels": [],
                    "comprehension_scores": [],
                    "failures": [],
                    "attempts": []
                }

            concept_map[obj_id]["confidence_levels"].append(record["confidence_level"])
            concept_map[obj_id]["comprehension_scores"].append(record["comprehension_score"])
            concept_map[obj_id]["attempts"].append(record["attempted_at"])

            if record.get("is_failure", False) or record["comprehension_score"] < 60:
                concept_map[obj_id]["failures"].append({
                    "score": record["comprehension_score"],
                    "attempted_at": record["attempted_at"]
                })

        # Calculate vulnerability scores for each concept
        vulnerable_concepts = []

        for obj_id, data in concept_map.items():
            # Calculate averages
            avg_confidence = sum(data["confidence_levels"]) / len(data["confidence_levels"])
            avg_score = sum(data["comprehension_scores"]) / len(data["comprehension_scores"])

            # Count recent failures (last 7 days)
            cutoff_date = datetime.utcnow() - timedelta(days=self.RECENT_MISTAKES_WINDOW_DAYS)
            recent_failures = sum(
                1 for failure in data["failures"]
                if self._parse_datetime(failure["attempted_at"]) > cutoff_date
            )

            # Calculate component scores
            overconfidence_score = self._calculate_overconfidence_score(
                avg_confidence, avg_score
            )
            partial_understanding_score = self._calculate_partial_understanding_score(
                avg_score
            )
            recent_mistakes_score = self._calculate_recent_mistakes_score(
                recent_failures
            )

            # Calculate weighted vulnerability score
            vulnerability_score = (
                overconfidence_score * self.OVERCONFIDENCE_WEIGHT +
                partial_understanding_score * self.PARTIAL_UNDERSTANDING_WEIGHT +
                recent_mistakes_score * self.RECENT_MISTAKES_WEIGHT
            )

            # Determine primary vulnerability type (highest component)
            vulnerability_type = max(
                [
                    ("overconfidence", overconfidence_score),
                    ("partial_understanding", partial_understanding_score),
                    ("recent_mistakes", recent_mistakes_score)
                ],
                key=lambda x: x[1]
            )[0]

            # Get last attempted timestamp
            last_attempted = max(
                data["attempts"],
                key=lambda x: self._parse_datetime(x)
            ) if data["attempts"] else None

            vulnerable_concepts.append(
                VulnerableConceptScore(
                    concept_id=obj_id,
                    concept_name=data["objective_text"][:100],  # Truncate for display
                    vulnerability_score=round(vulnerability_score, 2),
                    vulnerability_type=vulnerability_type,
                    overconfidence_score=round(overconfidence_score, 2),
                    partial_understanding_score=round(partial_understanding_score, 2),
                    recent_mistakes_score=round(recent_mistakes_score, 2),
                    avg_confidence=round(avg_confidence, 2),
                    avg_comprehension_score=round(avg_score, 2),
                    failure_count=len(data["failures"]),
                    last_attempted_at=self._parse_datetime(last_attempted) if last_attempted else None
                )
            )

        # Sort by vulnerability score (descending) and return top N
        vulnerable_concepts.sort(key=lambda x: x.vulnerability_score, reverse=True)
        top_concepts = vulnerable_concepts[:limit]

        return ChallengeIdentificationResult(
            vulnerable_concepts=top_concepts,
            user_id=user_id
        )

    def _calculate_overconfidence_score(
        self,
        avg_confidence: float,
        avg_score: float
    ) -> float:
        """
        Calculate overconfidence component score.

        Formula: overconfidence = max(0, avg_confidence_normalized - avg_score_normalized) * 100

        High scores indicate user feels more confident than performance shows.

        Args:
            avg_confidence: Average confidence level (1-5 scale)
            avg_score: Average comprehension score (0-100 scale)

        Returns:
            Overconfidence score (0-100)
        """
        # Normalize confidence to 0-100 scale (1-5 → 0-100)
        confidence_normalized = ((avg_confidence - 1) / 4) * 100

        # Calculate gap (positive = overconfident)
        confidence_gap = confidence_normalized - avg_score

        # Return score (capped at 100, minimum 0)
        return max(0, min(100, confidence_gap * 2))  # Amplify gap for scoring

    def _calculate_partial_understanding_score(self, avg_score: float) -> float:
        """
        Calculate partial understanding component score.

        Scores in 60-79% range indicate partial understanding (most vulnerable to challenge).

        Args:
            avg_score: Average comprehension score (0-100 scale)

        Returns:
            Partial understanding score (0-100)
        """
        if self.PARTIAL_UNDERSTANDING_MIN <= avg_score <= self.PARTIAL_UNDERSTANDING_MAX:
            # Peak vulnerability at 70% (middle of 60-79 range)
            distance_from_peak = abs(avg_score - 70)
            # Score decreases linearly from peak (70 → 100 points, 60 or 79 → 0 points)
            return 100 - (distance_from_peak * 10)
        else:
            return 0

    def _calculate_recent_mistakes_score(self, failure_count: int) -> float:
        """
        Calculate recent mistakes component score.

        Args:
            failure_count: Number of failures in last 7 days

        Returns:
            Recent mistakes score (0-100)
        """
        if failure_count >= self.RECENT_MISTAKES_THRESHOLD:
            # Scale: 3 failures = 50 points, 5+ failures = 100 points
            return min(100, (failure_count / 5) * 100)
        else:
            return 0

    def _parse_datetime(self, dt_value) -> datetime:
        """
        Parse datetime from various formats.

        Args:
            dt_value: datetime object or ISO string

        Returns:
            datetime object
        """
        if isinstance(dt_value, datetime):
            return dt_value
        elif isinstance(dt_value, str):
            # Parse ISO format string
            return datetime.fromisoformat(dt_value.replace('Z', '+00:00'))
        else:
            return datetime.utcnow()
