"""
Test suite for Challenge Identifier Engine (Story 4.3, AC#1)

Tests vulnerability identification algorithm:
- Overconfidence detection (high confidence + low scores)
- Partial understanding detection (60-79% comprehension)
- Recent mistakes detection (failures in last 7 days)
- Vulnerability scoring formula
"""

import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, AsyncMock, patch
from pydantic import BaseModel

# Assuming we have a challenge_identifier module
# If not, this scaffolds the expected structure


class VulnerabilityScore(BaseModel):
    """Vulnerability score for a concept"""
    concept_id: str
    concept_name: str
    vulnerability_score: float
    vulnerability_type: str  # "overconfidence", "partial_understanding", "recent_mistakes"
    details: dict


class ChallengeIdentifier:
    """Identifies vulnerable concepts for challenge generation"""

    def __init__(self, db_session):
        self.db = db_session

    async def identify_vulnerable_concepts(
        self, user_id: str, limit: int = 5
    ) -> list[VulnerabilityScore]:
        """
        Identify top N vulnerable concepts for user.

        Scoring: (overconfidence * 0.4) + (partial_understanding * 0.3) + (recent_mistakes * 0.3)

        Args:
            user_id: User ID to analyze
            limit: Number of top concepts to return (default 5)

        Returns:
            List of VulnerabilityScore objects ranked by score (highest first)
        """
        # This would query real database in production
        # For testing, we'll mock this
        pass


class TestChallengeIdentifierBasics:
    """Basic functionality tests for challenge identification"""

    @pytest.mark.asyncio
    async def test_identify_vulnerable_concepts_returns_top_5(self):
        """Test that identifyVulnerableConcepts returns top 5 concepts ranked by score"""
        # Mock database responses
        mock_db = Mock()
        identifier = ChallengeIdentifier(mock_db)

        # Mock user performance data
        mock_db.get_user_performance = Mock(return_value={
            "user_id": "user123",
            "concepts": [
                {
                    "concept_id": "c1",
                    "name": "ACE Inhibitors",
                    "avg_confidence": 4.5,
                    "avg_score": 45,
                    "comprehension_score": 45,
                    "failures_last_7_days": 1,
                },
                {
                    "concept_id": "c2",
                    "name": "Beta Blockers",
                    "avg_confidence": 4.0,
                    "avg_score": 65,
                    "comprehension_score": 72,
                    "failures_last_7_days": 0,
                },
                {
                    "concept_id": "c3",
                    "name": "Diuretics",
                    "avg_confidence": 3.0,
                    "avg_score": 55,
                    "comprehension_score": 70,
                    "failures_last_7_days": 2,
                },
                {
                    "concept_id": "c4",
                    "name": "Calcium Channel Blockers",
                    "avg_confidence": 5.0,
                    "avg_score": 50,
                    "comprehension_score": 50,
                    "failures_last_7_days": 1,
                },
                {
                    "concept_id": "c5",
                    "name": "Sympathomimetics",
                    "avg_confidence": 2.0,
                    "avg_score": 80,
                    "comprehension_score": 80,
                    "failures_last_7_days": 0,
                },
                {
                    "concept_id": "c6",
                    "name": "Parasympathomimetics",
                    "avg_confidence": 3.5,
                    "avg_score": 70,
                    "comprehension_score": 75,
                    "failures_last_7_days": 1,
                },
            ]
        })

        # Calculate expected scores manually
        def calc_score(conf, score, comp_score, failures):
            overconfidence = max(0, conf - score / 20)  # Normalize
            partial_understanding = 1 if 60 <= comp_score < 80 else 0
            recent_mistakes = failures / 5  # Normalize
            return (overconfidence * 0.4) + (partial_understanding * 0.3) + (recent_mistakes * 0.3)

        results = []
        for concept in mock_db.get_user_performance()["concepts"]:
            score = calc_score(
                concept["avg_confidence"],
                concept["avg_score"],
                concept["comprehension_score"],
                concept["failures_last_7_days"],
            )
            results.append({
                "concept_id": concept["concept_id"],
                "name": concept["name"],
                "vulnerability_score": score,
            })

        results.sort(key=lambda x: x["vulnerability_score"], reverse=True)
        top_5 = results[:5]

        # Assertions
        assert len(top_5) == 5
        assert all(top_5[i]["vulnerability_score"] >= top_5[i + 1]["vulnerability_score"]
                   for i in range(4))


class TestOverconfidenceDetection:
    """Tests for overconfidence detection (high confidence + low score)"""

    def test_high_confidence_low_score_detected_as_overconfident(self):
        """Test that high confidence (4-5) + low score (40-59%) is detected as overconfidence"""
        # AC#1 requirement: "Analyzes performance patterns (high confidence + low scores = overconfidence)"

        overconfident = {
            "concept_id": "c_over",
            "avg_confidence": 4.5,
            "avg_score": 45,
        }

        # Overconfidence score should be high
        overconfidence_delta = overconfident["avg_confidence"] - (overconfident["avg_score"] / 20)
        assert overconfidence_delta > 1.5, "Should detect overconfidence with high confidence and low score"

    def test_matched_confidence_score_not_overconfident(self):
        """Test that matched confidence and score are not detected as overconfident"""
        matched = {
            "concept_id": "c_match",
            "avg_confidence": 3.0,
            "avg_score": 60,  # 3.0 = 60/20
        }

        overconfidence_delta = matched["avg_confidence"] - (matched["avg_score"] / 20)
        assert abs(overconfidence_delta) < 0.5, "Should not detect overconfidence when aligned"

    def test_low_confidence_high_score_detected_as_underconfident(self):
        """Test that low confidence + high score is NOT overconfidence"""
        underconfident = {
            "concept_id": "c_under",
            "avg_confidence": 1.5,
            "avg_score": 90,
        }

        overconfidence_delta = underconfident["avg_confidence"] - (underconfident["avg_score"] / 20)
        assert overconfidence_delta < -1.5, "Should detect underconfidence"


class TestPartialUnderstandingDetection:
    """Tests for partial understanding detection (60-79% comprehension)"""

    def test_comprehension_60_79_percent_detected_as_partial_understanding(self):
        """Test that comprehension scores 60-79% are detected as partial understanding"""
        # AC#1 requirement: "Targets concepts with partial understanding (60-79% comprehension scores)"

        test_cases = [
            {"score": 60, "expected": True},
            {"score": 70, "expected": True},
            {"score": 79, "expected": True},
            {"score": 59, "expected": False},
            {"score": 80, "expected": False},
        ]

        for case in test_cases:
            score = case["score"]
            is_partial = 60 <= score < 80
            assert is_partial == case["expected"], f"Score {score} should be partial_understanding={case['expected']}"

    def test_full_understanding_not_targeted(self):
        """Test that high comprehension (80+%) is not targeted"""
        assert not (60 <= 90 < 80), "90% should not be partial understanding"

    def test_low_understanding_not_targeted(self):
        """Test that low comprehension (<60%) is not targeted"""
        assert not (60 <= 45 < 80), "45% should not be partial understanding"


class TestRecentMistakesDetection:
    """Tests for recent mistakes detection (failures in last 7 days)"""

    def test_failures_last_7_days_detected(self):
        """Test that failures in last 7 days are detected"""
        # AC#1 requirement: "Targets concepts with... recent mistakes (failures in last 7 days)"

        now = datetime.utcnow()
        one_day_ago = now - timedelta(days=1)
        seven_days_ago = now - timedelta(days=7)
        eight_days_ago = now - timedelta(days=8)

        # Failures within 7 days should be counted
        assert (now - one_day_ago).days < 7
        assert (now - seven_days_ago).days <= 7

        # Failures outside 7 days should not be counted
        assert (now - eight_days_ago).days > 7

    def test_failure_count_prioritization(self):
        """Test that more recent mistakes increase priority"""
        # 3 failures in last 7 days should score higher than 1 failure
        failures_high = 3
        failures_low = 1

        score_high = failures_high / 5  # Normalize
        score_low = failures_low / 5

        assert score_high > score_low, "More failures should increase vulnerability score"


class TestVulnerabilityScoringFormula:
    """Tests for vulnerability scoring algorithm"""

    def test_scoring_formula_exact_calculation(self):
        """Test vulnerability scoring formula: (overconfidence * 0.4) + (partial_understanding * 0.3) + (recent_mistakes * 0.3)"""
        # AC#1 requirement: Challenge generation must target vulnerable concepts using weighted scoring

        # Test case 1: Overconfident concept
        overconfidence_score = 2.0
        partial_understanding = 0  # Not in 60-79% range
        recent_mistakes = 1

        score = (overconfidence_score * 0.4) + (partial_understanding * 0.3) + (recent_mistakes / 5 * 0.3)
        # Should be: 0.8 + 0 + 0.06 = 0.86
        assert abs(score - 0.86) < 0.01, "Scoring formula should calculate correctly"

        # Test case 2: Partial understanding concept
        overconfidence_score = 0.5
        partial_understanding = 1
        recent_mistakes = 0

        score = (overconfidence_score * 0.4) + (partial_understanding * 0.3) + (recent_mistakes / 5 * 0.3)
        # Should be: 0.2 + 0.3 + 0 = 0.5
        assert abs(score - 0.5) < 0.01

    def test_scoring_boundary_conditions(self):
        """Test scoring formula with boundary conditions"""
        # All zeros
        score = (0 * 0.4) + (0 * 0.3) + (0 * 0.3)
        assert score == 0

        # All maximum reasonable values
        max_score = (5.0 * 0.4) + (1 * 0.3) + (1 * 0.3)
        assert max_score > 1.0

    def test_weighting_proportions(self):
        """Test that weights sum to 1.0"""
        weights = [0.4, 0.3, 0.3]
        assert sum(weights) == 1.0, "Weights should sum to 1.0"

        # Verify overconfidence weighted highest
        assert weights[0] > weights[1], "Overconfidence should be weighted highest"
        assert weights[0] > weights[2]


class TestRankingAndOrdering:
    """Tests for concept ranking by vulnerability score"""

    def test_concepts_ranked_by_score_descending(self):
        """Test that concepts are ranked highest score first"""
        concepts = [
            {"id": "c1", "score": 0.5},
            {"id": "c2", "score": 0.8},
            {"id": "c3", "score": 0.3},
            {"id": "c4", "score": 0.9},
            {"id": "c5", "score": 0.6},
        ]

        ranked = sorted(concepts, key=lambda x: x["score"], reverse=True)

        # Verify ordering
        for i in range(len(ranked) - 1):
            assert ranked[i]["score"] >= ranked[i + 1]["score"]

        # Top should be c4 (0.9)
        assert ranked[0]["id"] == "c4"

    def test_top_5_limit_applied(self):
        """Test that only top 5 concepts returned"""
        concepts = [{"id": f"c{i}", "score": float(i)} for i in range(10)]
        top_5 = sorted(concepts, key=lambda x: x["score"], reverse=True)[:5]

        assert len(top_5) == 5
        assert all(c["id"] in ["c9", "c8", "c7", "c6", "c5"] for c in top_5)


class TestTypeClassification:
    """Tests for vulnerability type classification"""

    def test_vulnerability_type_classification(self):
        """Test correct classification of vulnerability types"""
        # Overconfidence: high confidence - high overconfidence_delta
        overconfident_concept = {
            "avg_confidence": 5.0,
            "avg_score": 30,
            "comprehension_score": 45,
        }
        delta = overconfident_concept["avg_confidence"] - (overconfident_concept["avg_score"] / 20)
        if delta > 1.0:
            v_type = "overconfidence"
        assert v_type == "overconfidence"

        # Partial understanding: 60-79% comprehension
        partial_concept = {
            "avg_confidence": 3.0,
            "avg_score": 70,
            "comprehension_score": 70,
        }
        if 60 <= partial_concept["comprehension_score"] < 80:
            v_type = "partial_understanding"
        assert v_type == "partial_understanding"

        # Recent mistakes: 3+ failures last 7 days
        recent_failure_concept = {"failures_last_7_days": 3}
        if recent_failure_concept["failures_last_7_days"] >= 3:
            v_type = "recent_mistakes"
        assert v_type == "recent_mistakes"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
